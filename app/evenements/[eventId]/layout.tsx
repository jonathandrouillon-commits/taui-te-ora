import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://www.taui-te-ora.com";

type Props = {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
};

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const eventUrl = `${SITE_URL}/evenements/${encodeURIComponent(eventId)}`;
  const imageUrl = `${SITE_URL}/api/share-image/evenement/${encodeURIComponent(eventId)}`;
  const supabase = getSupabaseServer();

  let title = "Événement | TAUI TE ORA";
  let description = "Découvrez cet événement sur TAUI TE ORA.";

  if (supabase) {
    const { data } = await supabase
      .from("events")
      .select("title,start_date,location_name,city,island,is_published")
      .eq("id", eventId)
      .eq("is_published", true)
      .maybeSingle();

    if (data) {
      title = `${data.title} | TAUI TE ORA`;
      const place = [data.location_name, data.city, data.island].filter(Boolean).join(" • ");
      description = [data.start_date ? `📅 ${data.start_date}` : null, place ? `📍 ${place}` : null].filter(Boolean).join(" — ") || description;
    }
  }

  return {
    title,
    description,
    openGraph: { title, description, url: eventUrl, siteName: "TAUI TE ORA", type: "website", images: [{ url: imageUrl, width: 1200, height: 1200, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

export default function EventLayout({ children }: Props) {
  return children;
}
