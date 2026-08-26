import { NextResponse } from "next/server";

type SupabaseUser = {
  id?: string;
};

type Profile = {
  id: string;
  role: string | null;
  is_active: boolean | null;
};

const DELETABLE_ROLES =
  new Set([
    "adoptant",
    "association",
  ]);

function getBearerToken(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return null;
  }

  return authorization
    .slice(7)
    .trim();
}

async function readJsonSafely(
  response: Response
) {
  return response
    .json()
    .catch(() => null);
}

export async function DELETE(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      console.error(
        "Configuration Supabase administrateur manquante."
      );

      return NextResponse.json(
        {
          error:
            "Configuration serveur incomplète."
        },
        { status: 500 }
      );
    }

    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Authentification requise."
        },
        { status: 401 }
      );
    }

    const authResponse =
      await fetch(
        `${supabaseUrl}/auth/v1/user`,
        {
          headers: {
            apikey:
              supabaseAnonKey,
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

    if (!authResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Session administrateur invalide."
        },
        { status: 401 }
      );
    }

    const authenticatedUser =
      (await readJsonSafely(
        authResponse
      )) as SupabaseUser | null;

    if (!authenticatedUser?.id) {
      return NextResponse.json(
        {
          error:
            "Utilisateur administrateur introuvable."
        },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Requête invalide."
        },
        { status: 400 }
      );
    }

    const targetUserId =
      typeof body === "object" &&
      body !== null &&
      !Array.isArray(body) &&
      typeof (
        body as Record<
          string,
          unknown
        >
      ).userId === "string"
        ? String(
            (
              body as Record<
                string,
                unknown
              >
            ).userId
          ).trim()
        : "";

    if (!targetUserId) {
      return NextResponse.json(
        {
          error:
            "Identifiant du compte manquant."
        },
        { status: 400 }
      );
    }

    if (
      targetUserId ===
      authenticatedUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "Vous ne pouvez pas supprimer votre propre compte administrateur."
        },
        { status: 403 }
      );
    }

    const adminHeaders = {
      apikey: serviceRoleKey,
      Authorization:
        `Bearer ${serviceRoleKey}`,
      "Content-Type":
        "application/json",
    };

    const profilesResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=in.(${authenticatedUser.id},${targetUserId})&select=id,role,is_active`,
        {
          headers: adminHeaders,
          cache: "no-store",
        }
      );

    if (!profilesResponse.ok) {
      console.error(
        "Lecture des profils impossible :",
        await profilesResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Impossible de vérifier les comptes."
        },
        { status: 500 }
      );
    }

    const profiles =
      (await profilesResponse.json()) as Profile[];

    const adminProfile =
      profiles.find(
        (profile) =>
          profile.id ===
          authenticatedUser.id
      );

    const targetProfile =
      profiles.find(
        (profile) =>
          profile.id ===
          targetUserId
      );

    if (
      String(
        adminProfile?.role || ""
      )
        .trim()
        .toLowerCase() !== "admin" ||
      adminProfile?.is_active === false
    ) {
      return NextResponse.json(
        {
          error:
            "Action réservée à un administrateur actif."
        },
        { status: 403 }
      );
    }

    if (!targetProfile) {
      return NextResponse.json(
        {
          error:
            "Compte à supprimer introuvable."
        },
        { status: 404 }
      );
    }

    const targetRole =
      String(
        targetProfile.role || ""
      )
        .trim()
        .toLowerCase();

    if (
      !DELETABLE_ROLES.has(
        targetRole
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seuls les comptes adoptants et associations peuvent être supprimés."
        },
        { status: 403 }
      );
    }

    const transferResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/animals?association_id=eq.${targetUserId}`,
        {
          method: "PATCH",
          headers: {
            ...adminHeaders,
            Prefer:
              "return=minimal",
          },
          body: JSON.stringify({
            association_id:
              authenticatedUser.id,
          }),
        }
      );

    if (!transferResponse.ok) {
      console.error(
        "Transfert des animaux impossible :",
        await transferResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Impossible de transférer les animaux vers le compte administrateur. Le compte n'a pas été supprimé."
        },
        { status: 500 }
      );
    }

    const deleteAuthResponse =
      await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${targetUserId}`,
        {
          method: "DELETE",
          headers: adminHeaders,
        }
      );

    if (!deleteAuthResponse.ok) {
      console.error(
        "Suppression Auth impossible :",
        await deleteAuthResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Les animaux ont été transférés, mais le compte n'a pas pu être supprimé."
        },
        { status: 500 }
      );
    }

    const deleteProfileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${targetUserId}`,
        {
          method: "DELETE",
          headers: {
            ...adminHeaders,
            Prefer:
              "return=minimal",
          },
        }
      );

    if (!deleteProfileResponse.ok) {
      console.error(
        "Nettoyage du profil impossible :",
        await deleteProfileResponse.text()
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Compte supprimé définitivement. Les éventuels animaux ont été transférés à votre compte administrateur."
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erreur suppression utilisateur :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erreur serveur pendant la suppression."
      },
      { status: 500 }
    );
  }
}
