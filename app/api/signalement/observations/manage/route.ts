
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function getClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey || !publicKey) {
    throw new Error("Configuration Supabase manquante");
  }

  return {
    admin: createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    auth: createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

async function authorize(request: NextRequest, signalementId: string) {
  const bearer = request.headers.get("authorization") || "";
  const token = bearer.startsWith("Bearer ")
    ? bearer.slice(7).trim()
    : "";

  if (!token) return null;

  const clients = getClients();

  const { data: authData, error: authError } =
    await clients.auth.auth.getUser(token);

  if (authError || !authData.user) return null;

  const user = authData.user;

  const { data: report, error: reportError } = await clients.admin
    .from("signalements")
    .select("id,user_id")
    .eq("id", signalementId)
    .maybeSingle();

  if (reportError || !report) return null;

  const { data: profile, error: profileError } = await clients.admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return null;

  const isAdmin =
    String(profile?.role || "").trim().toLowerCase() === "admin";

  const isOwner = report.user_id === user.id;

  if (!isAdmin && !isOwner) return null;

  return { db: clients.admin, userId: user.id };
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("signalement_id") || "";

    if (!UUID.test(id)) {
      return json({ error: "Signalement invalide." }, 400);
    }

    const access = await authorize(request, id);

    if (!access) {
      return json({ error: "Accès non autorisé." }, 403);
    }

    const { data, error } = await access.db
      .from("signalement_observations")
      .select(
        "id,signalement_id,created_at,observed_at,first_name,last_name,phone,island,commune,quartier,location_details,latitude,longitude,gps_accuracy,animal_type,color,behavior,certainty,comments,match_score,match_explanation,review_status,reviewed_at"
      )
      .eq("signalement_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Lecture des observations :", error);
      return json({ error: "Lecture impossible." }, 500);
    }

    return json({ ok: true, observations: data || [] });
  } catch (error) {
    console.error("GET observations manage :", error);
    return json({ error: "Erreur serveur." }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Données invalides." }, 400);
    }

    const signalementId = String(body.signalement_id || "");
    const observationId = String(body.observation_id || "");
    const status = String(body.review_status || "");

    if (
      !UUID.test(signalementId) ||
      !UUID.test(observationId) ||
      !["pending", "confirmed", "rejected"].includes(status)
    ) {
      return json({ error: "Paramètres invalides." }, 400);
    }

    const access = await authorize(request, signalementId);

    if (!access) {
      return json({ error: "Accès non autorisé." }, 403);
    }

    const { data, error } = await access.db
      .from("signalement_observations")
      .update({
        review_status: status,
        reviewed_at:
          status === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", observationId)
      .eq("signalement_id", signalementId)
      .select("id,review_status,reviewed_at")
      .maybeSingle();

    if (error) {
      console.error("Mise à jour observation :", error);
      return json({ error: "Modification impossible." }, 500);
    }

    if (!data) {
      return json({ error: "Observation introuvable." }, 404);
    }

    return json({ ok: true, observation: data });
  } catch (error) {
    console.error("PATCH observations manage :", error);
    return json({ error: "Erreur serveur." }, 500);
  }
}
