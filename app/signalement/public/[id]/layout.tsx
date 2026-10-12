import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.taui-te-ora.com";

const IMAGE_VERSION = "2";

type Props = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

type SignalementMetadata = {
  id: string;
  type_signalement: string | null;
  animal_name: string | null;
  animal_type: string | null;
  city: string | null;
  island: string | null;
};

type SignalementMedia = {
  file_url: string | null;
  file_type: string | null;
};

function clean(value: string | null | undefined): string {
  return String(value || "").trim();
}

function alertLabel(value: string | null): string {
  const type = clean(value).toLowerCase();

  if (type.includes("perdu")) {
    return "Animal perdu";
  }

  if (type.includes("trouv")) {
    return "Animal trouvé";
  }

  if (type.includes("bless")) {
    return "Animal blessé";
  }

  if (type.includes("errant")) {
    return "Animal errant";
  }

  if (type.includes("maltrait")) {
    return "Signalement de maltraitance";
  }

  if (
    type.includes("mort") ||
    type.includes("décéd")
  ) {
    return "Animal décédé";
  }

  return "Signalement animal";
}

function isImageMedia(media: SignalementMedia): boolean {
  const url = clean(media.file_url);
  const type = clean(media.file_type).toLowerCase();

  if (!url) return false;

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:"
    ) {
      return false;
    }
  } catch {
    return false;
  }

  return !type || type.startsWith("image/");
}

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;

  const pageUrl =
    `${SITE_URL}/signalement/public/${encodeURIComponent(id)}`;

  const fallback: Metadata = {
    title: "Signalement animal | TAUI TE ORA",
    description:
      "Consultez ce signalement sur TAUI TE ORA.",
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
  };

  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return fallback;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    console.error(
      "Configuration Supabase manquante pour les métadonnées."
    );

    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from("signalements")
      .select(
        "id,type_signalement,animal_name,animal_type,city,island"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error(
          "Erreur métadonnées signalement :",
          error
        );
      }

      return fallback;
    }

    const signalement =
      data as SignalementMetadata;

    const kind = alertLabel(
      signalement.type_signalement
    );

    const name =
      clean(signalement.animal_name) ||
      clean(signalement.animal_type) ||
      "Animal";

    const place = [
      clean(signalement.city),
      clean(signalement.island),
    ]
      .filter(Boolean)
      .join(", ");

    const title =
      `${kind} : ${name}` +
      (place ? ` à ${place}` : "") +
      " | TAUI TE ORA";

    const description =
      `${kind} : ${name}` +
      (place ? `, secteur ${place}` : "") +
      ". Consultez la fiche et partagez cette alerte pour aider.";

    const { data: medias, error: mediaError } =
      await supabase
        .from("signalement_medias")
        .select("file_url,file_type")
        .eq("signalement_id", id)
        .limit(30);

    if (mediaError) {
      console.error(
        "Erreur médias métadonnées :",
        mediaError
      );
    }

    const hasPhoto = (
      (medias || []) as SignalementMedia[]
    ).some(isImageMedia);

    const imageUrl =
      `${SITE_URL}/api/share-image/signalement/` +
      `${encodeURIComponent(id)}?v=${IMAGE_VERSION}`;

    return {
      title,
      description,

      alternates: {
        canonical: pageUrl,
      },

      robots: {
        index: false,
        follow: true,
      },

      openGraph: {
        type: "article",
        locale: "fr_FR",
        siteName:
          "TAUI TE ORA by Les Veilleurs de Kali",
        url: pageUrl,
        title,
        description,

        ...(hasPhoto
          ? {
              images: [
                {
                  url: imageUrl,
                  width: 1200,
                  height: 1200,
                  alt: `${kind} : ${name}`,
                  type: "image/png",
                },
              ],
            }
          : {}),
      },

      twitter: {
        card: hasPhoto
          ? "summary_large_image"
          : "summary",
        title,
        description,

        ...(hasPhoto
          ? {
              images: [imageUrl],
            }
          : {}),
      },
    };
  } catch (error) {
    console.error(
      "Erreur génération métadonnées signalement :",
      error
    );

    return fallback;
  }
}

export default function PublicSignalementLayout({
  children,
}: Props) {
  return children;
}