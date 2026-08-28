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

    const alertSos =
      body.alertSos ===
      undefined
        ? true
        : Boolean(
            body.alertSos
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
      !alertFound &&
      !alertSos
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

    /*
     * On rattache l'abonnement push au profil connecté.
     * C'est indispensable pour envoyer un SOS seulement
     * aux personnes compatibles.
     */
    let userId:
      string | null =
      null;

    const token =
      getBearerToken(
        request
      );

    if (token) {
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
        console.error(
          "Token push invalide :",
          userError
        );

        return NextResponse.json(
          {
            error:
              "Session invalide.",
          },
          {
            status: 401,
          }
        );
      }

      userId =
        userData.user.id;
    }

    const subscriptionData = {
      endpoint,
      p256dh,
      auth,

      alert_lost:
        alertLost,

      alert_found:
        alertFound,

      alert_sos:
        alertSos,

      updated_at:
        new Date()
          .toISOString(),
    };

    let error;

    if (userId) {
      const result =
        await supabase
          .from(
            "push_subscriptions"
          )
          .upsert(
            {
              ...subscriptionData,

              user_id:
                userId,
            },
            {
              onConflict:
                "endpoint",
            }
          );

      error =
        result.error;
    } else {
      const {
        data:
          existing,
        error:
          existingError,
      } =
        await supabase
          .from(
            "push_subscriptions"
          )
          .select(
            "user_id"
          )
          .eq(
            "endpoint",
            endpoint
          )
          .maybeSingle();

      if (
        existingError
      ) {
        throw existingError;
      }

      const result =
        await supabase
          .from(
            "push_subscriptions"
          )
          .upsert(
            {
              ...subscriptionData,

              user_id:
                existing?.user_id ??
                null,
            },
            {
              onConflict:
                "endpoint",
            }
          );

      error =
        result.error;
    }

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

        userLinked:
          Boolean(
            userId
          ),

        alertLost,
        alertFound,
        alertSos,
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
