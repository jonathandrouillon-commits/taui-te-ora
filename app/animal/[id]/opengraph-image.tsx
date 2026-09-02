import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

import AnimalPublicClient from "./AnimalPublicClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const SITE_URL =
  "https://www.taui-te-ora.com";

function getSupabaseServer() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return null;
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } =
    await params;

  const animalUrl =
    `${SITE_URL}/animal/${id}`;

  /*
   * Image Open Graph dédiée à cet animal.
   *
   * v=11 permet de forcer Facebook
   * à oublier les anciennes versions
   * mises en cache.
   */
  const openGraphImageUrl =
    `${animalUrl}/opengraph-image?v=11`;

  let animalName =
    "Animal";

  let animal:
    | {
        animal_name?: string | null;
        animal_type?: string | null;
        breed?: string | null;
        age_label?: string | null;
        sex?: string | null;
        city?: string | null;
        island?: string | null;
      }
    | null = null;

  try {
    const supabase =
      getSupabaseServer();

    if (supabase) {
      const {
        data,
        error,
      } =
        await supabase
          .from("animals")
          .select(`
            id,
            animal_name,
            animal_type,
            breed,
            age_label,
            sex,
            city,
            island
          `)
          .eq(
            "id",
            id
          )
          .maybeSingle();

      if (error) {
        console.error(
          "Erreur metadata animal :",
          error
        );
      }

      if (data) {
        animal =
          data;

        if (
          data.animal_name &&
          String(
            data.animal_name
          ).trim()
        ) {
          animalName =
            String(
              data.animal_name
            ).trim();
        }
      }
    }
  } catch (
    error
  ) {
    console.error(
      "Erreur generateMetadata animal :",
      error
    );
  }

  const title =
    animalName !==
    "Animal"
      ? `${animalName} cherche sa famille | TAUI TE ORA`
      : "Animal à adopter | TAUI TE ORA";

  const details =
    [
      animal?.animal_type,
      animal?.breed,
      animal?.age_label,
      animal?.sex,
      animal?.city,
      animal?.island,
    ].filter(
      Boolean
    );

  const description =
    animalName !==
    "Animal"
      ? `${animalName} cherche sa famille ❤️ ${
          details.length
            ? `${details.join(
                " · "
              )}. `
            : ""
        }Découvrez sa fiche sur TAUI TE ORA.`
      : "Découvrez cet animal actuellement à l'adoption sur TAUI TE ORA.";

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
            openGraphImageUrl,

          secureUrl:
            openGraphImageUrl,

          width:
            1200,

          height:
            630,

          type:
            "image/png",

          alt:
            `${animalName} - TAUI TE ORA`,
        },
      ],
    },

    twitter: {
      card:
        "summary_large_image",

      title,
      description,

      images: [
        openGraphImageUrl,
      ],
    },

    other: {
      "og:image:width":
        "1200",

      "og:image:height":
        "630",

      "og:image:type":
        "image/png",
    },
  };
}

export default async function AnimalPage({
  params,
}: PageProps) {
  await params;

  return (
    <AnimalPublicClient />
  );
}