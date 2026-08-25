import { NextResponse } from "next/server";

const ALLOWED_ROLES = new Set([
  "adoptant",
  "association",
  "refuge",
  "benevole",
  "fourriere",
]);

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_WINDOW_MS =
  60 * 1000;

const RATE_LIMIT_MAX_REQUESTS =
  2;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForRateLimit =
  globalThis as typeof globalThis & {
    tauiNewUserRateLimit?: Map<
      string,
      RateLimitEntry
    >;
  };

const rateLimitStore =
  globalForRateLimit.tauiNewUserRateLimit ??
  new Map<string, RateLimitEntry>();

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForRateLimit.tauiNewUserRateLimit =
    rateLimitStore;
}

type RegistrationPayload = {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_name: string;
  phone: string;
  island: string;
  city: string;
};

function cleanString(
  value: unknown,
  maxLength: number
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}

function validatePayload(
  body: unknown
):
  | {
      success: true;
      data: RegistrationPayload;
    }
  | {
      success: false;
      error: string;
    } {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return {
      success: false,
      error:
        "Données invalides.",
    };
  }

  const input =
    body as Record<
      string,
      unknown
    >;

  const email =
    cleanString(
      input.email,
      254
    ).toLowerCase();

  const firstName =
    cleanString(
      input.first_name,
      80
    );

  const lastName =
    cleanString(
      input.last_name,
      80
    );

  const role =
    cleanString(
      input.role,
      40
    ).toLowerCase();

  const organizationName =
    cleanString(
      input.organization_name,
      150
    );

  const phone =
    cleanString(
      input.phone,
      40
    );

  const island =
    cleanString(
      input.island,
      80
    );

  const city =
    cleanString(
      input.city,
      100
    );

  if (
    !email ||
    !EMAIL_REGEX.test(email)
  ) {
    return {
      success: false,
      error:
        "Adresse e-mail invalide.",
    };
  }

  if (
    !ALLOWED_ROLES.has(role)
  ) {
    return {
      success: false,
      error:
        "Rôle invalide.",
    };
  }

  return {
    success: true,
    data: {
      email,
      first_name:
        firstName,
      last_name:
        lastName,
      role,
      organization_name:
        organizationName,
      phone,
      island,
      city,
    },
  };
}

function getClientIdentifier(
  request: Request,
  userId: string
) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  const ip =
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    "unknown";

  return `${userId}:${ip}`;
}

function checkRateLimit(
  key: string
) {
  const now =
    Date.now();

  const current =
    rateLimitStore.get(
      key
    );

  if (
    !current ||
    now >= current.resetAt
  ) {
    rateLimitStore.set(
      key,
      {
        count: 1,
        resetAt:
          now +
          RATE_LIMIT_WINDOW_MS,
      }
    );

    return true;
  }

  if (
    current.count >=
    RATE_LIMIT_MAX_REQUESTS
  ) {
    return false;
  }

  current.count += 1;

  rateLimitStore.set(
    key,
    current
  );

  return true;
}

async function getAuthenticatedUser(
  request: Request
) {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      "Configuration Supabase manquante."
    );
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    return null;
  }

  const response =
    await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        method: "GET",

        headers: {
          apikey:
            supabaseAnonKey,

          Authorization:
            `Bearer ${token}`,
        },

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    return null;
  }

  const user =
    (await response.json()) as {
      id?: string;
      email?: string;
    };

  if (!user.id) {
    return null;
  }

  return user;
}

