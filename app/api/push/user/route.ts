import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToUser } from "../../../lib/server/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  recipientId?: string;
  title?: string;
  body?: string;
  url?: string;
  type?: string;
  tag?: string;
  notificationId?: string;
  conversationId?: string;
  animalId?: string;
  signalementId?: string;
  adoptionRequestId?: string;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Configuration Supabase serveur manquante.");
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Session invalide ou expirÃ©e." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as RequestBody;

    const recipientId = String(payload.recipientId || "").trim();
    const title = String(payload.title || "").trim();
    const message = String(payload.body || "").trim();

    if (!recipientId || !title || !message) {
      return NextResponse.json(
        { error: "recipientId, title et body sont obligatoires." },
        { status: 400 }
      );
    }

    if (recipientId !== user.id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const role = String(profile?.role || "")
        .trim()
        .toLowerCase();

      if (role !== "admin") {
        return NextResponse.json(
          {
            error:
              "Vous n'Ãªtes pas autorisÃ© Ã  envoyer un PUSH Ã  ce profil.",
          },
          { status: 403 }
        );
      }
    }

    const result = await sendPushToUser(recipientId, {
      title,
      body: message,
      url: payload.url,
      type: payload.type,
      tag: payload.tag,
      notificationId: payload.notificationId,
      conversationId: payload.conversationId,
      animalId: payload.animalId,
      signalementId: payload.signalementId,
      adoptionRequestId: payload.adoptionRequestId,
    });

    return NextResponse.json({
      ok: true,
      recipientId,
      ...result,
    });
  } catch (error) {
    console.error("POST /api/push/user :", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer le PUSH personnel.",
      },
      { status: 500 }
    );
  }
}
