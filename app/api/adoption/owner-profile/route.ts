import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

type OwnerProfileRow = {
  id: string;
  role: string | null;
  organization_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

function getServerSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    url,
    serviceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get("authorization") || "";

    const token =
      authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Session utilisateur manquante.",
        },
        {
          status: 401,
        }
      );
    }

    const ownerId =
      request.nextUrl.searchParams
        .get("ownerId")
        ?.trim() || "";

    if (!ownerId) {
      return NextResponse.json(
        {
          error:
            "Identifiant du propriétaire manquant.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getServerSupabase();

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Session utilisateur invalide.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("profiles")
        .select(
          `
            id,
            role,
            organization_name,
            first_name,
            last_name
          `
        )
        .eq("id", ownerId)
        .maybeSingle<OwnerProfileRow>();

    if (error) {
      console.error(
        "Erreur récupération profil structure :",
        error
      );

      return NextResponse.json(
        {
          error:
            "Impossible de récupérer le profil de la structure.",
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Le profil de la structure est introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        owner: {
          id: data.id,
          role: data.role,
          organization_name:
            data.organization_name,
          first_name:
            data.first_name,
          last_name:
            data.last_name,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Erreur API profil structure :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erreur serveur lors de la récupération du profil de la structure.",
      },
      {
        status: 500,
      }
    );
  }
}
