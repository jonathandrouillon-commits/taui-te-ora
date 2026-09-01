import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

import AnimalPublicClient from "./AnimalPublicClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getSupabaseServer() {
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const animalUrl =
    `https://www.taui-te-ora.com/animal/${id}`;

  const openGraphImageUrl =
    `${animalUrl}/opengraph-image?v=5`;

  try {
    const supabase =
      getSupabaseServer();

    const {
      data: animal,
      error,
    } = await supabase
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
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(
        "Erreur metadata animal :",
        error
      );
    }

    const animalName =
      animal?.animal_name ||
      "Animal";

    const title =
      `${animalName} cherche sa famille | TAUI TE ORA`;

    const details = [
      animal?.animal_type,
      animal?.breed,
      animal?.age_label,
      animal?.sex,
      animal?.city,
      animal?.island,
    ].filter(Boolean);

    const description =
      animal
        ? `${animalName} cherche sa famille ❤️ ${
            details.length
              ? `${details.join(" · ")}. `
              : ""
          }Découvrez sa fiche sur TAUI TE ORA.`
        : "Découvrez cet animal à l'adoption sur TAUI TE ORA.";

    return {
      title,
      description,

      alternates: {
        canonical: animalUrl,
      },

      openGraph: {
        title,
        description,
        url: animalUrl,
        siteName: "TAUI TE ORA",
        type: "website",

        images: [
          {
            url: openGraphImageUrl,
            width: 1200,
            height: 630,
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
    };
  } catch (error) {
    console.error(
      "Erreur generateMetadata animal :",
      error
    );

    return {
      title:
        "Animal à adopter | TAUI TE ORA",

      description:
        "Découvrez cet animal sur TAUI TE ORA.",

      openGraph: {
        title:
          "Animal à adopter | TAUI TE ORA",

        description:
          "Découvrez cet animal sur TAUI TE ORA.",

        url: animalUrl,

        siteName:
          "TAUI TE ORA",

        type:
          "website",

        images: [
          {
            url:
              `${animalUrl}/opengraph-image?v=5`,
            width: 1200,
            height: 630,
            alt:
              "Animal à adopter - TAUI TE ORA",
          },
        ],
      },

      twitter: {
        card:
          "summary_large_image",

        title:
          "Animal à adopter | TAUI TE ORA",

        description:
          "Découvrez cet animal sur TAUI TE ORA.",

        images: [
          `${animalUrl}/opengraph-image?v=5`,
        ],
      },
    };
  }
}

export default async function AnimalPage({
  params,
}: PageProps) {
  await params;

  return (
    <AnimalPublicClient />
  );
}