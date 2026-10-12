import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type SignalementRow = {
  id: string;
  user_id: string | null;
  type_signalement: string | null;
  animal_type: string | null;
  animal_name: string | null;
  sex: string | null;
  age_label: string | null;
  color: string | null;
  breed: string | null;
  collar_color: string | null;
  distinctive_features: string | null;
  island: string | null;
  city: string | null;
  disappearance_at: string | null;
  found_at: string | null;
  situation: string | null;
  description: string | null;
  status: string | null;
  facebook_shared_at: string | null;
  facebook_post_id: string | null;
  facebook_share_status: string | null;
};

type SignalementMedia = {
  file_url: string | null;
  file_type: string | null;
};

type FacebookResult = {
  id?: string;
  post_id?: string;
  error?: { message?: string; code?: number; error_subcode?: number };
};

function clean(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configuration Supabase serveur manquante.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getFacebookConfig() {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !pageAccessToken) {
    throw new Error("Configuration Facebook serveur manquante.");
  }
  return {
    pageId,
    pageAccessToken,
    graphVersion: process.env.FACEBOOK_GRAPH_VERSION || "v26.0",
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.taui-te-ora.com").replace(/\/+$/, ""),
  };
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Pacific/Tahiti",
  }).format(date);
}

function short(value: string | null | undefined, max = 350): string {
  const text = clean(value).replace(/\s+/g, " ");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildMessage(signalement: SignalementRow, publicUrl: string): string {
  const type = clean(signalement.type_signalement) || "Signalement animal";
  const normalizedType = type.toLocaleLowerCase("fr-FR");
  const lost = normalizedType.includes("perdu") || normalizedType.includes("disparu");
  const found = normalizedType.includes("trouv");
  const name = clean(signalement.animal_name);
  const place = [clean(signalement.city), clean(signalement.island)].filter(Boolean).join(" · ");
  const lines: string[] = [];

  if (lost) {
    lines.push("🚨 ALERTE DISPARITION — TAUI TE ORA 🚨");
    lines.push("");
    lines.push(name ? `🐾 ${name.toLocaleUpperCase("fr-FR")} A DISPARU !` : "🐾 UN ANIMAL A DISPARU !");
  } else if (found) {
    lines.push("🐾 ALERTE ANIMAL TROUVÉ — TAUI TE ORA");
    if (name) lines.push(`Nom indiqué : ${name}`);
  } else {
    lines.push(`🚨 ${type.toLocaleUpperCase("fr-FR")} — TAUI TE ORA`);
    if (name) lines.push(`🐾 ${name}`);
  }

  lines.push("");
  if (place) lines.push(`📍 Secteur : ${place}`);
  const date = formatDate(lost ? signalement.disappearance_at : found ? signalement.found_at : null);
  if (date) lines.push(`📅 ${lost ? "Disparu le" : "Trouvé le"} : ${date}`);

  const animal = [clean(signalement.animal_type), clean(signalement.breed), clean(signalement.sex), clean(signalement.age_label)]
    .filter(Boolean).join(" · ");
  if (animal) lines.push(`🐾 Description : ${animal}`);
  if (clean(signalement.color)) lines.push(`🎨 Couleur : ${short(signalement.color, 120)}`);
  if (clean(signalement.collar_color)) lines.push(`🦮 Collier : ${short(signalement.collar_color, 120)}`);
  if (clean(signalement.distinctive_features)) {
    lines.push(`🔎 Signes particuliers : ${short(signalement.distinctive_features, 250)}`);
  }
  if (clean(signalement.situation)) lines.push(`ℹ️ Situation : ${short(signalement.situation, 350)}`);
  else if (clean(signalement.description)) lines.push(`ℹ️ Informations : ${short(signalement.description, 350)}`);

  lines.push("");
  if (lost) {
    lines.push("👀 VOUS L'AVEZ VU ?");
    lines.push("Notez le lieu et l'heure de l'observation. Si l'animal est craintif, évitez de le poursuivre.");
  } else if (found) {
    lines.push("🔎 VOUS RECONNAISSEZ CET ANIMAL ?");
  } else {
    lines.push("🔎 VOUS AVEZ DES INFORMATIONS ?");
  }
  lines.push("Consultez sa fiche TAUI TE ORA pour aider et retrouver les informations publiques disponibles.");
  lines.push("");
  lines.push("❤️ PARTAGEZ CETTE ALERTE pour informer la communauté !");
  lines.push(`🔗 ${publicUrl}`);
  lines.push("");
  lines.push("TAUI TE ORA — by Les Veilleurs de Kali");
  lines.push(lost
    ? "#TauiTeOra #LesVeilleursDeKali #AnimalPerdu #AlerteDisparition #PolynesieFrancaise"
    : found
      ? "#TauiTeOra #LesVeilleursDeKali #AnimalTrouve #PolynesieFrancaise"
      : "#TauiTeOra #LesVeilleursDeKali #SignalementAnimal #PolynesieFrancaise");
  return lines.join("\n");
}

async function graphPost(endpoint: string, fields: Record<string, string>): Promise<FacebookResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
    cache: "no-store",
  });
  const result = (await response.json().catch(() => ({}))) as FacebookResult;
  if (!response.ok || result.error) {
    throw new Error(result.error?.message || `Erreur Facebook (${response.status}).`);
  }
  return result;
}

