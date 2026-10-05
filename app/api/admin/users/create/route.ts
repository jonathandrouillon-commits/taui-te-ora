import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const ALLOWED_ROLES =
  new Set([
    "adoptant",
    "association",
    "refuge",
    "sigfa",
    "fourriere",
    "benevole",
    "famille_accueil",
    "admin",
  ]);

type CreateUserBody = {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  role?: string;
  phone?: string;
  island?: string;
  city?: string;
};

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function getBearerToken(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  if (
    !authorization
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

export async function POST(
  request: Request
) {
  let createdUserId =
    "";

  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

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
        {
          status:
            500,
        }
      );
    }

    const token =
      getBearerToken(
        request
      );

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Connexion requise.",
        },
        {
          status:
            401,
        }
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        }
      );

    const {
      data:
        authData,
      error:
        authError,
    } =
      await supabaseAdmin
        .auth
        .getUser(
          token
        );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Session invalide.",
        },
        {
          status:
            401,
        }
      );
    }

    const {
      data:
        adminProfile,
      error:
        adminError,
    } =
      await supabaseAdmin
        .from(
          "profiles"
        )
        .select(
          "id, role, is_active"
        )
        .eq(
          "id",
          authData.user.id
        )
        .maybeSingle();

    if (
      adminError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            adminError.message,
        },
        {
          status:
            500,
        }
      );
    }

    const adminRole =
      clean(
        adminProfile?.role
      ).toLowerCase();

    if (
      adminRole !==
      "admin" ||
      adminProfile
        ?.is_active ===
        false
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Accès administrateur requis.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      (
        await request
          .json()
          .catch(
            () =>
              null
          )
      ) as
        | CreateUserBody
        | null;

    if (!body) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Requête invalide.",
        },
        {
          status:
            400,
        }
      );
    }

    const email =
      clean(
        body.email
      ).toLowerCase();

    const password =
      clean(
        body.password
      );

    const role =
      clean(
        body.role
      ).toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "L'e-mail est obligatoire.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      password.length <
      8
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Le mot de passe temporaire doit contenir au moins 8 caractères.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !ALLOWED_ROLES.has(
        role
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Type de profil invalide.",
        },
        {
          status:
            400,
        }
      );
    }

    const firstName =
      clean(
        body.first_name
      );

    const lastName =
      clean(
        body.last_name
      );

    const organizationName =
      clean(
        body.organization_name
      );

    const phone =
      clean(
        body.phone
      );

    const island =
      clean(
        body.island
      );

    const city =
      clean(
        body.city
      );

    const {
      data:
        createdAuth,
      error:
        createAuthError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .createUser({
          email,
          password,
          email_confirm:
            true,
          user_metadata: {
            first_name:
              firstName ||
              null,
            last_name:
              lastName ||
              null,
            organization_name:
              organizationName ||
              null,
            role,
            phone:
              phone ||
              null,
            island:
              island ||
              null,
            city:
              city ||
              null,
          },
        });

    if (
      createAuthError ||
      !createdAuth.user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            createAuthError
              ?.message ||
            "Impossible de créer le compte Auth.",
        },
        {
          status:
            400,
        }
      );
    }

    createdUserId =
      createdAuth.user.id;

    const now =
      new Date()
        .toISOString();

    const {
      error:
        profileError,
    } =
      await supabaseAdmin
        .from(
          "profiles"
        )
        .upsert(
          {
            id:
              createdUserId,
            email,
            first_name:
              firstName ||
              null,
            last_name:
              lastName ||
              null,
            organization_name:
              organizationName ||
              null,
            role,
            phone:
              phone ||
              null,
            island:
              island ||
              null,
            city:
              city ||
              null,
            approval_status:
              "approved",
            is_verified:
              true,
            is_active:
              true,
            approved_at:
              now,
            approved_by:
              authData.user.id,
          },
          {
            onConflict:
              "id",
          }
        );

    if (
      profileError
    ) {
      await supabaseAdmin
        .auth
        .admin
        .deleteUser(
          createdUserId
        )
        .catch(
          () => undefined
        );

      createdUserId =
        "";

      return NextResponse.json(
        {
          ok: false,
          error:
            `Compte annulé : ${profileError.message}`,
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      user_id:
        createdUserId,
      email,
      temporary_password:
        password,
    });
  } catch (
    error: unknown
  ) {
    console.error(
      "Erreur création utilisateur admin :",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof
            Error
            ? error.message
            : "Erreur inconnue.",
      },
      {
        status:
          500,
      }
    );
  }
}