export async function POST(
  request: Request
) {
  try {
    /*
    ==========================================
    1. AUTHENTIFICATION
    ==========================================
    */

    const user =
      await getAuthenticatedUser(
        request
      );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Authentification requise.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    ==========================================
    2. RATE LIMIT
    ==========================================
    */

    const rateLimitKey =
      getClientIdentifier(
        request,
        user.id!
      );

    if (
      !checkRateLimit(
        rateLimitKey
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Trop de demandes. Merci de réessayer dans quelques instants.",
        },
        {
          status: 429,
        }
      );
    }

    /*
    ==========================================
    3. LECTURE JSON
    ==========================================
    */

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Requête invalide.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ==========================================
    4. VALIDATION
    ==========================================
    */

    const validation =
      validatePayload(
        body
      );

    if (
      !validation.success
    ) {
      return NextResponse.json(
        {
          error:
            validation.error,
        },
        {
          status: 400,
        }
      );
    }

    const data =
      validation.data;

    /*
    ==========================================
    5. VÉRIFICATION EMAIL
    ==========================================
    */

    const authenticatedEmail =
      String(
        user.email || ""
      )
        .trim()
        .toLowerCase();

    if (
      !authenticatedEmail ||
      authenticatedEmail !==
        data.email
    ) {
      return NextResponse.json(
        {
          error:
            "L'adresse e-mail ne correspond pas au compte authentifié.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ==========================================
    6. CONFIGURATION RESEND
    ==========================================
    */

    const resendApiKey =
      process.env
        .RESEND_API_KEY;

    if (!resendApiKey) {
      console.error(
        "RESEND_API_KEY manquant."
      );

      return NextResponse.json(
        {
          error:
            "Service d'envoi temporairement indisponible.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    ==========================================
    7. ÉCHAPPEMENT HTML
    ==========================================
    */

    const safeFirstName =
      escapeHtml(
        data.first_name
      );

    const safeLastName =
      escapeHtml(
        data.last_name
      );

    const safeEmail =
      escapeHtml(
        data.email
      );

    const safeRole =
      escapeHtml(
        data.role
      );

    const safeOrganization =
      escapeHtml(
        data.organization_name
      );

    const safePhone =
      escapeHtml(
        data.phone
      );

    const safeIsland =
      escapeHtml(
        data.island
      );

    const safeCity =
      escapeHtml(
        data.city
      );

    const fullName =
      `${safeFirstName} ${safeLastName}`.trim();

    /*
    ==========================================
    8. EMAIL
    ==========================================
    */

    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px;color:#222;">
        <h1 style="color:#064b42;">
          Nouvelle inscription TAUI TE ORA
        </h1>

        <p>
          <strong>Rôle :</strong>
          ${safeRole || "Non renseigné"}
        </p>

        <p>
          <strong>Nom :</strong>
          ${fullName || "Non renseigné"}
        </p>

        <p>
          <strong>Email :</strong>
          ${safeEmail}
        </p>

        <p>
          <strong>Téléphone :</strong>
          ${safePhone || "Non renseigné"}
        </p>

        <p>
          <strong>Île :</strong>
          ${safeIsland || "Non renseignée"}
        </p>

        <p>
          <strong>Ville :</strong>
          ${safeCity || "Non renseignée"}
        </p>

        <p>
          <strong>Organisation :</strong>
          ${safeOrganization || "Non renseignée"}
        </p>

        <hr style="margin:24px 0;" />

        <p>
          Un nouvel utilisateur vient de créer un compte sur TAUI TE ORA.
        </p>

        <p style="font-size:12px;color:#777;">
          Identifiant utilisateur :
          ${escapeHtml(user.id!)}
        </p>
      </div>
    `;

    /*
    ==========================================
    9. ENVOI RESEND
    ==========================================
    */

    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              from:
                "TAUI TE ORA <onboarding@resend.dev>",

              to: [
                "jonathan.drouillon@gmail.com",
              ],

              subject:
                `Nouvelle inscription TAUI TE ORA - ${data.role}`,

              html,
            }),
        }
      );

    /*
    ==========================================
    10. ERREUR FOURNISSEUR
    ==========================================
    */

    if (!response.ok) {
      const providerError =
        await response
          .text()
          .catch(
            () => ""
          );

      console.error(
        "Erreur Resend :",
        response.status,
        providerError
      );

      return NextResponse.json(
        {
          error:
            "Impossible d'envoyer la notification.",
        },
        {
          status: 502,
        }
      );
    }

    /*
    ==========================================
    11. SUCCÈS
    ==========================================
    */

    return NextResponse.json(
      {
        success: true,
        message:
          "Notification envoyée.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Erreur send-new-user :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erreur serveur.",
      },
      {
        status: 500,
      }
    );
  }
}