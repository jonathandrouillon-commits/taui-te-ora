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

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    anonKey,
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

  /*
   * IMPORTANT
   *
   * Cette image est toujours utilisée,
   * même si Supabase ne renvoie pas l'animal.
   *
   * Le ?v=6 permet aussi de casser
   * l'ancien cache Facebook.
   */
  const shareImage =
    `${animalUrl}/opengraph-image?v=6`;

  let animalName = "Animal";

  try {
    const supabase =
      getSupabaseServer();

    if (supabase) {
      /*
       * Requête volontairement MINIMALE.
       *
       * On sait que ces colonnes existent.
       * Une colonne incorrecte ne pourra donc
       * plus faire échouer toute la metadata.
       */
      const {
        data,
        error,
      } = await supabase
        .from("animals")
        .select(`
          id,
          animal_name
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(
          "Metadata animal Supabase :",
          error
        );
      }

      if (
        data?.animal_name &&
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
  } catch (error) {
    /*
     * Une erreur ici ne doit JAMAIS
     * empêcher l'OpenGraph d'être généré.
     */
    console.error(
      "Erreur metadata animal :",
      error
    );
  }

  const title =
    animalName !== "Animal"
      ? `${animalName} cherche sa famille | TAUI TE ORA`
      : "Animal à adopter | TAUI TE ORA";

  const description =
    animalName !== "Animal"
      ? `Découvrez ${animalName}, actuellement à l'adoption sur TAUI TE ORA ❤️`
      : "Découvrez cet animal actuellement à l'adoption sur TAUI TE ORA.";

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

      siteName:
        "TAUI TE ORA",

      type:
        "website",

      images: [
        {
          url:
            shareImage,

          width:
            1200,

          height:
            630,

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
        shareImage,
      ],
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