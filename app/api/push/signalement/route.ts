import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import webpush from "web-push";

export const runtime =
  "nodejs";

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type Signalement = {
  id: string;
  type_signalement:
    | string
    | null;
  animal_type:
    | string
    | null;
  animal_name:
    | string
    | null;
  island:
    | string
    | null;
  city:
    | string
    | null;
  color:
    | string
    | null;
  breed:
    | string
    | null;
  push_sent_at:
    | string
    | null;
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
      .startsWith("bearer ")
  ) {
    return "";
  }

  return header
    .slice(7)
    .trim();
}
function configureWebPush() {
  const publicKey =
    process.env
      .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const privateKey =
    process.env
      .VAPID_PRIVATE_KEY;

  const subject =
    process.env
      .VAPID_SUBJECT ||
    "mailto:contact@taui-te-ora.com";

  if (
    !publicKey ||
    !privateKey
  ) {
    throw new Error(
      "Clés VAPID manquantes."
    );
  }

  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
  );
}

function buildBody(
  signalement: Signalement
) {
  const parts: string[] =
    [];

  if (
    signalement.animal_name
  ) {
    parts.push(
      signalement.animal_name
    );
  } else if (
    signalement.animal_type
  ) {
    parts.push(
      signalement.animal_type
    );
  } else {
    parts.push(
      "Animal"
    );
  }

  if (
    signalement.city
  ) {
    parts.push(
      signalement.city
    );
  }

  if (
    signalement.island
  ) {
    parts.push(
      signalement.island
    );
  }

  const description: string[] =
    [];

  if (
    signalement.color
  ) {
    description.push(
      signalement.color
    );
  }

  if (
    signalement.breed
  ) {
    description.push(
      signalement.breed
    );
  }

  let body =
    parts.join(" • ");

  if (
    description.length >
    0
  ) {
    body +=
      ` — ${description.join(
        ", "
      )}`;
  }

  return body;
}

export async function POST(
  request: Request
) {
  try {
    configureWebPush();

    const {
      signalementId,
    } =
      (await request.json()) as {
        signalementId?: string;
      };

    if (
      !signalementId
    ) {
      return NextResponse.json(
        {
          error:
            "Signalement manquant.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getAdmin();

    const {
      data,
      error:
        signalementError,
    } =
      await supabase
        .from(
          "signalements"
        )
        .select(
          `
          id,
          type_signalement,
          animal_type,
          animal_name,
          island,
          city,
          color,
          breed,
          push_sent_at,
          user_id
        `
        )
        .eq(
          "id",
          signalementId
        )
        .single();

    if (
      signalementError ||
      !data
    ) {
      return NextResponse.json(
        {
          error:
            "Signalement introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    const signalement =
      data as Signalement;

    const isLost =
      signalement.type_signalement ===
      "Animal perdu";

    const isFound =
      signalement.type_signalement ===
      "Animal trouvé";

    /*
     * Les autres types :
     * errant, blessé,
     * maltraité, etc.
     * ne déclenchent pas
     * cette alerte.
     */
    if (
      !isLost &&
      !isFound
    ) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        ignored: true,
      });
    }

    /*
     * Empêche d'envoyer
     * plusieurs fois le même
     * signalement.
     */
    if (
      signalement.push_sent_at
    ) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        alreadySent: true,
      });
    }

    const sentAt =
      new Date()
        .toISOString();

    const {
      data: claimed,
      error:
        claimError,
    } =
      await supabase
        .from(
          "signalements"
        )
        .update({
          push_sent_at:
            sentAt,
        })
        .eq(
          "id",
          signalement.id
        )
        .is(
          "push_sent_at",
          null
        )
        .select(
          "id"
        );

    if (
      claimError
    ) {
      throw claimError;
    }

    /*
     * Une autre requête a
     * éventuellement déjà
     * pris en charge l'alerte.
     */
    if (
      !claimed ||
      claimed.length ===
        0
    ) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        alreadySent: true,
      });
    }

    let query =
      supabase
        .from(
          "push_subscriptions"
        )
        .select(
          `
          id,
          endpoint,
          p256dh,
          auth
        `
        );

    if (isLost) {
      query =
        query.eq(
          "alert_lost",
          true
        );
    }

    if (isFound) {
      query =
        query.eq(
          "alert_found",
          true
        );
    }

    const {
      data:
        subscriptions,
      error:
        subscriptionsError,
    } =
      await query;

    if (
      subscriptionsError
    ) {
      throw subscriptionsError;
    }

    const title =
      isLost
        ? "🚨 Animal perdu"
        : "🐾 Animal trouvé";

    const payload =
      JSON.stringify({
        title,

        body:
          buildBody(
            signalement
          ),

        url:
          `/signalement/${signalement.id}`,

        signalementId:
          signalement.id,

        type:
          isLost
            ? "lost"
            : "found",
      });

    let sent = 0;

    let removed = 0;

    const rows =
      (
        subscriptions ||
        []
      ) as PushSubscriptionRow[];

    for (
      const subscription
      of rows
    ) {
      try {
        await webpush.sendNotification(
          {
            endpoint:
              subscription.endpoint,

            keys: {
              p256dh:
                subscription.p256dh,

              auth:
                subscription.auth,
            },
          },
          payload,
          {
            TTL:
              60 * 60 * 12,

            urgency:
              "high",
          }
        );

        sent += 1;
      } catch (
        caughtError
      ) {
        const pushError =
          caughtError as {
            statusCode?: number;
          };

        /*
         * Le téléphone ou
         * navigateur a supprimé
         * l'abonnement.
         */
        if (
          pushError.statusCode ===
            404 ||
          pushError.statusCode ===
            410
        ) {
          await supabase
            .from(
              "push_subscriptions"
            )
            .delete()
            .eq(
              "id",
              subscription.id
            );

          removed += 1;
        } else {
          console.error(
            "Erreur envoi push:",
            caughtError
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      removed,
    });
  } catch (
    caughtError
  ) {
    console.error(
      "signalement push:",
      caughtError
    );

    return NextResponse.json(
      {
        error:
          "Impossible d'envoyer les notifications.",
      },
      {
        status: 500,
      }
    );
  }
}

