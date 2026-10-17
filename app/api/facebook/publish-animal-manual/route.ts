
import { NextResponse } from "next/server";
import {
  requireAdmin,
  failure,
} from "../../../lib/facebook-autopost";
import {
  generateFacebookAnimalMessage,
  type FacebookAnimal,
} from "../../../lib/facebook-animal-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnimalRow = FacebookAnimal & {
  is_published: boolean | null;
  is_adopted: boolean | null;
  status: string | null;
  adopted_at: string | null;
};

type MetaError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

type MetaResponse = {
  id?: string;
  name?: string;
  post_id?: string;
  error?: MetaError;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function getFacebookConfig(request: Request) {
  const pageId = clean(
    process.env.FACEBOOK_PAGE_ID
  );

  const pageAccessToken = clean(
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  );

  const graphVersion =
    clean(process.env.FACEBOOK_GRAPH_VERSION) ||
    "v26.0";

  const configuredSiteUrl = clean(
    process.env.NEXT_PUBLIC_SITE_URL
  );

  const requestOrigin = new URL(request.url).origin;

  const siteUrl = (
    configuredSiteUrl &&
    !configuredSiteUrl.includes("localhost")
      ? configuredSiteUrl
      : requestOrigin.includes("localhost") ||
          requestOrigin.includes("127.0.0.1")
        ? "https://www.taui-te-ora.com"
        : requestOrigin
  ).replace(/\/+$/, "");

  if (!pageId) {
    throw new Error("FACEBOOK_PAGE_ID manquant.");
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

async function readMetaResponse(
  response: Response
): Promise<MetaResponse> {
  const text = await response.text();

  let result: MetaResponse = {};

  try {
    result = text
      ? (JSON.parse(text) as MetaResponse)
      : {};
  } catch {
    throw new Error(
      `Réponse Facebook invalide (HTTP ${response.status}).`
    );
  }

  if (!response.ok || result.error) {
    const error = result.error;

    const details = [
      `HTTP ${response.status}`,
      error?.type
        ? `type ${error.type}`
        : null,
      typeof error?.code === "number"
        ? `code ${error.code}`
        : null,
      typeof error?.error_subcode === "number"
        ? `sous-code ${error.error_subcode}`
        : null,
      error?.fbtrace_id
        ? `trace ${error.fbtrace_id}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");

    throw new Error(
      `Facebook : ${
        error?.message || "Erreur inconnue."
      } (${details})`
    );
  }

  return result;
}

/**
 * Vérifie l'identité réelle du jeton configuré
 * sur le serveur avant toute publication.
 *
 * Aucun jeton n'est renvoyé au navigateur.
 */
async function verifyFacebookPage(config: {
  pageId: string;
  pageAccessToken: string;
  graphVersion: string;
}): Promise<string> {
  const endpoint = new URL(
    `https://graph.facebook.com/${config.graphVersion}/me`
  );

  endpoint.searchParams.set(
    "fields",
    "id,name"
  );

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization:
        `Bearer ${config.pageAccessToken}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const result = await readMetaResponse(response);

  const actualPageId = clean(result.id);

  if (!actualPageId) {
    throw new Error(
      "Facebook ne retourne pas l'identifiant de la page."
    );
  }

  if (actualPageId !== config.pageId) {
    throw new Error(
      "Le jeton Facebook configuré sur Vercel " +
      `correspond à l'identifiant ${actualPageId}, ` +
      `mais FACEBOOK_PAGE_ID vaut ${config.pageId}. ` +
      "La publication est bloquée pour éviter " +
      "d'utiliser la mauvaise page."
    );
  }

  return actualPageId;
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
}): Promise<{ id: string }> {
  const endpoint =
    `https://graph.facebook.com/${graphVersion}/` +
    `${encodeURIComponent(pageId)}/photos`;

  const body = new URLSearchParams();

  body.set("url", photoUrl);
  body.set("caption", caption);
  body.set("published", "true");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pageAccessToken}`,
      "Content-Type":
        "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });

  const result = await readMetaResponse(response);

  return {
    id: clean(result.post_id || result.id),
  };
}

export async function POST(request: Request) {
  let animalId = "";

  try {
    const adminSupabase =
      await requireAdmin(request);

    const body = await request
      .json()
      .catch(() => null);

    animalId = clean(body?.animalId);

    if (!animalId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Identifiant animal manquant.",
        },
        { status: 400 }
      );
    }

    const {
      data: animalData,
      error: animalError,
    } = await adminSupabase
      .from("animals")
      .select(`
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
        adopted_at,
        story,
        description_character,
        health_status,
        special_needs,
        ideal_family,
        relation_humain,
        matching_notes,
        compatible_chiens,
        compatible_chats,
        compatible_enfants
      `)
      .eq("id", animalId)
      .maybeSingle();

    if (animalError) {
      throw new Error(animalError.message);
    }

    if (!animalData) {
      return NextResponse.json(
        {
          ok: false,
          error: "Animal introuvable.",
        },
        { status: 404 }
      );
    }

    const animal = animalData as AnimalRow;

    const adopted =
      animal.is_adopted === true ||
      clean(animal.status).toLowerCase() ===
        "adopted";

    if (
      !adopted &&
      (
        animal.is_published !== true ||
        clean(animal.status).toLowerCase() !==
          "available"
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Cet animal n'est pas actuellement " +
            "disponible à l'adoption.",
        },
        { status: 409 }
      );
    }

    const facebook = getFacebookConfig(request);

    /*
     * Vérification côté serveur :
     * le jeton doit appartenir à la page attendue.
     */
    const verifiedPageId =
      await verifyFacebookPage(facebook);

    const animalUrl =
      `${facebook.siteUrl}/animal/` +
      encodeURIComponent(animalId);

    const shareImageUrl =
      `${facebook.siteUrl}/api/facebook/share-image/` +
      encodeURIComponent(animalId) +
      `?mode=${adopted ? "adopted" : "available"}` +
      `&v=${Date.now()}`;

    const imageCheck = await fetch(
      shareImageUrl,
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!imageCheck.ok) {
      throw new Error(
        `Image Facebook inaccessible (${imageCheck.status}).`
      );
    }

    const contentType =
      imageCheck.headers.get("content-type") ||
      "";

    if (
      !contentType.toLowerCase().startsWith(
        "image/"
      )
    ) {
      throw new Error(
        "Le serveur ne retourne pas " +
        "une image Facebook valide."
      );
    }

    const message =
      await generateFacebookAnimalMessage(
        animal,
        animalUrl,
        adopted ? "adopted" : "available"
      );

    const result =
      await publishFacebookPhoto({
        pageId: verifiedPageId,
        pageAccessToken:
          facebook.pageAccessToken,
        graphVersion:
          facebook.graphVersion,
        photoUrl: shareImageUrl,
        caption: message,
      });

    return NextResponse.json({
      ok: true,
      published: true,
      animal_id: animalId,
      mode: adopted
        ? "adopted"
        : "available",
      facebook_post_id: result.id || null,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (
        error.message === "UNAUTHORIZED" ||
        error.message === "FORBIDDEN"
      )
    ) {
      return failure(error);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Erreur Facebook inconnue.";

    console.error(
      "Publication Facebook manuelle impossible :",
      message
    );

    return NextResponse.json(
      {
        ok: false,
        animal_id: animalId || null,
        error: message,
      },
      { status: 500 }
    );
  }
}
