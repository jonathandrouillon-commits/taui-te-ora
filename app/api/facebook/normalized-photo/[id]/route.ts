import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import sharp from "sharp";

export const runtime = "nodejs";

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

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const {
      id,
    } =
      await context.params;

    const supabase =
      getSupabaseAdmin();

    /*
     * On récupère la photo principale exactement
     * comme pour le partage Facebook :
     * cover en priorité, sinon première photo.
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
          id
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
        "Erreur récupération photo normalisée :",
        photosError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Impossible de récupérer la photo.",
        },
        {
          status: 500,
        }
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
      "";

    if (!photoUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Photo introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Téléchargement de l'image originale.
     */
    const sourceResponse =
      await fetch(
        photoUrl,
        {
          cache: "no-store",
        }
      );

    if (!sourceResponse.ok) {
      console.error(
        "Téléchargement photo impossible :",
        sourceResponse.status,
        sourceResponse.statusText
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Impossible de télécharger la photo.",
        },
        {
          status: 502,
        }
      );
    }

    const inputBuffer =
      Buffer.from(
        await sourceResponse.arrayBuffer()
      );

    /*
     * .rotate() SANS angle :
     * Sharp lit automatiquement les métadonnées EXIF
     * et remet physiquement les pixels dans le bon sens.
     *
     * Ensuite les métadonnées d'orientation ne sont plus
     * nécessaires : ImageResponse reçoit une image déjà droite.
     */
    const outputBuffer =
      await sharp(
        inputBuffer
      )
        .rotate()
        .jpeg({
          quality: 92,
          mozjpeg: true,
        })
        .toBuffer();

    return new Response(
      new Uint8Array(
        outputBuffer
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "image/jpeg",

          /*
           * Les photos peuvent être mises en cache,
           * mais pas trop longtemps pendant nos tests.
           */
          "Cache-Control":
            "public, max-age=300, s-maxage=300",

          "Content-Disposition":
            `inline; filename="animal-${id}.jpg"`,
        },
      }
    );
  } catch (error) {
    console.error(
      "Erreur normalisation photo Facebook :",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Erreur lors de la normalisation de la photo.",
      },
      {
        status: 500,
      }
    );
  }
}
