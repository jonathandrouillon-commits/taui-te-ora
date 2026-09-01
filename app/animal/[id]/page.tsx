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
  photo_url: string | null;
};

type AnimalPhotoRow = {
  photo_url: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

const SITE_URL = "https://www.taui-te-ora.com";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Configuration Supabase serveur manquante.");
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const fallbackTitle = "Animal à adopter | TAUI TE ORA";
  const fallbackDescription =
    "Découvrez les animaux à l'adoption sur TAUI TE ORA.";
  const fallbackImage = `${SITE_URL}/logo-taui-te-ora.png`;
  const animalUrl = `${SITE_URL}/animal/${id}`;

  try {
    const supabase = getSupabaseServer();

    const { data: animal, error: animalError } = await supabase
      .from("animals")
      .select(
        "id, animal_name, animal_type, breed, age_label, city, island, photo_url"
      )
      .eq("id", id)
      .maybeSingle<AnimalMetadataRow>();

    if (animalError || !animal) {
      return {
        title: fallbackTitle,
        description: fallbackDescription,
        openGraph: {
          title: fallbackTitle,
          description: fallbackDescription,
          url: animalUrl,
          siteName: "TAUI TE ORA",
          type: "website",
          images: [{ url: fallbackImage, alt: "TAUI TE ORA" }],
        },
        twitter: {
          card: "summary_large_image",
          title: fallbackTitle,
          description: fallbackDescription,
          images: [fallbackImage],
        },
      };
    }

    const { data: photoRows } = await supabase
      .from("animal_photos")
      .select("photo_url, is_cover, sort_order")
      .eq("animal_id", id)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    const photos = (photoRows || []) as AnimalPhotoRow[];

    const mainPhoto =
      photos.find((photo) => photo.is_cover && photo.photo_url)?.photo_url ||
      photos.find((photo) => Boolean(photo.photo_url))?.photo_url ||
      animal.photo_url ||
      fallbackImage;

    const animalName = animal.animal_name || "Cet animal";
    const title = `${animalName} cherche sa famille | TAUI TE ORA`;

    const details = [
      animal.animal_type,
      animal.breed,
      animal.age_label,
      animal.city,
      animal.island,
    ].filter(Boolean);

    const description =
      details.length > 0
        ? `${animalName} cherche sa famille ❤️ ${details.join(
            " · "
          )}. Découvrez sa fiche sur TAUI TE ORA.`
        : `${animalName} cherche sa famille ❤️ Découvrez sa fiche sur TAUI TE ORA.`;

    return {
      title,
      description,
      alternates: { canonical: animalUrl },
      openGraph: {
        title,
        description,
        url: animalUrl,
        siteName: "TAUI TE ORA",
        type: "website",
        images: [
          {
            url: mainPhoto,
            alt: animalName,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [mainPhoto],
      },
    };
  } catch (error) {
    console.error("Erreur métadonnées animal :", error);

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: animalUrl,
        siteName: "TAUI TE ORA",
        type: "website",
        images: [{ url: fallbackImage, alt: "TAUI TE ORA" }],
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDescription,
        images: [fallbackImage],
      },
    };
  }
}

export default function AnimalPage() {
  return <AnimalPublicClient />;
}
