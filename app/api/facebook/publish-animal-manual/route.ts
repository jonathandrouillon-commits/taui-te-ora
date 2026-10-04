import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnimalRow = {
  id: string;
  animal_name: string | null;
  animal_type: string | null;
  age_label: string | null;
  sex: string | null;
  breed: string | null;
  city: string | null;
  island: string | null;
  is_published: boolean | null;
  is_adopted: boolean | null;
  status: string | null;
  adopted_at: string | null;
};

function clean(
  value:
    | string
    | null
    | undefined
    | unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function getSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !anonKey ||
    !serviceRole
  ) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return {
    url,
    anonKey,
    serviceRole,
  };
}

function getFacebookConfig(
  request: Request
) {
  const pageId =
    clean(
      process.env.FACEBOOK_PAGE_ID
    );

  const pageAccessToken =
    clean(
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    );

  const graphVersion =
    clean(
      process.env.FACEBOOK_GRAPH_VERSION
    ) ||
    "v26.0";

  const configuredSiteUrl =
    clean(
      process.env.NEXT_PUBLIC_SITE_URL
    );

  const requestOrigin =
    new URL(
      request.url
    ).origin;

  /*
   * Important :
   * Facebook doit pouvoir lire l'image de partage.
   * En production on utilise NEXT_PUBLIC_SITE_URL.
   * Sur localhost, une URL localhost n'est pas accessible à Facebook,
   * donc on privilégie le domaine public Taui Te Ora.
   */
  const siteUrl =
    (
      configuredSiteUrl &&
      !configuredSiteUrl.includes(
        "localhost"
      )
        ? configuredSiteUrl
        : requestOrigin.includes(
              "localhost"
            ) ||
            requestOrigin.includes(
              "127.0.0.1"
            )
          ? "https://www.taui-te-ora.com"
          : requestOrigin
    ).replace(/\/+$/, "");

  if (!pageId) {
    throw new Error(
      "FACEBOOK_PAGE_ID manquant."
    );
  }

  if (!pageAccessToken) {
    throw new Error(
      "FACEBOOK_PAGE_ACCESS_TOKEN manquant."
    );
  }

  return {
    pageId,
    pageAccessToken,
    graphVersion,
    siteUrl,
  };
}

