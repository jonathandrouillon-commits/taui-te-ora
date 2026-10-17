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

  const requestOrigin = new URL(
    request.url
  ).origin;

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
  body.set("access_token", pageAccessToken);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const responseText = await response.text();

  let result: {
    post_id?: string;
    id?: string;
    error?: {
      message?: string;
      type?: string;
      code?: number;
      error_subcode?: number;
      fbtrace_id?: string;
    };
  } | null = null;

  try {
    result = responseText ? JSON.parse(responseText) : null;
  } catch {
    result = null;
  }

  if (!response.ok || result?.error) {
    const metaError = result?.error;
    const details = [
      `HTTP ${response.status}`,
      metaError?.type ? `type ${metaError.type}` : null,
      typeof metaError?.code === "number" ? `code ${metaError.code}` : null,
      typeof metaError?.error_subcode === "number"
        ? `sous-code ${metaError.error_subcode}`
        : null,
      metaError?.fbtrace_id ? `trace ${metaError.fbtrace_id}` : null,
    ].filter(Boolean).join(" | ");

    // Ne jamais renvoyer le corps brut : il pourrait contenir un secret.
    const facebookMessage = metaError?.message ||
      "Reponse Facebook invalide ou erreur sans message.";
    throw new Error(`Facebook : ${facebookMessage} (${details})`);
  }

  return {
    id: clean(
      result?.post_id || result?.id
    ),
  };
}

export async function POST(request: Request) {
  let animalId = "";

  try {
    /*
     * S├®curit├® :
     * v├®rifie la session Supabase
     * et le r├┤le administrateur.
     */
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

    /*
     * R├®cup├®ration des donn├®es de l'animal,
     * y compris les champs n├®cessaires
     * ├á la r├®daction personnalis├®e.
     */
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

    /*
     * D├®termine si la publication
     * concerne une adoption r├®ussie
     * ou un animal disponible.
     */
    const adopted =
      animal.is_adopted === true ||
      clean(animal.status).toLowerCase() ===
        "adopted";

    /*
     * Emp├¬che de promouvoir un animal
     * qui n'est ni disponible
     * ni officiellement adopt├®.
     */
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
            "Cet animal n'est pas actuellement disponible ├á l'adoption.",
        },
        { status: 409 }
      );
    }

    const facebook = getFacebookConfig(request);

    const animalUrl =
      `${facebook.siteUrl}/animal/` +
      encodeURIComponent(animalId);

    /*
     * Image officielle de partage.
     * La version adopt├®e conserve
     * son visuel sp├®cifique.
     */
    const shareImageUrl =
      `${facebook.siteUrl}/api/facebook/share-image/` +
      `${encodeURIComponent(animalId)}` +
      `?mode=${adopted ? "adopted" : "available"}` +
      `&v=${Date.now()}`;

    /*
     * V├®rification de l'image
     * avant toute publication.
     */
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
        `Image Facebook inaccessible (${imageCheck.status}) : ${shareImageUrl}`
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
        "Le serveur ne retourne pas une image Facebook valide."
      );
    }

    /*
     * G├®n├®ration IA :
     *
     * - available : recherche de famille
     * - adopted : annonce d'adoption
     *
     * Le module utilise automatiquement
     * un texte classique si OpenAI ├®choue.
     */
    const message =
      await generateFacebookAnimalMessage(
        animal,
        animalUrl,
        adopted ? "adopted" : "available"
      );

    /*
     * Publication sur la page Facebook.
     * Le texte et l'image sont envoy├®s
     * dans la m├¬me publication.
     */
    const result =
      await publishFacebookPhoto({
        pageId: facebook.pageId,
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
      facebook_post_id:
        result.id || null,
    });
  } catch (error: unknown) {
    /*
     * Les erreurs d'authentification
     * sont trait├®es par la fonction
     * de s├®curit├® existante.
     */
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
      error
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
