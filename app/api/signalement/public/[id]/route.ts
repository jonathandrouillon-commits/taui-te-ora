import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const PUBLIC_FIELDS = "id,type_signalement,animal_type,animal_name,sex,age_label,color,breed,collar_color,distinctive_features,island,city,disappearance_at,found_at,situation,status";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Configuration serveur indisponible" }, { status: 503 });
  }
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from("signalements").select(PUBLIC_FIELDS).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Signalement introuvable" }, { status: 404 });
    const { data: media, error: mediaError } = await db.from("signalement_medias").select("file_url,file_type").eq("signalement_id", id).limit(30);
    if (mediaError) console.error("Médias publics indisponibles", mediaError.message);
    const medias = (media || []).filter((item) => typeof item.file_url === "string" && /^https?:\/\//i.test(item.file_url) && !String(item.file_type || "").startsWith("video/"));
    return NextResponse.json({ signalement: data, medias }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erreur chargement signalement public", error);
    return NextResponse.json({ error: "Erreur de chargement" }, { status: 500 });
  }
}
