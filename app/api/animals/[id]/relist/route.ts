import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(request: Request) {
  const authorization =
    request.headers.get("authorization") || "";

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

function clean(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Configuration Supabase serveur manquante.",
        },
        { status: 500 }
      );
    }

    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Connexion requise.",
        },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const animalId =
      String(id || "").trim();

    if (!animalId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Animal invalide.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Session invalide.",
        },
        { status: 401 }
      );
    }

    const userId =
      authData.user.id;

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, role, is_active, approval_status"
      )
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        {
          ok: false,
          error: profileError.message,
        },
        { status: 500 }
      );
    }

    if (
      !profile ||
      profile.is_active === false ||
      ["rejected", "suspended"].includes(
        clean(profile.approval_status)
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Votre compte ne permet pas cette action.",
        },
        { status: 403 }
      );
    }

    const isAdmin =
      clean(profile.role) === "admin";

    const {
      data: animal,
      error: animalError,
    } = await supabaseAdmin
      .from("animals")
      .select(
        "id, owner_id, animal_name, is_adopted, is_published, status, adopted_at"
      )
      .eq("id", animalId)
      .maybeSingle();

    if (animalError) {
      return NextResponse.json(
        {
          ok: false,
          error: animalError.message,
        },
        { status: 500 }
      );
    }

    if (!animal) {
      return NextResponse.json(
        {
          ok: false,
          error: "Animal introuvable.",
        },
        { status: 404 }
      );
    }

    const isOwner =
      animal.owner_id === userId;

    if (
      !isOwner &&
      !isAdmin
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Seul le createur de la fiche ou un administrateur peut remettre cet animal a l'adoption.",
        },
        { status: 403 }
      );
    }

    const {
      data: updatedAnimal,
      error: updateError,
    } = await supabaseAdmin
      .from("animals")
      .update({
        is_adopted: false,
        is_published: true,
        status: "available",
        adopted_at: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", animalId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      animal: updatedAnimal,
    });
  } catch (error: unknown) {
    console.error(
      "Erreur remise a l'adoption :",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue.",
      },
      { status: 500 }
    );
  }
}
