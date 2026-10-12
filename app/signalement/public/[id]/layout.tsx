import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.taui-te-ora.com";

type Props = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

function alertLabel(value: string | null): string {
  const type = (value || "").toLowerCase();
  if (type.includes("perdu")) return "Animal perdu";
  if (type.includes("trouv")) return "Animal trouvé";
  if (type.includes("bless")) return "Animal blessé";
  if (type.includes("errant")) return "Animal errant";
  if (type.includes("maltrait")) return "Signalement de maltraitance";
  if (type.includes("mort") || type.includes("décéd")) return "Animal décédé";
  return "Signalement animal";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pageUrl = `${SITE_URL}/signalement/public/${encodeURIComponent(id)}`;
  const fallback: Metadata = {
    title: "Signalement animal | TAUI TE ORA",
    description: "Consultez ce signalement sur TAUI TE ORA.",
    alternates: { canonical: pageUrl },
    robots: { index: false, follow: true },
  };

  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return fallback;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return fallback;

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("signalements")
      .select("id,type_signalement,animal_name,animal_type,city,island")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return fallback;

    const kind = alertLabel(data.type_signalement);
    const name = String(data.animal_name || data.animal_type || "Animal").trim();
    const place = [data.city, data.island].filter(Boolean).join(", ");
    const title = `${kind} : ${name}${place ? ` à ${place}` : ""} | TAUI TE ORA`;
    const description = `${kind} : ${name}${place ? `, secteur ${place}` : ""}. Consultez la fiche et partagez cette alerte pour aider.`;

    const { data: medias } = await supabase
      .from("signalement_medias")
      .select("file_url,file_type")
      .eq("signalement_id", id)
      .limit(30);
    const hasPhoto = (medias || []).some((media) => {
      const url = media.file_url;
      const type = String(media.file_type || "").toLowerCase();
      return typeof url === "string" && /^https?:\/\//i.test(url) && !type.startsWith("video/");
    });
    const imageUrl = `${SITE_URL}/api/share-image/signalement/${encodeURIComponent(id)}`;

    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      robots: { index: false, follow: true },
      openGraph: {
        type: "article",
        locale: "fr_FR",
        siteName: "TAUI TE ORA by Les Veilleurs de Kali",
        url: pageUrl,
        title,
        description,
        ...(hasPhoto ? { images: [{ url: imageUrl, width: 1200, height: 1200, alt: `${kind} : ${name}` }] } : {}),
      },
      twitter: {
        card: hasPhoto ? "summary_large_image" : "summary",
        title,
        description,
        ...(hasPhoto ? { images: [imageUrl] } : {}),
      },
    };
  } catch (error) {
    console.error("Erreur métadonnées signalement :", error);
    return fallback;
  }
}

export default function PublicSignalementLayout({ children }: Props) {
  return children;
}
