import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type SignalementRow = {
  id: string;
  user_id: string | null;
  type_signalement: string | null;
  animal_type: string | null;
  animal_name: string | null;
  sex: string | null;
  age_label: string | null;
  color: string | null;
  breed: string | null;
  island: string | null;
  city: string | null;
  address: string | null;
  situation: string | null;
  description: string | null;
  status: string | null;
  facebook_shared_at: string | null;
  facebook_post_id: string | null;
  facebook_share_status: string | null;
};

type SignalementMedia = {
  file_url: string | null;
  file_type: string | null;
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

  const siteUrl =
    (
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.taui-te-ora.com"
    ).replace(/\/+$/, "");

  if (
    !pageId ||
    !pageAccessToken
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
  };
}

function clean(
  value:
    | string
    | null
    | undefined
) {
  return String(
    value || ""
  ).trim();
}

function buildMessage(
  signalement: SignalementRow,
  publicUrl: string
) {
  const type =
    clean(
      signalement.type_signalement
    ) || "Signalement";

  const name =
    clean(
      signalement.animal_name
    );

  const animalType =
    clean(
      signalement.animal_type
    );

  const location =
    [
      clean(signalement.city),
      clean(signalement.island),
    ].filter(Boolean);

  const lines: string[] = [];

  lines.push(
    type.toLowerCase().includes("perdu")
      ? "🚨 ANIMAL PERDU"
      : type.toLowerCase().includes("trouvé")
        ? "🐾 ANIMAL TROUVÉ"
        : `🚨 ${type.toUpperCase()}`
  );

  lines.push("");

  if (name) {
    lines.push(
      `Nom : ${name}`
    );
  }

  if (animalType) {
    lines.push(
      `Animal : ${animalType}`
    );
  }

  if (location.length > 0) {
    lines.push(
      `📍 ${location.join(" • ")}`
    );
  }

  const description =
    clean(
      signalement.description
    );

  if (description) {
    lines.push("");
    lines.push(
      description.length > 700
        ? `${description.slice(0, 697)}...`
        : description
    );
  }

  lines.push("");
  lines.push(
    "Merci de partager pour augmenter les chances de retrouver cet animal."
  );

  lines.push("");
  lines.push(
    `👉 Voir le signalement : ${publicUrl}`
  );

  lines.push("");
  lines.push(
    "TAUI TE ORA × LES VEILLEURS DE KALI"
  );

  lines.push("");
  lines.push(
    "#TauiTeOra #LesVeilleursDeKali #AnimalPerdu #AnimalTrouve #PolynesieFrancaise"
  );

  return lines.join("\n");
}

