import { issueObservationMediaReceipt } from "../../../lib/observationMediaReceipt";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const txt = (value: unknown, max = 300): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const noStore = { "Cache-Control": "no-store" };

function response(data: Record<string, unknown>, status: number) {
  return NextResponse.json(data, { status, headers: noStore });
}

function parseCoordinate(
  value: unknown,
  min: number,
  max: number
): number | null {
  if (value === null || value === undefined) return null;

  let numeric: number;

  if (typeof value === "number") {
    numeric = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Accept decimal comma from French-language forms, but not arbitrary text.
    const normalized = trimmed.replace(",", ".");
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
      throw new Error("Coordonnées GPS invalides.");
    }
    numeric = Number(normalized);
  } else {
    throw new Error("Coordonnées GPS invalides.");
  }

  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error("Coordonnées GPS invalides.");
  }

  return numeric;
}

function validPhone(value: string): boolean {
  if (!/^[+0-9().\s-]{6,30}$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return response({ error: "Configuration serveur manquante." }, 503);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 15000) {
      return response({ error: "Le formulaire est trop volumineux." }, 413);
    }

    const raw = await request.text();
    if (raw.length > 15000) {
      return response({ error: "Le formulaire est trop volumineux." }, 413);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return response({ error: "Données JSON invalides." }, 400);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return response({ error: "Données invalides." }, 400);
    }

    const b = parsed as Record<string, unknown>;
    const id = txt(b.signalement_id, 40);
    const firstName = txt(b.first_name, 100);
    const lastName = txt(b.last_name, 100);
    const phone = txt(b.phone, 30);
    const island = txt(b.island, 100);
    const commune = txt(b.commune, 100);
    const quartier = txt(b.quartier, 150);
    const locationDetails = txt(b.location_details, 500);
    const animalType = txt(b.animal_type, 60);
    const color = txt(b.color, 80);
    const behavior = txt(b.behavior, 100);
    const certainty = txt(b.certainty, 30);
    const comments = txt(b.comments, 3000);
    const observedAt = txt(b.observed_at, 40);
    const timestamp = new Date(observedAt);

    if (!UUID.test(id)) {
      return response({ error: "Identifiant de signalement invalide." }, 400);
    }

    if (!firstName || !lastName || !validPhone(phone)) {
      return response(
        { error: "Veuillez renseigner un prénom, un nom et un téléphone valide." },
        400
      );
    }

    if (!island || !commune || !["certain", "possible", "incertain"].includes(certainty)) {
      return response(
        { error: "Complétez l'île, la commune et votre niveau de certitude." },
        400
      );
    }

    if (
      !observedAt ||
      Number.isNaN(timestamp.getTime()) ||
      timestamp.getTime() > Date.now() + 300000
    ) {
      return response(
        { error: "Veuillez indiquer une date et une heure d'observation valides." },
        400
      );
    }

    let latitude: number | null;
    let longitude: number | null;
    let gpsAccuracy: number | null;

    try {
      latitude = parseCoordinate(b.latitude, -90, 90);
      longitude = parseCoordinate(b.longitude, -180, 180);
      gpsAccuracy = parseCoordinate(b.gps_accuracy, 0, 100000);
    } catch {
      return response({ error: "Coordonnées GPS invalides." }, 400);
    }

    if ((latitude === null) !== (longitude === null)) {
      return response(
        { error: "La latitude et la longitude doivent être fournies ensemble." },
        400
      );
    }

    if (latitude === null) gpsAccuracy = null;

    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: report, error: reportError } = await db
      .from("signalements")
      .select("id,animal_type,color,city,island,disappearance_at,user_id")
      .eq("id", id)
      .maybeSingle();

    if (reportError) {
      console.error("Lecture du signalement :", reportError);
      return response({ error: "Impossible de vérifier le signalement." }, 500);
    }

    if (!report) {
      return response({ error: "Signalement introuvable." }, 404);
    }

    if (report.disappearance_at) {
      const disappearanceTime = new Date(report.disappearance_at).getTime();
      if (
        Number.isFinite(disappearanceTime) &&
        timestamp.getTime() < disappearanceTime
      ) {
        return response(
          { error: "La date de l'observation précède la disparition indiquée." },
          400
        );
      }
    }

    // Compatibilité indicative, sans analyse IA.
    // Le score n'est pas une probabilité d'identification.
    let score = 20;
    const reasons: string[] = [];

    if (
      animalType &&
      animalType.toLowerCase() === txt(report.animal_type).toLowerCase()
    ) {
      score += 20;
      reasons.push("Espèce compatible");
    }

    if (
      color &&
      txt(report.color).toLowerCase().includes(color.toLowerCase())
    ) {
      score += 20;
      reasons.push("Couleur compatible");
    }

    if (commune.toLowerCase() === txt(report.city).toLowerCase()) {
      score += 15;
      reasons.push("Même commune");
    }

    if (island.toLowerCase() === txt(report.island).toLowerCase()) {
      score += 10;
      reasons.push("Même île");
    }

    if (certainty === "certain") score += 10;
    if (certainty === "incertain") score -= 10;

    score = Math.max(0, Math.min(95, score));

    const explanation = reasons.length > 0
      ? reasons.join(" ; ")
      : "Éléments insuffisants pour une correspondance solide";

    const { data, error } = await db
      .from("signalement_observations")
      .insert({
        signalement_id: id,
        observed_at: timestamp.toISOString(),
        first_name: firstName,
        last_name: lastName,
        phone,
        island,
        commune,
        quartier: quartier || null,
        location_details: locationDetails || null,
        latitude,
        longitude,
        gps_accuracy: gpsAccuracy,
        animal_type: animalType || null,
        color: color || null,
        behavior: behavior || null,
        certainty,
        comments: comments || null,
        match_score: score,
        match_explanation: explanation,
        ai_status: "not_configured",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insertion observation :", error);
      return response(
        { error: "Impossible d'enregistrer l'observation pour le moment." },
        500
      );
    }

    return response(
      {
        ok: true,
        observation_id: data.id,
        media_token: issueObservationMediaReceipt(data.id),
        message: "Observation enregistrée. Elle reste à vérifier.",
      },
      201
    );
  } catch (error) {
    console.error("Enregistrement observation :", error);
    return response({ error: "Impossible d'enregistrer l'observation." }, 500);
  }
}
