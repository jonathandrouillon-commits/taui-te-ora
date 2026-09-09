import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type HelpSosRow = {
  id: string;
  created_by: string;
  title: string;
  help_type: string;
  island: string | null;
  city: string | null;
  message: string | null;
  urgency: string | null;
  status: string | null;
  animal_type: string | null;
  animals_count: number | null;
  photo_url: string | null;
  facebook_shared_at: string | null;
  facebook_post_id: string | null;
  facebook_share_status: string | null;
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
        persistSession:
          false,
        autoRefreshToken:
          false,
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
    ).replace(
      /\/+$/,
      ""
    );

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

function helpTypeLabel(
  value: string
) {
  const normalized =
    clean(
      value
    ).toLowerCase();

  if (
    normalized ===
    "famille_accueil"
  ) {
    return "Famille d'accueil";
  }

  if (
    normalized ===
    "transport"
  ) {
    return "Transport";
  }

  if (
    normalized ===
    "capture"
  ) {
    return "Capture / sauvetage";
  }

  if (
    normalized ===
    "nourriture_materiel"
  ) {
    return "Nourriture / matériel";
  }

  if (
    normalized ===
    "veterinaire"
  ) {
    return "Accompagnement vétérinaire";
  }

  if (
    normalized ===
    "benevolat"
  ) {
    return "Bénévolat";
  }

  return value;
}

function buildFacebookMessage(
  sos: HelpSosRow,
  publicUrl: string
) {
  const lines:
    string[] = [];

  lines.push(
    sos.urgency ===
    "critique"
      ? "🚨 SOS CRITIQUE — TAUI TE ORA"
      : sos.urgency ===
        "urgente"
      ? "⚠️ SOS URGENT — TAUI TE ORA"
      : "🐾 SOS — TAUI TE ORA"
  );

  lines.push("");
  lines.push(
    sos.title
  );
  lines.push("");

  lines.push(
    `🤝 Besoin : ${helpTypeLabel(
      sos.help_type
    )}`
  );

  const location =
    [
      clean(
        sos.city
      ),
      clean(
        sos.island
      ),
    ].filter(Boolean);

  if (
    location.length >
    0
  ) {
    lines.push(
      `📍 ${location.join(
        " • "
      )}`
    );
  }

  if (
    sos.animal_type
  ) {
    const count =
      Math.max(
        1,
        Number(
          sos.animals_count ||
          1
        )
      );

    lines.push(
      `🐾 ${count} ${clean(
        sos.animal_type
      )}${
        count > 1
          ? "(s)"
          : ""
      }`
    );
  }

  const description =
    clean(
      sos.message
    );

  if (
    description
  ) {
    lines.push("");

    lines.push(
      description.length >
      800
        ? `${description.slice(
            0,
            797
          )}...`
        : description
    );
  }

  lines.push("");

  lines.push(
    "Vous pouvez aider ou connaissez quelqu'un qui peut aider ?"
  );

  lines.push(
    `👉 Voir le SOS : ${publicUrl}`
  );

  lines.push("");

  lines.push(
    "TAUI TE ORA × LES VEILLEURS DE KALI"
  );

  lines.push("");

  lines.push(
    "#TauiTeOra #LesVeilleursDeKali #SOSAnimal #EntraideAnimale #PolynesieFrancaise"
  );

  return lines.join(
    "\n"
  );
}

