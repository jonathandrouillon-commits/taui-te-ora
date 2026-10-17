
import { createClient } from "@supabase/supabase-js";
import {
  publishFacebook,
  tahitiDay,
  tahitiTime,
} from "../../../lib/facebook-autopost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Animal = {
  id: string;
  animal_name: string | null;
  animal_type: string | null;
  age_label: string | null;
  city: string | null;
  island: string | null;
  is_published: boolean;
  is_adopted: boolean;
  status: string | null;
  facebook_shared_at: string | null;
  facebook_share_status: string | null;
};

type Photo = {
  photo_url: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

type Media = {
  media_url: string | null;
  media_type: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Configuration Supabase manquante.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function publicImageUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function facebookMessage(animal: Animal, link: string) {
  const name = animal.animal_name?.trim() || "Un compagnon";

  const details = [
    animal.animal_type,
    animal.age_label,
    animal.city,
    animal.island,
  ]
    .filter(Boolean)
    .join(" • ");

  return [
    `🐾 ${name} attend sa famille ❤️`,
    details,
    "Et si votre rencontre commençait aujourd'hui ?",
    "Découvrez son histoire et sa fiche d'adoption sur TAUI TE ORA.",
    link,
    "#TauiTeOra #LesVeilleursDeKali #Adoption",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const db = database();
  const now = new Date();
  const day = tahitiDay(now);

  const { data: settings, error: settingsError } = await db
    .from("facebook_auto_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (settingsError || !settings) {
    return Response.json(
      {
        ok: false,
        error: settingsError?.message || "Paramètres absents.",
      },
      { status: 500 }
    );
  }

  if (
    !settings.enabled ||
    !settings.automatic_animals ||
    tahitiTime(now) < settings.daily_time
  ) {
    return Response.json({
      ok: true,
      skipped: "Publication désactivée ou trop tôt.",
    });
  }

  // Une seule réservation par journée à Tahiti.
  const { data: reservation, error: reservationError } =
    await db
      .from("facebook_auto_daily_runs")
      .insert({
        day,
        status: "processing",
      })
      .select("day")
      .maybeSingle();

  if (reservationError) {
    if (reservationError.code === "23505") {
      return Response.json({
        ok: true,
        skipped: "Exécution déjà enregistrée aujourd'hui.",
      });
    }

    return Response.json(
      { ok: false, error: reservationError.message },
      { status: 500 }
    );
  }

  if (!reservation) {
    return Response.json({
      ok: true,
      skipped: "Exécution déjà réservée.",
    });
  }

  let postId: string | null = null;
  let claimedAnimalId: string | null = null;
  let facebookAttempted = false;

  try {
    // Les publications manuelles ne sont jamais consommées.
    const { data: animals, error: animalsError } = await db
      .from("animals")
      .select(
        "id,animal_name,animal_type,age_label,city,island,is_published,is_adopted,status,facebook_shared_at,facebook_share_status"
      )
      .eq("is_published", true)
      .eq("is_adopted", false)
      .eq("status", "available")
      .is("facebook_shared_at", null)
      .order("id", { ascending: true })
      .limit(1000);

    if (animalsError) throw animalsError;

    const { data: previousPosts, error: historyError } =
      await db
        .from("facebook_auto_posts")
        .select("animal_id,status")
        .eq("post_type", "animal");

    if (historyError) throw historyError;

    const alreadyHandled = new Set(
      (previousPosts || [])
        .filter((post) =>
          ["published", "processing", "failed"].includes(
            post.status
          )
        )
        .map((post) => post.animal_id)
        .filter(Boolean)
    );

    const candidates: Animal[] = (animals || []).filter(
      (animal) =>
        !alreadyHandled.has(animal.id) &&
        !["published", "processing"].includes(
          animal.facebook_share_status || ""
        )
    );

    let selectedAnimal: Animal | null = null;
    let selectedPhoto: string | null = null;

    for (const animal of candidates) {
      const { data: photos, error: photosError } = await db
        .from("animal_photos")
        .select("photo_url,is_cover,sort_order")
        .eq("animal_id", animal.id)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true });

      if (photosError) throw photosError;

      let photo = ((photos || []) as Photo[])
        .map((item) => publicImageUrl(item.photo_url))
        .find((url): url is string => Boolean(url));

      if (!photo) {
        const { data: media, error: mediaError } = await db
          .from("animal_media")
          .select("media_url,media_type,is_cover,sort_order")
          .eq("animal_id", animal.id)
          .eq("media_type", "image")
          .order("is_cover", { ascending: false })
          .order("sort_order", { ascending: true });

        if (mediaError) throw mediaError;

        photo = ((media || []) as Media[])
          .map((item) => publicImageUrl(item.media_url))
          .find((url): url is string => Boolean(url));
      }

      if (!photo) continue;

      // Verrou partagé avec le webhook.
      // Un seul des deux processus peut obtenir cet animal.
      const { data: claimed, error: claimError } = await db
        .from("animals")
        .update({
          facebook_share_status: "processing",
          facebook_share_error: null,
        })
        .eq("id", animal.id)
        .eq("is_published", true)
        .eq("is_adopted", false)
        .eq("status", "available")
        .is("facebook_shared_at", null)
        .or(
          "facebook_share_status.is.null," +
            "facebook_share_status.eq.error"
        )
        .select(
          "id,animal_name,animal_type,age_label,city,island,is_published,is_adopted,status,facebook_shared_at,facebook_share_status"
        )
        .maybeSingle();

      if (claimError) throw claimError;

      // Déjà réservé par le webhook : animal suivant.
      if (!claimed) continue;

      claimedAnimalId = claimed.id;
      selectedAnimal = claimed;
      selectedPhoto = photo;
      break;
    }

    if (!selectedAnimal || !selectedPhoto) {
      await db
        .from("facebook_auto_daily_runs")
        .update({ status: "skipped" })
        .eq("day", day);

      return Response.json({
        ok: true,
        skipped: "Aucun nouvel animal avec photo disponible.",
      });
    }

    const animal: Animal = selectedAnimal;
    const photoUrl: string = selectedPhoto;

    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.taui-te-ora.com"
    ).replace(/\/+$/, "");

    const animalUrl =
      `${baseUrl}/animal/` +
      `${encodeURIComponent(animal.id)}?adoption=1`;

    const message = facebookMessage(animal, animalUrl);

    const { data: created, error: createError } = await db
      .from("facebook_auto_posts")
      .insert({
        post_type: "animal",
        title: animal.animal_name,
        animal_id: animal.id,
        message,
        image_url: photoUrl,
        link_url: animalUrl,
        media_type: "image",
        status: "processing",
        scheduled_at: now.toISOString(),
      })
      .select("id")
      .single();

    if (createError) throw createError;

    postId = created.id;

    // Toute erreur après l'appel Facebook demande
    // une vérification humaine avant relance.
    facebookAttempted = true;

    const facebookId = await publishFacebook(
      message,
      photoUrl,
      animalUrl,
      "image"
    );

    const publishedAt = new Date().toISOString();

    const { error: saveAnimalError } = await db
      .from("animals")
      .update({
        facebook_shared_at: publishedAt,
        facebook_post_id: facebookId,
        facebook_share_status: "published",
        facebook_share_error: null,
      })
      .eq("id", animal.id)
      .eq("facebook_share_status", "processing");

    if (saveAnimalError) throw saveAnimalError;

    const { error: savePostError } = await db
      .from("facebook_auto_posts")
      .update({
        status: "published",
        facebook_post_id: facebookId,
        published_at: publishedAt,
        updated_at: publishedAt,
      })
      .eq("id", postId);

    if (savePostError) throw savePostError;

    await db
      .from("facebook_auto_daily_runs")
      .update({
        status: "published",
        post_id: postId,
      })
      .eq("day", day);

    await db.from("facebook_auto_logs").insert({
      post_id: postId,
      action: "publish",
      status: "published",
      details: facebookId,
    });

    return Response.json({
      ok: true,
      published: true,
      animal_id: animal.id,
      facebook_post_id: facebookId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue.";

    const explanation = facebookAttempted
      ? "Publication Facebook à vérifier manuellement : " +
        message
      : message;

    if (postId) {
      await db
        .from("facebook_auto_posts")
        .update({
          status: facebookAttempted ? "processing" : "failed",
          error_message: explanation.slice(0, 1000),
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);
    }

    if (claimedAnimalId) {
      await db
        .from("animals")
        .update({
          // Avant Facebook : nouvelle tentative possible.
          // Après Facebook : blocage jusqu'à vérification.
          facebook_share_status:
            facebookAttempted ? "processing" : "error",
          facebook_share_error: explanation.slice(0, 1000),
        })
        .eq("id", claimedAnimalId)
        .is("facebook_shared_at", null)
        .eq("facebook_share_status", "processing");
    }

    await db
      .from("facebook_auto_daily_runs")
      .update({
        status: "failed",
        post_id: postId,
      })
      .eq("day", day);

    await db.from("facebook_auto_logs").insert({
      post_id: postId,
      action: "publish",
      status: "failed",
      details: explanation.slice(0, 1000),
    });

    return Response.json(
      {
        ok: false,
        verification_required: facebookAttempted,
        error: explanation,
      },
      { status: 500 }
    );
  }
}
