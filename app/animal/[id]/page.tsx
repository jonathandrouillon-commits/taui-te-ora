import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

import AnimalPublicClient from "./AnimalPublicClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AnimalMetadataRow = {
  id: string;
  animal_name: string | null;
  animal_type: string | null;
  breed: string | null;
  age_label: string | null;
  city: string | null;
  island: string | null;
  is_adopted: boolean | null;
};

const SITE_URL =
  "https://www.taui-te-ora.com";

function getSupabaseServer() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRole =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !serviceRole
  ) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    url,
    serviceRole,
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    id,
  } =
    await params;

  const fallbackTitle =
    "Animal à adopter | TAUI TE ORA";

  const fallbackDescription =
    "Découvrez les animaux à l'adoption sur TAUI TE ORA.";

  const fallbackImage =
    `${SITE_URL}/logo-taui-te-ora.png`;

  const animalUrl =
    `${SITE_URL}/animal/${encodeURIComponent(
      id
    )}`;

  try {
    const supabase =
      getSupabaseServer();

    /*
     * IMPORTANT
     *
     * Les photos ne sont plus stockées
     * directement dans public.animals.
     *
     * Il ne faut donc surtout plus
     * demander animals.photo_url ici.
     */
    const {
      data: animal,
      error:
        animalError,
    } =
      await supabase
        .from(
          "animals"
        )
        .select(
          `
            id,
            animal_name,
            animal_type,
            breed,
            age_label,
            city,
            island,
            is_adopted
          `
        )
        .eq(
          "id",
          id
        )
        .maybeSingle<AnimalMetadataRow>();

    if (
      animalError
    ) {
      console.error(
        "Erreur récupération métadonnées animal :",
        animalError
      );
    }

    if (
      animalError ||
      !animal
    ) {
      return {
        title:
          fallbackTitle,

        description:
          fallbackDescription,

        alternates: {
          canonical:
            animalUrl,
        },

        openGraph: {
          title:
            fallbackTitle,

          description:
            fallbackDescription,

          url:
            animalUrl,

          siteName:
            "TAUI TE ORA",

          type:
            "website",

          images: [
            {
              url:
                fallbackImage,

              alt:
                "TAUI TE ORA",
            },
          ],
        },

        twitter: {
          card:
            "summary_large_image",

          title:
            fallbackTitle,

          description:
            fallbackDescription,

          images: [
            fallbackImage,
          ],
        },
      };
    }

    /*
     * Le visuel Facebook est généré
     * par notre route dédiée.
     *
     * Cette route récupère elle-même
     * la photo principale depuis
     * public.animal_photos.
     */
    const brandedShareImage =
      `${SITE_URL}/api/facebook/share-image/${encodeURIComponent(
        id
      )}?mode=${
        animal.is_adopted
          ? "adopted"
          : "available"
      }`;

    const animalName =
      animal
        .animal_name
        ?.trim() ||
      "Cet animal";

    const title =
      animal.is_adopted
        ? `${animalName} a trouvé sa famille | TAUI TE ORA`
        : `${animalName} cherche sa famille | TAUI TE ORA`;

    const details =
      [
        animal
          .animal_type,

        animal
          .breed,

        animal
          .age_label,

        animal
          .city,

        animal
          .island,
      ].filter(
        (
          value
        ): value is string =>
          Boolean(
            value &&
              value.trim()
          )
      );

    const description =
      animal.is_adopted
        ? details.length >
          0
          ? `${animalName} a trouvé sa famille ❤️ ${details.join(
              " · "
            )}. Découvrez son histoire sur TAUI TE ORA.`
          : `${animalName} a trouvé sa famille ❤️ Découvrez son histoire sur TAUI TE ORA.`
        : details.length >
            0
          ? `${animalName} cherche sa famille ❤️ ${details.join(
              " · "
            )}. Découvrez sa fiche sur TAUI TE ORA.`
          : `${animalName} cherche sa famille ❤️ Découvrez sa fiche sur TAUI TE ORA.`;

    return {
      title,

      description,

      alternates: {
        canonical:
          animalUrl,
      },

      openGraph: {
        title,

        description,

        url:
          animalUrl,

        siteName:
          "TAUI TE ORA",

        type:
          "website",

        images: [
          {
            url:
              brandedShareImage,

            width:
              1200,

            height:
              1200,

            alt:
              animalName,
          },
        ],
      },

      twitter: {
        card:
          "summary_large_image",

        title,

        description,

        images: [
          brandedShareImage,
        ],
      },
    };
  } catch (
    error
  ) {
    console.error(
      "Erreur métadonnées animal :",
      error
    );

    return {
      title:
        fallbackTitle,

      description:
        fallbackDescription,

      alternates: {
        canonical:
          animalUrl,
      },

      openGraph: {
        title:
          fallbackTitle,

        description:
          fallbackDescription,

        url:
          animalUrl,

        siteName:
          "TAUI TE ORA",

        type:
          "website",

        images: [
          {
            url:
              fallbackImage,

            alt:
              "TAUI TE ORA",
          },
        ],
      },

      twitter: {
        card:
          "summary_large_image",

        title:
          fallbackTitle,

        description:
          fallbackDescription,

        images: [
          fallbackImage,
        ],
      },
    };
  }
}

export default function AnimalPage() {
  return (
    <AnimalPublicClient />
  );
}