import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type NotifyBody = { adoptionRequestId?: string; conversationId?: string };

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("Configuration Supabase serveur manquante.");
  return createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    const body = (await request.json()) as NotifyBody;
    if (!body.adoptionRequestId || !body.conversationId) return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
    const adminClient = getAdminClient();
    const { data: auth, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });

    const { data: adoption, error: adoptionError } = await adminClient
      .from("adoption_requests")
      .select("id, requester_id, owner_id, animal_id, animals(animal_name)")
      .eq("id", body.adoptionRequestId)
      .single();
    if (adoptionError || !adoption) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    if (adoption.requester_id !== auth.user.id) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });

    const animalRelation = adoption.animals as unknown as { animal_name?: string } | { animal_name?: string }[] | null;
    const animalName = Array.isArray(animalRelation) ? animalRelation[0]?.animal_name : animalRelation?.animal_name;
    const rows = [{ recipient_id: adoption.owner_id, animal_id: adoption.animal_id, adoption_request_id: adoption.id, conversation_id: body.conversationId, type: "adoption_request", title: "Nouvelle demande d'adoption", message: `Une nouvelle demande d'adoption a été envoyée pour ${animalName || "cet animal"}.`, is_read: false }];

    const { data: adminProfile } = await adminClient.from("profiles").select("id").in("role", ["admin", "administrateur"]).limit(1).maybeSingle();
    if (adminProfile?.id && adminProfile.id !== adoption.owner_id) rows.push({ recipient_id: adminProfile.id, animal_id: adoption.animal_id, adoption_request_id: adoption.id, conversation_id: body.conversationId, type: "adoption_request_admin", title: "Nouvelle demande d'adoption", message: `Nouvelle demande d'adoption pour ${animalName || "cet animal"}.`, is_read: false });

    const { error } = await adminClient.from("notifications").insert(rows);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/adoption/notify :", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de créer les notifications." }, { status: 500 });
  }
}
