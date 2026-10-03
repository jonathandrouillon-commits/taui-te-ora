import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_FILES_PER_SIGNALEMENT = 5;
const ANONYMOUS_UPLOAD_WINDOW_MS = 30 * 60 * 1000;

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const SAFE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function safeHashEquals(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(left.toLowerCase(), "hex"),
    Buffer.from(right.toLowerCase(), "hex")
  );
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error("Signalement upload: configuration Supabase manquante.");
    return jsonError("Configuration serveur incomplète.", 500);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("Requête d'upload invalide.", 400);
  }

  const signalementId = String(formData.get("signalementId") || "").trim();
  const uploadToken = String(formData.get("uploadToken") || "").trim();
  const fileValue = formData.get("file");

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(signalementId)) {
    return jsonError("Identifiant de signalement invalide.", 400);
  }

  if (!(fileValue instanceof File)) {
    return jsonError("Aucun fichier reçu.", 400);
  }

  if (!ALLOWED_FILE_TYPES.has(fileValue.type)) {
    return jsonError("Format non autorisé. Utilisez JPG, PNG ou WEBP.", 415);
  }

  if (fileValue.size <= 0 || fileValue.size > MAX_FILE_SIZE) {
    return jsonError("Le fichier doit faire au maximum 8 Mo.", 413);
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: signalement, error: signalementError } = await adminSupabase
    .from("signalements")
    .select("id,user_id,upload_token_hash,created_at")
    .eq("id", signalementId)
    .maybeSingle();

  if (signalementError) {
    console.error("Signalement upload lookup:", signalementError);
    return jsonError("Impossible de vérifier le signalement.", 500);
  }

  if (!signalement) {
    return jsonError("Signalement introuvable.", 404);
  }

  let authenticatedUserId: string | null = null;
  const authorization = request.headers.get("authorization") || "";

  if (authorization.startsWith("Bearer ")) {
    const accessToken = authorization.slice(7).trim();

    if (accessToken) {
      const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data: authData } = await authSupabase.auth.getUser(accessToken);
      authenticatedUserId = authData.user?.id || null;
    }
  }

  const isAuthenticatedOwner =
    Boolean(authenticatedUserId) &&
    signalement.user_id === authenticatedUserId;

  let hasAnonymousUploadProof = false;

  if (!signalement.user_id) {
    const createdAt = new Date(signalement.created_at).getTime();
    const isFresh =
      Number.isFinite(createdAt) &&
      Date.now() - createdAt >= 0 &&
      Date.now() - createdAt <= ANONYMOUS_UPLOAD_WINDOW_MS;

    if (
      isFresh &&
      uploadToken &&
      typeof signalement.upload_token_hash === "string"
    ) {
      hasAnonymousUploadProof = safeHashEquals(
        sha256(uploadToken),
        signalement.upload_token_hash
      );
    }
  }

  if (!isAuthenticatedOwner && !hasAnonymousUploadProof) {
    return jsonError("Vous n'êtes pas autorisé à ajouter une photo à ce signalement.", 403);
  }

  const { count, error: countError } = await adminSupabase
    .from("signalement_medias")
    .select("id", { count: "exact", head: true })
    .eq("signalement_id", signalementId);

  if (countError) {
    console.error("Signalement upload media count:", countError);
    return jsonError("Impossible de vérifier les médias existants.", 500);
  }

  if ((count || 0) >= MAX_FILES_PER_SIGNALEMENT) {
    return jsonError("Ce signalement possède déjà le nombre maximal de photos.", 409);
  }

  const extension = SAFE_EXTENSIONS[fileValue.type];
  const filePath = `${signalementId}/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await fileValue.arrayBuffer());

  const { error: uploadError } = await adminSupabase.storage
    .from("signalements")
    .upload(filePath, bytes, {
      cacheControl: "3600",
      contentType: fileValue.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Signalement upload storage:", uploadError);
    return jsonError("Impossible d'enregistrer la photo.", 500);
  }

  const { data: publicUrlData } = adminSupabase.storage
    .from("signalements")
    .getPublicUrl(filePath);

  const { error: mediaError } = await adminSupabase
    .from("signalement_medias")
    .insert({
      signalement_id: signalementId,
      file_url: publicUrlData.publicUrl,
      file_type: fileValue.type,
      file_name: fileValue.name.slice(0, 255),
    });

  if (mediaError) {
    console.error("Signalement upload media insert:", mediaError);
    await adminSupabase.storage.from("signalements").remove([filePath]);
    return jsonError("Impossible d'enregistrer le média du signalement.", 500);
  }

  return NextResponse.json({
    ok: true,
    fileUrl: publicUrlData.publicUrl,
  });
}
