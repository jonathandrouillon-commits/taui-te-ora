
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateFacebookAnimalMessage,
  type FacebookAnimal,
} from "../../../lib/facebook-animal-ai";

export const runtime = "nodejs";

type AnimalRecord = FacebookAnimal & {
  is_published?: boolean | null;
  is_adopted?: boolean | null;
  status?: string | null;
  facebook_shared_at?: string | null;
  facebook_post_id?: string | null;
  facebook_share_status?: string | null;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: AnimalRecord | null;
  old_record?: AnimalRecord | null;
};

type AnimalPhoto = {
  photo_url: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Configuration Supabase serveur manquante.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getFacebookConfig() {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken =
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const webhookSecret =
    process.env.FACEBOOK_WEBHOOK_SECRET;

  if (!pageId || !pageAccessToken || !webhookSecret) {
    throw new Error("Configuration Facebook serveur manquante.");
  }

  return {
    pageId,
    pageAccessToken,
    webhookSecret,
    graphVersion:
      process.env.FACEBOOK_GRAPH_VERSION || "v26.0",
    siteUrl: (
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.taui-te-ora.com"
    ).replace(/\/+$/, ""),
  };
}

async function publishFacebookPhoto(
  config: ReturnType<typeof getFacebookConfig>,
  photoUrl: string,
  caption: string
): Promise<string> {
  const endpoint =
    `https://graph.facebook.com/${config.graphVersion}` +
    `/${config.pageId}/photos`;

  const body = new URLSearchParams({
    url: photoUrl,
    caption,
    published: "true",
    access_token: config.pageAccessToken,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    body,
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error?.message ||
        "Erreur Facebook lors de la publication."
    );
  }

  return String(result?.post_id || result?.id || "");
}

async function publishFacebookLink(
  config: ReturnType<typeof getFacebookConfig>,
  animalUrl: string,
  message: string
): Promise<string> {
  const endpoint =
    `https://graph.facebook.com/${config.graphVersion}` +
    `/${config.pageId}/feed`;

  const body = new URLSearchParams({
    message,
    link: animalUrl,
    access_token: config.pageAccessToken,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    body,
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error?.message ||
        "Erreur Facebook lors de la publication."
    );
  }

  return String(result?.id || "");
}

export async function POST(request: NextRequest) {
  const expectedSecret =
    process.env.FACEBOOK_WEBHOOK_SECRET;

  const receivedSecret = request.headers.get(
    "x-facebook-webhook-secret"
  );

  if (
    !expectedSecret ||
    !receivedSecret ||
    receivedSecret !== expectedSecret
  ) {
    return NextResponse.json(
      { ok: false, error: "Webhook non autorisé." },
      { status: 401 }
    );
  }

  let payload: WebhookPayload;

  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload invalide." },
      { status: 400 }
    );
  }

  if (
    payload.schema !== "public" ||
    payload.table !== "animals"
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Table ignorée.",
    });
  }

  const record = payload.record;

  if (!record?.id) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Animal absent.",
    });
  }

  const animalId = record.id;

  // Publier uniquement les animaux disponibles.
  if (
    record.is_published !== true ||
    record.is_adopted === true ||
    record.status !== "available"
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Animal non disponible à l'adoption.",
    });
  }

  if (
    record.facebook_shared_at ||
    record.facebook_share_status === "published"
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Animal déjà publié sur Facebook.",
    });
  }

  const supabase = getSupabaseAdmin();

  // Verrou atomique : un seul webhook peut
  // déclencher une publication pour cet animal.
  const { data: animal, error: claimError } =
    await supabase
      .from("animals")
      .update({
        facebook_share_status: "processing",
        facebook_share_error: null,
      })
      .eq("id", animalId)
      .eq("is_published", true)
      .eq("is_adopted", false)
      .eq("status", "available")
      .is("facebook_shared_at", null)
      .or(
        "facebook_share_status.is.null," +
          "facebook_share_status.eq.error"
      )
      .select(`
        id,
        animal_name,
        animal_type,
        age_label,
        sex,
        breed,
        city,
        island,
        story,
        description_character,
        health_status,
        special_needs,
        ideal_family,
        relation_humain,
        matching_notes,
        compatible_chiens,
        compatible_chats,
        compatible_enfants,
        is_published,
        is_adopted,
        status,
        facebook_shared_at,
        facebook_post_id,
        facebook_share_status
      `)
      .maybeSingle();

  if (claimError) {
    return NextResponse.json(
      { ok: false, error: claimError.message },
      { status: 500 }
    );
  }

  if (!animal) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Publication déjà traitée ou en cours.",
    });
  }

  let publicationAttempted = false;
  let facebookPostId: string | null = null;

  try {
    const config = getFacebookConfig();

    const animalUrl =
      `${config.siteUrl}/animal/` +
      `${encodeURIComponent(animalId)}?adoption=1`;

    const message = await generateFacebookAnimalMessage(
      animal,
      animalUrl,
      "available"
    );

    const { data: photos, error: photosError } =
      await supabase
        .from("animal_photos")
        .select("photo_url,is_cover,sort_order")
        .eq("animal_id", animalId)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true });

    if (photosError) {
      console.error(
        "Erreur récupération photos Facebook :",
        photosError
      );
    }

    const photoRows = (photos || []) as AnimalPhoto[];

    const hasPhoto = photoRows.some(
      (photo) => Boolean(photo.photo_url)
    );

    const shareImageUrl =
      `${config.siteUrl}/api/facebook/share-image/` +
      `${encodeURIComponent(animalId)}?mode=available`;

    // Une fois l'envoi commencé, toute erreur
    // doit être vérifiée avant une nouvelle tentative.
    publicationAttempted = true;

    if (hasPhoto) {
      facebookPostId = await publishFacebookPhoto(
        config,
        shareImageUrl,
        message
      );
    } else {
      facebookPostId = await publishFacebookLink(
        config,
        animalUrl,
        message
      );
    }

    const { error: saveError } = await supabase
      .from("animals")
      .update({
        facebook_shared_at: new Date().toISOString(),
        facebook_post_id: facebookPostId || null,
        facebook_share_status: "published",
        facebook_share_error: null,
      })
      .eq("id", animalId);

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({
      ok: true,
      published: true,
      animal_id: animalId,
      facebook_post_id: facebookPostId,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue Facebook.";

    console.error(
      "Publication Facebook impossible :",
      error
    );

    // Après un appel Facebook, une erreur peut
    // survenir même si la publication a réussi.
    // On bloque donc toute relance automatique
    // jusqu'à vérification par un administrateur.
    const status = publicationAttempted
      ? "processing"
      : "error";

    const explanation = publicationAttempted
      ? "Publication Facebook à vérifier manuellement : " +
        message
      : message;

    await supabase
      .from("animals")
      .update({
        facebook_share_status: status,
        facebook_share_error:
          explanation.slice(0, 1000),
      })
      .eq("id", animalId)
      .is("facebook_shared_at", null);

    return NextResponse.json(
      {
        ok: false,
        animal_id: animalId,
        verification_required: publicationAttempted,
        error: explanation,
      },
      { status: 500 }
    );
  }
}
