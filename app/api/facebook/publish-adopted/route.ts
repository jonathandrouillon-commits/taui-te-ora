import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type AnimalWebhookRecord = {
  id?: string;
  animal_name?: string | null;
  animal_type?: string | null;
  age_label?: string | null;
  sex?: string | null;
  breed?: string | null;
  city?: string | null;
  island?: string | null;
  is_published?: boolean | null;
  is_adopted?: boolean | null;
  facebook_adopted_shared_at?: string | null;
  facebook_adopted_post_id?: string | null;
  facebook_adopted_share_status?: string | null;
};

type SupabaseWebhookBody = {
  type?: string;
  table?: string;
  schema?: string;
  record?: AnimalWebhookRecord | null;
  old_record?: AnimalWebhookRecord | null;
};

type AnimalPhoto = {
  photo_url: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getFacebookConfig() {
  const pageId =
    process.env.FACEBOOK_PAGE_ID;

  const pageAccessToken =
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  const graphVersion =
    process.env.FACEBOOK_GRAPH_VERSION ||
    "v26.0";

  const webhookSecret =
    process.env.FACEBOOK_WEBHOOK_SECRET;

  if (
    !pageId ||
    !pageAccessToken ||
    !webhookSecret
  ) {
    throw new Error(
      "Configuration Facebook serveur manquante."
    );
  }

  return {
    pageId,
    pageAccessToken,
    graphVersion,
    webhookSecret,
  };
}

function cleanValue(
  value: string | null | undefined
) {
  return String(
    value || ""
  ).trim();
}

function buildFacebookAdoptedMessage(
  animal: AnimalWebhookRecord
) {
  const name =
    cleanValue(
      animal.animal_name
    ) || "Cet animal";

  const animalType =
    cleanValue(
      animal.animal_type
    );

  const city =
    cleanValue(
      animal.city
    );

  const island =
    cleanValue(
      animal.island
    );

  const location =
    [
      city,
      island,
    ].filter(Boolean);

  const lines: string[] = [];

  lines.push(
    `🎉🐾 ${name.toUpperCase()} A TROUVÉ SA FAMILLE ! ❤️`
  );

  lines.push("");

  lines.push(
    "Une annonce de moins."
  );

  lines.push(
    "Une famille de plus. 🏡"
  );

  lines.push("");

  if (animalType) {
    lines.push(
      `${animalType} adopté(e) avec succès.`
    );
  }

  if (location.length > 0) {
    lines.push(
      `📍 ${location.join(" • ")}`
    );
  }

  if (
    animalType ||
    location.length > 0
  ) {
    lines.push("");
  }

  lines.push(
    `Bonne route ${name}. ❤️`
  );

  lines.push("");

  lines.push(
    "Merci à toutes les personnes qui ont partagé, suivi et soutenu son histoire."
  );

  lines.push("");

  lines.push(
    "On ne sauvera pas le monde, mais on sauvera le leur. 🐾"
  );

  lines.push("");

  lines.push(
    "TAUI TE ORA × LES VEILLEURS DE KALI"
  );

  lines.push("");

  lines.push(
    "#TauiTeOra #LesVeilleursDeKali #Adopte #AdoptionReussie #PolynesieFrancaise"
  );

  return lines.join("\n");
}

async function publishFacebookPhoto({
  pageId,
  pageAccessToken,
  graphVersion,
  photoUrl,
  caption,
}: {
  pageId: string;
  pageAccessToken: string;
  graphVersion: string;
  photoUrl: string;
  caption: string;
}) {
  const endpoint =
    `https://graph.facebook.com/${graphVersion}/${pageId}/photos`;

  const body =
    new URLSearchParams();

  body.set(
    "url",
    photoUrl
  );

  body.set(
    "caption",
    caption
  );

  body.set(
    "published",
    "true"
  );

  body.set(
    "access_token",
    pageAccessToken
  );

  const response =
    await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body:
          body.toString(),
        cache:
          "no-store",
      }
    );

  const result =
    await response.json();

  if (!response.ok) {
    const message =
      result?.error?.message ||
      "Erreur Facebook lors de la publication de la photo d'adoption.";

    throw new Error(
      message
    );
  }

  return {
    id:
      String(
        result?.post_id ||
        result?.id ||
        ""
      ),
  };
}

async function publishFacebookText({
  pageId,
  pageAccessToken,
  graphVersion,
  message,
}: {
  pageId: string;
  pageAccessToken: string;
  graphVersion: string;
  message: string;
}) {
  const endpoint =
    `https://graph.facebook.com/${graphVersion}/${pageId}/feed`;

  const body =
    new URLSearchParams();

  body.set(
    "message",
    message
  );

  body.set(
    "access_token",
    pageAccessToken
  );

  const response =
    await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body:
          body.toString(),
        cache:
          "no-store",
      }
    );

  const result =
    await response.json();

  if (!response.ok) {
    const message =
      result?.error?.message ||
      "Erreur Facebook lors de la publication de l'adoption.";

    throw new Error(
      message
    );
  }

  return {
    id:
      String(
        result?.id ||
        ""
      ),
  };
}

