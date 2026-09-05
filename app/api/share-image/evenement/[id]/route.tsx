import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 1200;

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configuration Supabase serveur manquante.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function formatDate(value: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = getSupabaseServer();
  const { data: event, error } = await supabase
    .from("events")
    .select("id,title,event_type,start_date,start_time,location_name,city,island,image_url,is_published")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !event) return new Response("Événement introuvable", { status: 404 });

  const logo = process.env.TAUI_LOGO_URL || "https://www.taui-te-ora.com/logo-taui-te-ora.png";
  const place = [event.location_name, event.city, event.island].filter(Boolean).join(" • ");
  const time = event.start_time ? ` • ${String(event.start_time).slice(0, 5)}` : "";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#f4eee5", fontFamily: "sans-serif" }}>
      {event.image_url ? (
        <img src={event.image_url} alt="" width={WIDTH} height={HEIGHT} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 220 }}>📅</div>
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.90) 100%)" }} />
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 62, display: "flex", flexDirection: "column", color: "white" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 800, marginBottom: 18 }}>📅 ÉVÉNEMENT TAUI TE ORA</div>
        <div style={{ display: "flex", fontSize: 62, lineHeight: 1.05, fontWeight: 900, maxWidth: 1000 }}>{event.title}</div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 24, fontWeight: 700 }}>{formatDate(event.start_date)}{time}</div>
        {place ? <div style={{ display: "flex", fontSize: 28, marginTop: 10 }}>📍 {place}</div> : null}
      </div>
      <div style={{ position: "absolute", right: 48, top: 48, display: "flex", alignItems: "center", justifyContent: "center", width: 150, height: 150, borderRadius: 75, background: "rgba(255,255,255,0.94)", padding: 18 }}>
        <img src={logo} alt="TAUI TE ORA" width="114" height="114" style={{ objectFit: "contain" }} />
      </div>
    </div>,
    { width: WIDTH, height: HEIGHT }
  );
}
