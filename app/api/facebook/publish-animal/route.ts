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
  facebook_shared_at?: string | null;
  facebook_post_id?: string | null;
  facebook_share_status?: string | null;
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
    "v23.0";

  const siteUrl =
    (
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.taui-te-ora.com"
    ).replace(/\/+$/, "");

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
    siteUrl,
    webhookSecret,
  };
}

function cleanValue(
  value: string | null | undefined
) {
  return String(value || "")
    .trim();
}

function buildFacebookMessage(
  animal: AnimalWebhookRecord,
  animalUrl: string
) {
  const name =
    cleanValue(
      animal.animal_name
    ) || "Cet animal";

  const animalType =
    cleanValue(
      animal.animal_type
    );

  const age =
    cleanValue(
      animal.age_label
    );

  const sex =
    cleanValue(
      animal.sex
    );

  const breed =
    cleanValue(
      animal.breed
    );

  const city =
    cleanValue(
      animal.city
    );

  const island =
    cleanValue(
      animal.island
    );

  const normalizedName =
    name.toUpperCase();

  const hooks = [
    `🐾 ${normalizedName} CHERCHE SA FAMILLE ❤️`,
    `❤️ ET SI C'ÉTAIT ${normalizedName} ?`,
    `🐾 AUJOURD'HUI, ON VOUS PRÉSENTE ${normalizedName}.`,
    `✨ UNE RENCONTRE PEUT TOUT CHANGER POUR ${normalizedName}.`,
    `❤️ ${normalizedName} N'A PAS BESOIN DE MILLIERS DE LIKES. JUSTE DE LA BONNE PERSONNE.`,
  ];

  /*
   * Accroche stable par animal :
   * elle varie d'un animal à l'autre,
   * mais ne change pas si le webhook
   * devait être rejoué.
   */
  const hookIndex =
    Array.from(
      String(animal.id || name)
    ).reduce(
      (total, character) =>
        total + character.charCodeAt(0),
      0
    ) % hooks.length;

  const lines: string[] = [
    hooks[hookIndex],
    "",
    "Quelqu’un vous attend.",
    "Vous ne le savez pas encore.",
    "",
  ];

  const identity: string[] = [];

  if (animalType) {
    identity.push(animalType);
  }

  if (breed) {
    identity.push(breed);
  }

  if (age) {
    identity.push(age);
  }

  if (sex) {
    identity.push(sex);
  }

  if (identity.length > 0) {
    lines.push(
      `🐾 ${identity.join(" • ")}`
    );
  }

  const location =
    [city, island].filter(Boolean);

  if (location.length > 0) {
    lines.push(
      `📍 ${location.join(" • ")}`
    );
  }

  if (
    identity.length > 0 ||
    location.length > 0
  ) {
    lines.push("");
  }

  lines.push(
    `Et si le début de l’histoire de ${name} avec vous commençait ici ?`
  );

  lines.push("");

  lines.push(
    "👉 Découvrez son profil complet, apprenez à le connaître et découvrez votre % de compatibilité sur TAUI TE ORA."
  );

  lines.push("");

  lines.push(
    animalUrl
  );

  lines.push("");

  lines.push(
    "❤️ Un coup de cœur ? Ajoutez-le à vos favoris."
  );

  lines.push(
    "🏡 Prêt à l’accueillir ? Faites votre demande directement sur TAUI TE ORA."
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
    "#TauiTeOra #LesVeilleursDeKali #Adoption #PolynesieFrancaise"
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
      "Erreur Facebook lors de la publication de la photo.";

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

async function publishFacebookLink({
  pageId,
  pageAccessToken,
  graphVersion,
  animalUrl,
  message,
}: {
  pageId: string;
  pageAccessToken: string;
  graphVersion: string;
  animalUrl: string;
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
    "link",
    animalUrl
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
    const errorMessage =
      result?.error?.message ||
      "Erreur Facebook lors de la publication.";

    throw new Error(
      errorMessage
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

  /*
   * Sécurité :
   * seul le webhook Supabase possédant
   * notre secret peut appeler cette route.
   */
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

  /*
   * L'animal doit réellement être publié.
   */
  if (
    record.is_published !== true
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        "Animal non publié.",
    });
  }

  /*
   * Déjà publié Facebook :
   * on ne fait absolument rien.
   */
  if (
    record.facebook_shared_at ||
    record.facebook_share_status ===
      "published"
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        "Déjà publié sur Facebook.",
    });
  }

  /*
   * VERROU ATOMIQUE.
   *
   * Une seule requête peut faire passer
   * l'animal de NULL/error à processing.
   *
   * Cela évite les doublons Facebook si
   * Supabase envoie deux webhooks.
   */
  const {
    data: claimedAnimal,
    error: claimError,
  } =
    await supabase
      .from("animals")
      .update({
        facebook_share_status:
          "processing",

        facebook_share_error:
          null,
      })
      .eq(
        "id",
        animalId
      )
      .eq(
        "is_published",
        true
      )
      .is(
        "facebook_shared_at",
        null
      )
      .or(
        "facebook_share_status.is.null,facebook_share_status.eq.error"
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
          facebook_shared_at,
          facebook_post_id,
          facebook_share_status
        `
      )
      .maybeSingle();

  if (claimError) {
    console.error(
      "Erreur verrou Facebook :",
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

  /*
   * Si aucune ligne n'a été réclamée,
   * un autre webhook est déjà en train
   * de traiter cet animal ou il a déjà
   * été publié.
   */
  if (!claimedAnimal) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        "Publication déjà traitée ou en cours.",
    });
  }

  try {
    const animalUrl =
      `${config.siteUrl}/animal/${encodeURIComponent(
        animalId
      )}?adoption=1`;

    /*
     * Récupération de la photo principale.
     */
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
        "Erreur photos Facebook :",
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
      buildFacebookMessage(
        claimedAnimal,
        animalUrl
      );

    let result: {
      id: string;
    };

    /*
     * Si une photo existe :
     * Facebook reçoit désormais l'image
     * générée automatiquement par Taui Te Ora
     * avec :
     * - la vraie photo de l'animal
     * - le profil/structure responsable
     * - son logo si disponible
     * - le vrai logo Taui Te Ora
     */
    const facebookShareImageUrl =
      `${config.siteUrl}/api/facebook/share-image/${encodeURIComponent(
        animalId
      )}?mode=available`;

    if (photoUrl) {
      result =
        await publishFacebookPhoto({
          pageId:
            config.pageId,

          pageAccessToken:
            config.pageAccessToken,

          graphVersion:
            config.graphVersion,

          photoUrl:
            facebookShareImageUrl,

          caption:
            message,
        });
    } else {
      result =
        await publishFacebookLink({
          pageId:
            config.pageId,

          pageAccessToken:
            config.pageAccessToken,

          graphVersion:
            config.graphVersion,

          animalUrl,

          message,
        });
    }

    /*
     * Publication réussie.
     *
     * À partir de maintenant cet animal
     * ne sera JAMAIS publié une deuxième fois
     * automatiquement.
     */
    const {
      error: saveError,
    } =
      await supabase
        .from("animals")
        .update({
          facebook_shared_at:
            new Date()
              .toISOString(),

          facebook_post_id:
            result.id || null,

          facebook_share_status:
            "published",

          facebook_share_error:
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

      animal_id:
        animalId,

      facebook_post_id:
        result.id || null,
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

    await supabase
      .from("animals")
      .update({
        facebook_share_status:
          "error",

        facebook_share_error:
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
        "facebook_shared_at",
        null
      );

    return NextResponse.json(
      {
        ok: false,
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