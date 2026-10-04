import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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

export async function POST(
  request: NextRequest,
  {
    params,
  }: RouteContext
) {
  try {
    const {
      id: animalId,
    } =
      await params;

    if (!animalId) {
      return NextResponse.json(
        {
          error:
            "Identifiant animal manquant.",
        },
        {
          status: 400,
        }
      );
    }

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

    const supabase =
      getServerSupabase();

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.getUser(token);

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

    const userId =
      authData.user.id;

    const {
      data: animal,
      error: animalError,
    } =
      await supabase
        .from("animals")
        .select(
          `
            id,
            owner_id,
            animal_name,
            is_adopted,
            status
          `
        )
        .eq("id", animalId)
        .maybeSingle();

    if (animalError) {
      console.error(
        "Erreur récupération animal :",
        animalError
      );

      return NextResponse.json(
        {
          error:
            "Impossible de récupérer cet animal.",
        },
        {
          status: 500,
        }
      );
    }

    if (!animal) {
      return NextResponse.json(
        {
          error:
            "Animal introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Erreur récupération profil utilisateur :",
        profileError
      );
    }

    const role =
      String(
        profile?.role || ""
      )
        .trim()
        .toLowerCase();

    const isAdmin =
      role === "admin";

    const isOwner =
      animal.owner_id ===
      userId;

    if (
      !isAdmin &&
      !isOwner
    ) {
      return NextResponse.json(
        {
          error:
            "Seul l'administrateur ou le propriétaire de cet animal peut confirmer son adoption.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      animal.is_adopted ||
      animal.status === "adopted"
    ) {
      return NextResponse.json(
        {
          ok: true,
          alreadyAdopted: true,
        },
        {
          status: 200,
        }
      );
    }

    const now =
      new Date().toISOString();

    const {
      data: updatedAnimal,
      error: updateError,
    } =
      await supabase
        .from("animals")
        .update({
          status: "adopted",
          is_adopted: true,
          is_published: false,
          adopted_at: now,
          updated_at: now,
        })
        .eq("id", animalId)
        .select(
          `
            id,
            animal_name,
            owner_id,
            status,
            is_adopted,
            is_published,
            adopted_at
          `
        )
        .single();

    if (updateError) {
      console.error(
        "Erreur validation adoption :",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Impossible de confirmer l'adoption de cet animal.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        animal:
          updatedAnimal,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Erreur API adoption animal :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erreur serveur lors de la confirmation de l'adoption.",
      },
      {
        status: 500,
      }
    );
  }
}