export async function POST(
  request: NextRequest
) {
  const supabase =
    getSupabaseAdmin();

  const config =
    getFacebookConfig();

  const receivedSecret =
    request.headers.get(
      "x-facebook-webhook-secret"
    );

  if (
    !receivedSecret ||
    receivedSecret !==
      config.webhookSecret
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Webhook non autorisé.",
      },
      {
        status: 401,
      }
    );
  }

  let payload:
    SupabaseWebhookBody;

  try {
    payload =
      (await request.json()) as
        SupabaseWebhookBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Payload invalide.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    payload.schema !== "public" ||
    payload.table !== "animals"
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        "Table ignorée.",
    });
  }

  const record =
    payload.record;

  if (
    !record ||
    !record.id
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        "Animal absent.",
    });
  }

  const animalId =
    record.id;

  if (
    record.is_adopted !== true
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        "Animal non adopté.",
    });
  }

  if (
    record.facebook_adopted_shared_at ||
    record.facebook_adopted_share_status ===
      "published"
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        "Adoption déjà publiée sur Facebook.",
    });
  }

  const {
    data: claimedAnimal,
    error: claimError,
  } =
    await supabase
      .from("animals")
      .update({
        facebook_adopted_share_status:
          "processing",
        facebook_adopted_share_error:
          null,
      })
      .eq(
        "id",
        animalId
      )
      .eq(
        "is_adopted",
        true
      )
      .is(
        "facebook_adopted_shared_at",
        null
      )
      .or(
        "facebook_adopted_share_status.is.null,facebook_adopted_share_status.eq.error"
      )
      .select(
        `
          id,
          animal_name,
          animal_type,
          age_label,
          sex,
          breed,
          city,
          island,
          is_published,
          is_adopted,
          facebook_adopted_shared_at,
          facebook_adopted_post_id,
          facebook_adopted_share_status
        `
      )
      .maybeSingle();

  if (claimError) {
    console.error(
      "Erreur verrou Facebook adoption :",
      claimError
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          claimError.message,
      },
      {
        status: 500,
      }
    );
  }

  if (!claimedAnimal) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        "Publication adoption déjà traitée ou en cours.",
    });
  }

  try {
    const {
      data: photos,
      error: photosError,
    } =
      await supabase
        .from(
          "animal_photos"
        )
        .select(
          "photo_url, is_cover, sort_order"
        )
        .eq(
          "animal_id",
          animalId
        )
        .order(
          "is_cover",
          {
            ascending: false,
          }
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        );

    if (photosError) {
      console.error(
        "Erreur photos Facebook adoption :",
        photosError
      );
    }

    const photoRows =
      (photos ||
        []) as AnimalPhoto[];

    const photoUrl =
      photoRows.find(
        (photo) =>
          Boolean(
            photo.is_cover &&
              photo.photo_url
          )
      )?.photo_url ||
      photoRows.find(
        (photo) =>
          Boolean(
            photo.photo_url
          )
      )?.photo_url ||
      null;

    const message =
      buildFacebookAdoptedMessage(
        claimedAnimal
      );

    let result: {
      id: string;
    };

    if (photoUrl) {
      result =
        await publishFacebookPhoto({
          pageId:
            config.pageId,
          pageAccessToken:
            config.pageAccessToken,
          graphVersion:
            config.graphVersion,
          photoUrl,
          caption:
            message,
        });
    } else {
      result =
        await publishFacebookText({
          pageId:
            config.pageId,
          pageAccessToken:
            config.pageAccessToken,
          graphVersion:
            config.graphVersion,
          message,
        });
    }

    const {
      error: saveError,
    } =
      await supabase
        .from("animals")
        .update({
          facebook_adopted_shared_at:
            new Date()
              .toISOString(),
          facebook_adopted_post_id:
            result.id || null,
          facebook_adopted_share_status:
            "published",
          facebook_adopted_share_error:
            null,
        })
        .eq(
          "id",
          animalId
        );

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({
      ok: true,
      published: true,
      type:
        "adopted",
      animal_id:
        animalId,
      facebook_post_id:
        result.id || null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue Facebook adoption.";

    console.error(
      "Publication Facebook adoption impossible :",
      error
    );

    await supabase
      .from("animals")
      .update({
        facebook_adopted_share_status:
          "error",
        facebook_adopted_share_error:
          message.slice(
            0,
            1000
          ),
      })
      .eq(
        "id",
        animalId
      )
      .is(
        "facebook_adopted_shared_at",
        null
      );

    return NextResponse.json(
      {
        ok: false,
        type:
          "adopted",
        animal_id:
          animalId,
        error:
          message,
      },
      {
        status: 500,
      }
    );
  }
}

