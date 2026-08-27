import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

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
    const body =
      (await request.json()) as SubscribeBody;

    const endpoint =
      body.endpoint?.trim();

    const p256dh =
      body.p256dh?.trim();

    const auth =
      body.auth?.trim();

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
      !body.alertLost &&
      !body.alertFound
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
              Boolean(
                body.alertLost
              ),

            alert_found:
              Boolean(
                body.alertFound
              ),

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
        "push subscribe:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Impossible d'enregistrer ce téléphone.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (
    caughtError
  ) {
    console.error(
      "push subscribe:",
      caughtError
    );

    return NextResponse.json(
      {
        error:
          "Erreur serveur lors de l'activation des notifications.",
      },
      {
        status: 500,
      }
    );
  }
}