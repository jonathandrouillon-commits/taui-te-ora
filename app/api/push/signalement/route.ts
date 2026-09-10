import {
  createHash,
  timingSafeEqual,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import webpush from "web-push";

export const runtime =
  "nodejs";

const ANONYMOUS_PUSH_WINDOW_MS =
  30 * 60 * 1000;

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

  user_id:
    | string
    | null;

  upload_token_hash:
    | string
    | null;

  created_at: string;
};

function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    }
  );
}

function sha256(
  value: string
) {
  return createHash(
    "sha256"
  )
    .update(
      value,
      "utf8"
    )
    .digest(
      "hex"
    );
}

function safeHashEquals(
  left: string,
  right: string
) {
  if (
    !/^[a-f0-9]{64}$/i.test(
      left
    ) ||
    !/^[a-f0-9]{64}$/i.test(
      right
    )
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(
      left.toLowerCase(),
      "hex"
    ),
    Buffer.from(
      right.toLowerCase(),
      "hex"
    )
  );
}

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
    parts.join(
      " • "
    );

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

    const body =
      (await request.json()) as {
        signalementId?: string;
        uploadToken?: string;
      };

    const signalementId =
      String(
        body.signalementId ||
          ""
      ).trim();

    const uploadToken =
      String(
        body.uploadToken ||
          ""
      ).trim();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        signalementId
      )
    ) {
      return jsonError(
        "Identifiant de signalement invalide.",
        400
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
          user_id,
          upload_token_hash,
          created_at
        `
        )
        .eq(
          "id",
          signalementId
        )
        .maybeSingle();

    if (
      signalementError
    ) {
      console.error(
        "Signalement push lookup:",
        signalementError
      );

      return jsonError(
        "Impossible de vérifier le signalement.",
        500
      );
    }

    if (
      !data
    ) {
      return jsonError(
        "Signalement introuvable.",
        404
      );
    }

    const signalement =
      data as Signalement;

    /*
     * ------------------------------------------------
     * AUTORISATION
     * ------------------------------------------------
     *
     * Deux possibilités :
     *
     * 1. Signalement d'un utilisateur connecté :
     *    Bearer token obligatoire et user_id doit
     *    correspondre au propriétaire du signalement.
     *
     * 2. Signalement anonyme :
     *    uploadToken obligatoire, vérifié avec le
     *    SHA-256 stocké en base.
     */

    let authenticatedUserId:
      | string
      | null = null;

    const accessToken =
      getBearerToken(
        request
      );

    if (
      accessToken
    ) {
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.getUser(
          accessToken
        );

      if (
        !authError &&
        authData.user
      ) {
        authenticatedUserId =
          authData.user.id;
      }
    }

    const isAuthenticatedOwner =
      Boolean(
        authenticatedUserId
      ) &&
      signalement.user_id ===
        authenticatedUserId;

    let hasAnonymousProof =
      false;

    if (
      !signalement.user_id
    ) {
      const createdAt =
        new Date(
          signalement.created_at
        ).getTime();

      const age =
        Date.now() -
        createdAt;

      const isFresh =
        Number.isFinite(
          createdAt
        ) &&
        age >= 0 &&
        age <=
          ANONYMOUS_PUSH_WINDOW_MS;

      if (
        isFresh &&
        uploadToken &&
        typeof signalement.upload_token_hash ===
          "string"
      ) {
        hasAnonymousProof =
          safeHashEquals(
            sha256(
              uploadToken
            ),
            signalement.upload_token_hash
          );
      }
    }

    if (
      !isAuthenticatedOwner &&
      !hasAnonymousProof
    ) {
      return jsonError(
        "Vous n'êtes pas autorisé à déclencher cette notification.",
        403
      );
    }

    /*
     * ------------------------------------------------
     * TYPE DE SIGNALEMENT
     * ------------------------------------------------
     */

    const isLost =
      signalement.type_signalement ===
      "Animal perdu";

    const isFound =
      signalement.type_signalement ===
      "Animal trouvé";

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
     * ------------------------------------------------
     * ANTI-DOUBLON
     * ------------------------------------------------
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

    /*
     * ------------------------------------------------
     * ABONNEMENTS PUSH
     * ------------------------------------------------
     */

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

    if (
      isLost
    ) {
      query =
        query.eq(
          "alert_lost",
          true
        );
    }

    if (
      isFound
    ) {
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

    /*
     * ------------------------------------------------
     * PAYLOAD
     * ------------------------------------------------
     */

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

    /*
     * ------------------------------------------------
     * ENVOI
     * ------------------------------------------------
     */

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
              60 *
              60 *
              12,

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
         * Abonnement supprimé
         * du navigateur ou du
         * téléphone.
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