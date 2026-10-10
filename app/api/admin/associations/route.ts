
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type MemberRole = "responsable" | "gestionnaire" | "benevole";
type MemberStatus = "pending" | "approved" | "rejected" | "revoked";

type MemberAction = "attach" | "approve" | "reject" | "revoke";

const VALID_ROLES: MemberRole[] = [
  "responsable",
  "gestionnaire",
  "benevole",
];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAdminContext(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    throw new Error("Configuration Supabase serveur incomplète.");
  }

  const authorization = request.headers.get("authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();

  if (!token) return null;

  const authClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } =
    await authClient.auth.getUser(token);

  if (authError || !authData.user) return null;

  const adminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, role, is_active, approval_status")
      .eq("id", authData.user.id)
      .maybeSingle();

  if (profileError) throw profileError;

  if (
    profile?.role !== "admin" ||
    profile.is_active !== true ||
    profile.approval_status !== "approved"
  ) {
    return null;
  }

  return {
    adminId: authData.user.id,
    db: adminClient,
  };
}

async function associationExists(
  db: SupabaseClient,
  associationId: string
) {
  const { data, error } = await db
    .from("animal_associations")
    .select("id")
    .eq("id", associationId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

async function profileExists(
  db: SupabaseClient,
  profileId: string
) {
  const { data, error } = await db
    .from("profiles")
    .select("id, role, is_active, approval_status")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);

    if (!context) {
      return jsonError("Accès administrateur refusé.", 403);
    }

    const [associationsResult, profilesResult, membersResult] =
      await Promise.all([
        context.db
          .from("animal_associations")
          .select("id, name, island, city, is_active")
          .order("name"),

        context.db
          .from("profiles")
          .select(
            "id, first_name, last_name, organization_name, role, approval_status, is_active"
          )
          .order("last_name"),

        context.db
          .from("association_members")
          .select(
            "id, association_id, profile_id, member_role, status, approved_by, approved_at, created_at"
          )
          .order("created_at", { ascending: false }),
      ]);

    if (associationsResult.error) throw associationsResult.error;
    if (profilesResult.error) throw profilesResult.error;
    if (membersResult.error) throw membersResult.error;

    return NextResponse.json({
      associations: associationsResult.data || [],
      profiles: profilesResult.data || [],
      members: membersResult.data || [],
    });
  } catch (error) {
    console.error("Erreur GET associations admin :", error);

    return jsonError(
      error instanceof Error ? error.message : "Erreur serveur.",
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);

    if (!context) {
      return jsonError("Accès administrateur refusé.", 403);
    }

    const body = await request.json();

    const action = String(body.action || "") as MemberAction;
    const associationId = String(body.association_id || "").trim();
    const profileId = String(body.profile_id || "").trim();
    const memberRole = String(body.member_role || "") as MemberRole;

    if (action !== "attach") {
      return jsonError("Action non autorisée.", 400);
    }

    if (!associationId || !profileId) {
      return jsonError("Association et membre obligatoires.", 400);
    }

    if (!VALID_ROLES.includes(memberRole)) {
      return jsonError("Rôle de membre invalide.", 400);
    }

    if (!(await associationExists(context.db, associationId))) {
      return jsonError("Association officielle introuvable.", 404);
    }

    const profile = await profileExists(context.db, profileId);

    if (!profile) {
      return jsonError("Compte utilisateur introuvable.", 404);
    }

    if (profile.role === "admin") {
      return jsonError(
        "Un administrateur ne peut pas être rattaché par cette interface.",
        400
      );
    }

    const { data: existing, error: existingError } =
      await context.db
        .from("association_members")
        .select("id, status")
        .eq("association_id", associationId)
        .eq("profile_id", profileId)
        .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      if (existing.status === "approved") {
        return jsonError("Ce membre est déjà rattaché.", 409);
      }

      const { error } = await context.db
        .from("association_members")
        .update({
          member_role: memberRole,
          status: "pending" satisfies MemberStatus,
          approved_by: null,
          approved_at: null,
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await context.db
        .from("association_members")
        .insert({
          association_id: associationId,
          profile_id: profileId,
          member_role: memberRole,
          status: "pending" satisfies MemberStatus,
        });

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Rattachement créé en attente de validation.",
    });
  } catch (error) {
    console.error("Erreur POST associations admin :", error);

    return jsonError(
      error instanceof Error ? error.message : "Erreur serveur.",
      500
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getAdminContext(request);

    if (!context) {
      return jsonError("Accès administrateur refusé.", 403);
    }

    const body = await request.json();

    const memberId = String(body.member_id || "").trim();
    const action = String(body.action || "") as MemberAction;

    if (!memberId) {
      return jsonError("Rattachement obligatoire.", 400);
    }

    if (!["approve", "reject", "revoke"].includes(action)) {
      return jsonError("Action non autorisée.", 400);
    }

    const { data: member, error: memberError } =
      await context.db
        .from("association_members")
        .select("id, association_id, profile_id, status")
        .eq("id", memberId)
        .maybeSingle();

    if (memberError) throw memberError;

    if (!member) {
      return jsonError("Rattachement introuvable.", 404);
    }

    if (action === "approve") {
      if (member.status !== "pending") {
        return jsonError(
          "Seul un rattachement en attente peut être approuvé.",
          409
        );
      }

      if (!(await associationExists(context.db, member.association_id))) {
        return jsonError("Association inactive ou introuvable.", 400);
      }

      const profile = await profileExists(
        context.db,
        member.profile_id
      );

      if (!profile || profile.is_active !== true) {
        return jsonError("Compte membre inactif ou introuvable.", 400);
      }

      if (profile.approval_status !== "approved") {
        return jsonError(
          "Le compte doit être validé avant son rattachement officiel.",
          400
        );
      }
    }

    if (
      action === "reject" &&
      member.status !== "pending"
    ) {
      return jsonError(
        "Seul un rattachement en attente peut être refusé.",
        409
      );
    }

    if (
      action === "revoke" &&
      member.status !== "approved"
    ) {
      return jsonError(
        "Seul un rattachement approuvé peut être révoqué.",
        409
      );
    }

    const status: MemberStatus =
      action === "approve"
        ? "approved"
        : action === "reject"
          ? "rejected"
          : "revoked";

    const { error } = await context.db
      .from("association_members")
      .update({
        status,
        approved_by:
          action === "approve" ? context.adminId : null,
        approved_at:
          action === "approve" ? new Date().toISOString() : null,
      })
      .eq("id", memberId)
      .eq("status", member.status);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("Erreur PATCH associations admin :", error);

    return jsonError(
      error instanceof Error ? error.message : "Erreur serveur.",
      500
    );
  }
}