function getBearerToken(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

function isFemale(
  sex: string | null
) {
  const value =
    clean(sex)
      .toLowerCase();

  return (
    value.includes(
      "femelle"
    ) ||
    value.includes(
      "female"
    )
  );
}

function buildAvailableMessage(
  animal: AnimalRow,
  animalUrl: string
) {
  const name =
    clean(
      animal.animal_name
    ) ||
    "Cet animal";

  const location =
    [
      clean(animal.city),
      clean(animal.island),
    ]
      .filter(Boolean)
      .join(" • ");

  const lines: string[] = [];

  lines.push(
    `🐾 ${name.toUpperCase()} CHERCHE SA FAMILLE ! ❤️`
  );

  lines.push("");

  if (location) {
    lines.push(
      `📍 ${location}`
    );
  }

  if (animal.age_label) {
    lines.push(
      `🎂 ${clean(animal.age_label)}`
    );
  }

  if (animal.sex) {
    lines.push(
      `⚥ ${clean(animal.sex)}`
    );
  }

  if (animal.breed) {
    lines.push(
      `🐶 ${clean(animal.breed)}`
    );
  }

  lines.push("");
  lines.push(
    "❤️ Un coup de cœur ? Ajoutez-le à vos favoris."
  );
  lines.push(
    "🏡 Prêt à l’accueillir ? Faites votre demande directement sur TAUI TE ORA."
  );
  lines.push("");
  lines.push(
    `👉 Voir sa fiche : ${animalUrl}`
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

  return lines.join(
    "\n"
  );
}

function buildAdoptedMessage(
  animal: AnimalRow,
  animalUrl: string
) {
  const name =
    clean(
      animal.animal_name
    ) ||
    "Cet animal";

  const female =
    isFemale(
      animal.sex
    );

  const lines: string[] = [];

  lines.push(
    female
      ? `🎉🐾 ${name.toUpperCase()} EST ADOPTÉE ! ❤️`
      : `🎉🐾 ${name.toUpperCase()} EST ADOPTÉ ! ❤️`
  );

  lines.push("");
  lines.push(
    "Une annonce de moins."
  );
  lines.push(
    "Une famille de plus. 🏡"
  );
  lines.push("");
  lines.push(
    `Bonne route ${name}. ❤️`
  );
  lines.push("");
  lines.push(
    "Merci à toutes les personnes qui ont partagé, suivi et soutenu son histoire."
  );
  lines.push("");
  lines.push(
    `👉 Revoir sa fiche : ${animalUrl}`
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
  pageId: string;
  pageAccessToken: string;
  graphVersion: string;
  photoUrl: string;
  caption: string;
}) {
  const endpoint =
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
      pageId
    )}/photos`;

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

  const responseText =
    await response.text();

  let result: any = null;

  try {
    result =
      responseText
        ? JSON.parse(
            responseText
          )
        : null;
  } catch {
    result = null;
  }

  if (!response.ok) {
    const facebookMessage =
      result?.error?.message ||
      responseText ||
      `Facebook Graph API erreur ${response.status}.`;

    throw new Error(
      facebookMessage
    );
  }

  return {
    id:
      clean(
        result?.post_id ||
          result?.id
      ),
  };
}

export async function POST(
  request: Request
) {
  let animalId = "";

  try {
    const {
      url,
      anonKey,
      serviceRole,
    } =
      getSupabaseConfig();

    const accessToken =
      getBearerToken(
        request
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Connexion requise.",
        },
        {
          status: 401,
        }
      );
    }

    const authSupabase =
      createClient(
        url,
        anonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    const {
      data: userData,
      error: userError,
    } =
      await authSupabase
        .auth
        .getUser(
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

    animalId =
      clean(
        body?.animalId
      );

    if (!animalId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Identifiant animal manquant.",
        },
        {
          status: 400,
        }
      );
    }

    const adminSupabase =
      createClient(
        url,
        serviceRole,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    const {
      data: animalData,
      error: animalError,
    } =
      await adminSupabase
        .from("animals")
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
            status,
            adopted_at
          `
        )
        .eq(
          "id",
          animalId
        )
        .maybeSingle();

    if (animalError) {
      throw new Error(
        animalError.message
      );
    }

    if (!animalData) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Animal introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    const animal =
      animalData as AnimalRow;

    const facebook =
      getFacebookConfig(
        request
      );

    const adopted =
      Boolean(
        animal.is_adopted
      ) ||
      clean(
        animal.status
      )
        .toLowerCase() ===
        "adopted";

    const animalUrl =
      `${facebook.siteUrl}/animal/${encodeURIComponent(
        animalId
      )}`;

    const shareImageUrl =
      `${facebook.siteUrl}/api/facebook/share-image/${encodeURIComponent(
        animalId
      )}?mode=${
        adopted
          ? "adopted"
          : "available"
      }&v=${Date.now()}`;

    /*
     * Vérification avant d'appeler Facebook.
     * Ainsi on renvoie une vraie erreur lisible si l'image de partage
     * n'est pas accessible publiquement.
     */
    const imageCheck =
      await fetch(
        shareImageUrl,
        {
          method: "GET",
          cache: "no-store",
        }
      );

    if (!imageCheck.ok) {
      throw new Error(
        `Image Facebook inaccessible (${imageCheck.status}) : ${shareImageUrl}`
      );
    }

    const message =
      adopted
        ? buildAdoptedMessage(
            animal,
            animalUrl
          )
        : buildAvailableMessage(
            animal,
            animalUrl
          );

    const result =
      await publishFacebookPhoto({
        pageId:
          facebook.pageId,
        pageAccessToken:
          facebook.pageAccessToken,
        graphVersion:
          facebook.graphVersion,
        photoUrl:
          shareImageUrl,
        caption:
          message,
      });

    return NextResponse.json({
      ok: true,
      published: true,
      animal_id:
        animalId,
      mode:
        adopted
          ? "adopted"
          : "available",
      facebook_post_id:
        result.id ||
        null,
    });
  } catch (
    error: unknown
  ) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur Facebook inconnue.";

    console.error(
      "Publication Facebook directe impossible :",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        animal_id:
          animalId ||
          null,
        error:
          message,
      },
      {
        status: 500,
      }
    );
  }
}