async function publishPhoto({
  pageId,
  pageAccessToken,
  graphVersion,
  imageUrl,
  caption,
}: {
  pageId: string;
  pageAccessToken: string;
  graphVersion: string;
  imageUrl: string;
  caption: string;
}) {
  const endpoint =
    `https://graph.facebook.com/${graphVersion}/${pageId}/photos`;

  const body =
    new URLSearchParams();

  body.set(
    "url",
    imageUrl
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
    throw new Error(
      result?.error?.message ||
        "Erreur Facebook lors de la publication de la photo."
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

async function publishLink({
  pageId,
  pageAccessToken,
  graphVersion,
  publicUrl,
  message,
}: {
  pageId: string;
  pageAccessToken: string;
  graphVersion: string;
  publicUrl: string;
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
    publicUrl
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
    throw new Error(
      result?.error?.message ||
        "Erreur Facebook lors de la publication du signalement."
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

  let signalementId = "";

  try {
    const authorization =
      request.headers.get(
        "authorization"
      );

    const accessToken =
      authorization
        ?.replace(
          /^Bearer\s+/i,
          ""
        )
        .trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Authentification requise.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Session utilisateur invalide.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request
        .json()
        .catch(
          () => null
        );

    signalementId =
      clean(
        body?.signalementId
      );

    if (!signalementId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Identifiant du signalement manquant.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq(
          "id",
          userData.user.id
        )
        .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const role =
      clean(
        profile?.role
      ).toLowerCase();

    const isAdmin =
      role === "admin" ||
      role === "administrateur";

    const {
      data: signalement,
      error: signalementError,
    } =
      await supabase
        .from("signalements")
        .select(`
          id,
          user_id,
          type_signalement,
          animal_type,
          animal_name,
          sex,
          age_label,
          color,
          breed,
          island,
          city,
          address,
          situation,
          description,
          status,
          facebook_shared_at,
          facebook_post_id,
          facebook_share_status
        `)
        .eq(
          "id",
          signalementId
        )
        .maybeSingle();

    if (
      signalementError ||
      !signalement
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Signalement introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    const typedSignalement =
      signalement as SignalementRow;

    if (
      !isAdmin &&
      typedSignalement.user_id !==
        userData.user.id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Vous ne pouvez publier automatiquement que vos propres signalements.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      typedSignalement.facebook_shared_at ||
      typedSignalement.facebook_share_status ===
        "published"
    ) {
      return NextResponse.json({
        ok: true,
        published: false,
        alreadyPublished: true,
        facebook_post_id:
          typedSignalement.facebook_post_id,
      });
    }

    const {
      data: claimed,
      error: claimError,
    } =
      await supabase
        .from("signalements")
        .update({
          facebook_share_status:
            "processing",
          facebook_share_error:
            null,
        })
        .eq(
          "id",
          signalementId
        )
        .is(
          "facebook_shared_at",
          null
        )
        .or(
          "facebook_share_status.is.null,facebook_share_status.eq.error"
        )
        .select("id")
        .maybeSingle();

    if (claimError) {
      throw claimError;
    }

    if (!claimed) {
      return NextResponse.json({
        ok: true,
        published: false,
        skipped: true,
        reason:
          "Publication Facebook déjà en cours ou déjà effectuée.",
      });
    }

    const {
      data: medias,
      error: mediasError,
    } =
      await supabase
        .from(
          "signalement_medias"
        )
        .select(
          "file_url, file_type"
        )
        .eq(
          "signalement_id",
          signalementId
        );

    if (mediasError) {
      console.error(
        "Médias signalement Facebook :",
        mediasError
      );
    }

    const mediaRows =
      (medias ||
        []) as SignalementMedia[];

    const hasPhoto =
      mediaRows.some(
        (media) =>
          Boolean(
            media.file_url &&
            (
              !media.file_type ||
              media.file_type.startsWith(
                "image/"
              )
            )
          )
      );

    const config =
      getFacebookConfig();

    const publicUrl =
      `${config.siteUrl}/signalement/public/${encodeURIComponent(
        signalementId
      )}`;

    const imageUrl =
      `${config.siteUrl}/api/share-image/signalement/${encodeURIComponent(
        signalementId
      )}`;

    const message =
      buildMessage(
        typedSignalement,
        publicUrl
      );

    const result =
      hasPhoto
        ? await publishPhoto({
            pageId:
              config.pageId,
            pageAccessToken:
              config.pageAccessToken,
            graphVersion:
              config.graphVersion,
            imageUrl,
            caption:
              message,
          })
        : await publishLink({
            pageId:
              config.pageId,
            pageAccessToken:
              config.pageAccessToken,
            graphVersion:
              config.graphVersion,
            publicUrl,
            message,
          });

    const {
      error: saveError,
    } =
      await supabase
        .from("signalements")
        .update({
          facebook_shared_at:
            new Date().toISOString(),
          facebook_post_id:
            result.id || null,
          facebook_share_status:
            "published",
          facebook_share_error:
            null,
        })
        .eq(
          "id",
          signalementId
        );

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({
      ok: true,
      published: true,
      signalement_id:
        signalementId,
      facebook_post_id:
        result.id || null,
    });
  } catch (
    error: unknown
  ) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue Facebook.";

    console.error(
      "Publication Facebook signalement impossible :",
      error
    );

    if (signalementId) {
      await supabase
        .from("signalements")
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
          signalementId
        )
        .is(
          "facebook_shared_at",
          null
        );
    }

    return NextResponse.json(
      {
        ok: false,
        signalement_id:
          signalementId || null,
        error:
          message,
      },
      {
        status: 500,
      }
    );
  }
}

