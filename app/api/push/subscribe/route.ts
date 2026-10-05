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

type SubscribeBody = {
  endpoint?: string;
  p256dh?: string;
  auth?: string;

  alertLost?: boolean;
  alertFound?: boolean;
  alertMessages?: boolean;
  alertProfile?: boolean;
  alertSos?: boolean;
};

function getAdmin() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRole =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !serviceRole
  ) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    url,
    serviceRole,
    {
      auth: {
        persistSession:
          false,
        autoRefreshToken:
          false,
      },
    }
  );
}

function getBearerToken(
  request: Request
) {
  const header =
    request.headers.get(
      "authorization"
    ) || "";

  if (
    !header
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return "";
  }

  return header
    .slice(7)
    .trim();
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as SubscribeBody;

    const endpoint =
      String(
        body.endpoint ||
          ""
      ).trim();

    const p256dh =
      String(
        body.p256dh ||
          ""
      ).trim();

    const auth =
      String(
        body.auth ||
          ""
      ).trim();

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        {
          error:
            "Abonnement push incomplet.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !endpoint.startsWith(
        "https://"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Endpoint push invalide.",
        },
        {
          status: 400,
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
          error:
            "Connexion requise pour activer les notifications.",
        },
        {
          status: 401,
        }
      );
    }

    const supabase =
      getAdmin();

    const {
      data:
        userData,
      error:
        userError,
    } =
      await supabase
        .auth
        .getUser(
          token
        );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Session invalide ou expirée.",
        },
        {
          status: 401,
        }
      );
    }

    const preferences = {
      alert_lost:
        body.alertLost ??
        true,

      alert_found:
        body.alertFound ??
        true,

      alert_messages:
        body.alertMessages ??
        true,

      alert_profile:
        body.alertProfile ??
        true,

      alert_sos:
        body.alertSos ??
        true,
    };

    const {
      error,
    } =
      await supabase
        .from(
          "push_subscriptions"
        )
        .upsert(
          {
            endpoint,
            p256dh,
            auth,

            user_id:
              userData.user.id,

            ...preferences,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "endpoint",
          }
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      userLinked: true,
      preferences,
    });
  } catch (
    error
  ) {
    console.error(
      "POST /api/push/subscribe :",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Impossible d'enregistrer les notifications.",
      },
      {
        status: 500,
      }
    );
  }
}
