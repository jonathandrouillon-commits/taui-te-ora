import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = admin();
  if (!supabase) return new Response("Configuration manquante", { status: 500 });
  const { data: item } = await supabase.from("signalements").select("id,type_signalement,animal_type,animal_name,city,island").eq("id", id).maybeSingle();
  if (!item) return new Response("Introuvable", { status: 404 });
  const { data: medias } = await supabase.from("signalement_medias").select("file_url,file_type").eq("signalement_id", id).limit(5);
  const photo = (medias || []).find((m: any) => String(m.file_type || "").startsWith("image/"))?.file_url || null;
  const logo = process.env.TAUI_LOGO_URL || "https://www.taui-te-ora.com/logo-taui-te-ora.png";
  const type = item.type_signalement || "Signalement";
  const name = item.animal_name || item.animal_type || "Animal";
  const place = [item.city, item.island].filter(Boolean).join(" • ");

  return new ImageResponse(
    <div style={{ width: "1200px", height: "1200px", display: "flex", position: "relative", background: "#064b42", fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      {photo ? <img src={photo} width="1200" height="1200" style={{ position: "absolute", inset: 0, width: "1200px", height: "1200px", objectFit: "cover" }} /> : null}
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(to bottom, rgba(0,0,0,.10) 25%, rgba(0,0,0,.88) 100%)" }} />
      <div style={{ position: "absolute", top: 55, left: 55, display: "flex", padding: "18px 28px", borderRadius: 40, background: "#dc2626", color: "white", fontSize: 34, fontWeight: 900 }}>🚨 ALERTE TAUI TE ORA</div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 65, display: "flex", flexDirection: "column", color: "white" }}>
        <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 900, textTransform: "uppercase" }}>{type}</div>
        <div style={{ marginTop: 18, fontSize: 48, fontWeight: 800 }}>{name}</div>
        <div style={{ marginTop: 14, fontSize: 34 }}>📍 {place || "Polynésie française"}</div>
        <div style={{ marginTop: 35, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Partagez pour aider 🐾</div>
          <img src={logo} width="170" height="90" style={{ objectFit: "contain" }} />
        </div>
      </div>
    </div>,
    { width: 1200, height: 1200 }
  );
}