async function publishFacebookPhoto({
  pageId,
  pageAccessToken,
  graphVersion,
  photoUrl,
  caption,
}: {
  pageId:
    string;
  pageAccessToken:
    string;
  graphVersion:
    string;
  photoUrl:
    string;
  caption:
    string;
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
        method:
          "POST",
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

  if (
    !response.ok
  ) {
    throw new Error(
      result?.error?.message ||
      "Erreur Facebook lors de la publication du SOS."
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

export async function POST(
  request:
    NextRequest
) {
  const supabase =
    getSupabaseAdmin();

  let sosId =
    "";

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

    if (
      !accessToken
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "Authentification requise.",
        },
        {
          status:
            401,
        }
      );
    }

    const {
      data:
        userData,
      error:
        userError,
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
          ok:
            false,
          error:
            "Session utilisateur invalide.",
        },
        {
          status:
            401,
        }
      );
    }

    const body =
      await request
        .json()
        .catch(
          () =>
            null
        );

    sosId =
      clean(
        body?.sosId
      );

    if (
      !sosId
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "Identifiant SOS manquant.",
        },
        {
          status:
            400,
        }
      );
    }

    const {
      data:
        profile,
      error:
        profileError,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(
          "role"
        )
        .eq(
          "id",
          userData.user.id
        )
        .maybeSingle();

    if (
      profileError
    ) {
      throw profileError;
    }

    const role =
      clean(
        profile?.role
      ).toLowerCase();

    const isAdmin =
      role ===
        "admin" ||
      role ===
        "administrateur";

    const {
      data:
        sos,
      error:
        sosError,
    } =
      await supabase
        .from(
          "help_sos"
        )
        .select(
          `
            id,
            created_by,
            title,
            help_type,
            island,
            city,
            message,
            urgency,
            status,
            animal_type,
            animals_count,
            photo_url,
            facebook_shared_at,
            facebook_post_id,
            facebook_share_status
          `
        )
        .eq(
          "id",
          sosId
        )
        .maybeSingle();

    if (
      sosError ||
      !sos
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "SOS introuvable.",
        },
        {
          status:
            404,
        }
      );
    }

    const typedSos =
      sos as
        HelpSosRow;

    if (
      !isAdmin &&
      typedSos.created_by !==
        userData.user.id
    ) {
      return NextResponse.json(
        {
          ok:
            false,
          error:
            "Seul le créateur du SOS ou un administrateur peut demander la publication automatique.",
        },
        {
          status:
            403,
        }
      );
    }

    if (
      typedSos.facebook_shared_at ||
      typedSos.facebook_share_status ===
        "published"
    ) {
      return NextResponse.json({
        ok:
          true,
        published:
          false,
        alreadyPublished:
          true,
        facebook_post_id:
          typedSos.facebook_post_id,
      });
    }

    const {
      data:
        claimed,
      error:
        claimError,
    } =
      await supabase
        .from(
          "help_sos"
        )
        .update({
          facebook_share_status:
            "processing",
          facebook_share_error:
            null,
        })
        .eq(
          "id",
          sosId
        )
        .is(
          "facebook_shared_at",
          null
        )
        .or(
          "facebook_share_status.is.null,facebook_share_status.eq.error"
        )
        .select(
          "id"
        )
        .maybeSingle();

    if (
      claimError
    ) {
      throw claimError;
    }

    if (
      !claimed
    ) {
      return NextResponse.json({
        ok:
          true,
        published:
          false,
        skipped:
          true,
        reason:
          "Publication Facebook déjà en cours ou déjà effectuée.",
      });
    }

    const config =
      getFacebookConfig();

    const publicUrl =
      `${config.siteUrl}/sos-aide/${encodeURIComponent(
        sosId
      )}`;

    /*
     * IMPORTANT :
     * On publie TOUJOURS l'image générée par Taui Te Ora.
     *
     * Cette image choisit elle-même :
     * 1. photo du SOS / animal,
     * 2. photo du compagnon,
     * 3. photo animal en adoption,
     * 4. photo du profil demandeur,
     * 5. design Taui Te Ora si rien n'existe.
     */
    const shareImageUrl =
      `${config.siteUrl}/api/share-image/sos/${encodeURIComponent(
        sosId
      )}?v=${Date.now()}`;

    const message =
      buildFacebookMessage(
        typedSos,
        publicUrl
      );

    const result =
      await publishFacebookPhoto({
        pageId:
          config.pageId,
        pageAccessToken:
          config.pageAccessToken,
        graphVersion:
          config.graphVersion,
        photoUrl:
          shareImageUrl,
        caption:
          message,
      });

    const {
      error:
        saveError,
    } =
      await supabase
        .from(
          "help_sos"
        )
        .update({
          facebook_shared_at:
            new Date()
              .toISOString(),
          facebook_post_id:
            result.id ||
            null,
          facebook_share_status:
            "published",
          facebook_share_error:
            null,
        })
        .eq(
          "id",
          sosId
        );

    if (
      saveError
    ) {
      throw saveError;
    }

    return NextResponse.json({
      ok:
        true,
      published:
        true,
      sos_id:
        sosId,
      facebook_post_id:
        result.id ||
        null,
    });
  } catch (
    error:
      unknown
  ) {
    const message =
      error instanceof
        Error
        ? error.message
        : "Erreur inconnue Facebook.";

    console.error(
      "Publication Facebook SOS impossible :",
      error
    );

    if (
      sosId
    ) {
      await supabase
        .from(
          "help_sos"
        )
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
          sosId
        )
        .is(
          "facebook_shared_at",
          null
        );
    }

    return NextResponse.json(
      {
        ok:
          false,
        sos_id:
          sosId ||
          null,
        error:
          message,
      },
      {
        status:
          500,
      }
    );
  }
}