export async function POST(request: NextRequest) {
  let signalementId = "";
  let claimed = false;
  let supabase: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabase = getSupabaseAdmin();
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Authentification requise." }, { status: 401 });
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json({ ok: false, error: "Session utilisateur invalide." }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    const rawId = body && typeof body === "object" && "signalementId" in body
      ? (body as { signalementId?: unknown }).signalementId : null;
    signalementId = typeof rawId === "string" ? rawId.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(signalementId)) {
      return NextResponse.json({ ok: false, error: "Identifiant du signalement invalide." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (profileError) throw profileError;
    const role = clean(profile?.role).toLocaleLowerCase("fr-FR");
    const isAdmin = role === "admin" || role === "administrateur";

    const { data: signalement, error: signalementError } = await supabase
      .from("signalements")
      .select("id,user_id,type_signalement,animal_type,animal_name,sex,age_label,color,breed,collar_color,distinctive_features,island,city,disappearance_at,found_at,situation,description,status,facebook_shared_at,facebook_post_id,facebook_share_status")
      .eq("id", signalementId).maybeSingle();
    if (signalementError) throw signalementError;
    if (!signalement) {
      return NextResponse.json({ ok: false, error: "Signalement introuvable." }, { status: 404 });
    }
    const row = signalement as SignalementRow;
    if (!isAdmin && row.user_id !== userData.user.id) {
      return NextResponse.json({ ok: false, error: "Publication réservée au déclarant ou à l'administration." }, { status: 403 });
    }
    if (row.facebook_shared_at || row.facebook_share_status === "published") {
      return NextResponse.json({ ok: true, published: false, alreadyPublished: true, facebook_post_id: row.facebook_post_id });
    }

    const { data: claim, error: claimError } = await supabase
      .from("signalements")
      .update({ facebook_share_status: "processing", facebook_share_error: null })
      .eq("id", signalementId)
      .is("facebook_shared_at", null)
      .or("facebook_share_status.is.null,facebook_share_status.eq.error")
      .select("id").maybeSingle();
    if (claimError) throw claimError;
    if (!claim) {
      return NextResponse.json({ ok: true, published: false, skipped: true, reason: "Publication déjà en cours ou effectuée." });
    }
    claimed = true;

    const { data: medias, error: mediaError } = await supabase
      .from("signalement_medias").select("file_url,file_type").eq("signalement_id", signalementId);
    if (mediaError) console.error("Médias signalement Facebook :", mediaError);
    const mediaRows = (medias || []) as SignalementMedia[];
    const hasPhoto = mediaRows.some((media) => Boolean(
      media.file_url && /^https?:\/\//i.test(media.file_url) &&
      (!media.file_type || media.file_type.startsWith("image/"))
    ));

    const config = getFacebookConfig();
    const publicUrl = `${config.siteUrl}/signalement/public/${encodeURIComponent(signalementId)}`;
    const imageUrl = `${config.siteUrl}/api/share-image/signalement/${encodeURIComponent(signalementId)}`;
    const message = buildMessage(row, publicUrl);
    const endpoint = `https://graph.facebook.com/${config.graphVersion}/${config.pageId}/${hasPhoto ? "photos" : "feed"}`;
    const result = await graphPost(endpoint, hasPhoto
      ? { url: imageUrl, caption: message, published: "true", access_token: config.pageAccessToken }
      : { message, link: publicUrl, access_token: config.pageAccessToken });

    const postId = String(result.post_id || result.id || "");
    const { error: saveError } = await supabase.from("signalements").update({
      facebook_shared_at: new Date().toISOString(),
      facebook_post_id: postId || null,
      facebook_share_status: "published",
      facebook_share_error: null,
    }).eq("id", signalementId);
    if (saveError) throw saveError;
    return NextResponse.json({ ok: true, published: true, signalement_id: signalementId, facebook_post_id: postId || null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue Facebook.";
    console.error("Publication Facebook signalement impossible :", error);
    if (claimed && signalementId) {
      try {
        const admin = getSupabaseAdmin();
        await admin.from("signalements").update({
          facebook_share_status: "error", facebook_share_error: message.slice(0, 1000),
        }).eq("id", signalementId).is("facebook_shared_at", null);
      } catch (saveError) {
        console.error("Impossible d'enregistrer l'erreur Facebook :", saveError);
      }
    }
    return NextResponse.json({ ok: false, signalement_id: signalementId || null, error: message }, { status: 500 });
  }
}
