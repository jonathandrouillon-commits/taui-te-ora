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

export async function POST(
  request: Request
) {
  try {
    let body:
      SubscribeBody;

    try {
      body =
        (await request.json()) as SubscribeBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Corps de requête invalide.",
        },
        {
          status: 400,
        }
      );
    }

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

    const alertLost =
      Boolean(
        body.alertLost
      );

    const alertFound =
      Boolean(
        body.alertFound
      );

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
      !alertLost &&
      !alertFound
    ) {
      return NextResponse.json(
        {
          error:
            "Choisissez au moins un type d'alerte.",
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

    const supabase =
      getAdmin();

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

            alert_lost:
              alertLost,

            alert_found:
              alertFound,

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
      console.error(
        "Erreur Supabase push_subscriptions :",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Impossible d'enregistrer ce téléphone.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,

        alertLost,

        alertFound,
      },
      {
        status: 200,
      }
    );
  } catch (
    caughtError
  ) {
    console.error(
      "POST /api/push/subscribe :",
      caughtError
    );

    return NextResponse.json(
      {
        error:
          caughtError instanceof
            Error
            ? caughtError.message
            : "Erreur serveur lors de l'activation des notifications.",
      },
      {
        status: 500,
      }
    );
  }
}