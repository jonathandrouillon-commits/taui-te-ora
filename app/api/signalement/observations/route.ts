import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const txt = (v: unknown, max = 300) => typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 503 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    const b = body as Record<string, unknown>;
    const id = txt(b.signalement_id, 40);
    const island = txt(b.island, 100);
    const commune = txt(b.commune, 100);
    const certainty = txt(b.certainty, 30);
    const observedAt = txt(b.observed_at, 40);
    const timestamp = new Date(observedAt);
    if (!UUID.test(id) || !island || !commune || !["certain", "possible", "incertain"].includes(certainty) || !observedAt || Number.isNaN(timestamp.getTime()) || timestamp.getTime() > Date.now() + 300000) {
      return NextResponse.json({ error: "Complétez la date, l'heure, l'île, la commune et votre niveau de certitude." }, { status: 400 });
    }
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: report, error: reportError } = await db.from("signalements").select("id,animal_type,color,city,island,disappearance_at,user_id").eq("id", id).maybeSingle();
    if (reportError) throw reportError;
    if (!report) return NextResponse.json({ error: "Signalement introuvable" }, { status: 404 });
    if (report.disappearance_at && timestamp.getTime() < new Date(report.disappearance_at).getTime()) {
      return NextResponse.json({ error: "La date précède la disparition indiquée." }, { status: 400 });
    }
    // Évaluation indicative explicable, sans présenter un calcul heuristique comme une analyse IA.
    let score = 20;
    const reasons: string[] = [];
    if (txt(b.animal_type).toLowerCase() === txt(report.animal_type).toLowerCase()) { score += 20; reasons.push("Espèce compatible"); }
    if (txt(b.color) && txt(report.color).toLowerCase().includes(txt(b.color).toLowerCase())) { score += 20; reasons.push("Couleur compatible"); }
    if (commune.toLowerCase() === txt(report.city).toLowerCase()) { score += 15; reasons.push("Même commune"); }
    if (island.toLowerCase() === txt(report.island).toLowerCase()) { score += 10; reasons.push("Même île"); }
    if (certainty === "certain") score += 10;
    if (certainty === "incertain") score -= 10;
    score = Math.max(0, Math.min(95, score));
    const { data, error } = await db.from("signalement_observations").insert({
      signalement_id: id, observed_at: timestamp.toISOString(), island, commune,
      quartier: txt(b.quartier, 150) || null,
      location_details: txt(b.location_details, 500) || null,
      animal_type: txt(b.animal_type, 60) || null,
      color: txt(b.color, 80) || null,
      behavior: txt(b.behavior, 100) || null,
      certainty, comments: txt(b.comments, 3000) || null,
      match_score: score,
      match_explanation: reasons.length ? reasons.join(" ; ") : "Éléments insuffisants pour une correspondance solide",
      ai_status: "not_configured"
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, observation_id: data.id, message: "Observation enregistrée. Elle reste à vérifier." }, { status: 201 });
  } catch (error) {
    console.error("Enregistrement observation", error);
    return NextResponse.json({ error: "Impossible d'enregistrer l'observation" }, { status: 500 });
  }
}
