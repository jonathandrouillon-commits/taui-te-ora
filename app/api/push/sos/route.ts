import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import webpush from "web-push";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type MatchingHelper = {
  id: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
};

type HelpSos = {
  id: string;
  created_by: string;
  title: string;
  help_type: string;
  island: string;
  city: string | null;
  message: string;
  urgency: string;
  status: string;
  animal_type: string | null;
  animals_count: number | null;
  push_sent_at: string | null;
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

function buildBody(
  sos: HelpSos
) {
  const parts: string[] =
    [];

  if (sos.city) {
    parts.push(
      sos.city
    );
  }

  if (sos.island) {
    parts.push(
      sos.island
    );
  }

  if (
    sos.animal_type
  ) {
    parts.push(
      sos.animal_type
    );
  }

  if (
    sos.animals_count &&
    sos.animals_count >
      1
  ) {
    parts.push(
      `${sos.animals_count} animaux`
    );
  }

  const place =
    parts.join(" • ");

  if (!place) {
    return sos.message
      .trim()
      .slice(0, 180);
  }

  return `${place} — ${sos.message
    .trim()
    .slice(0, 140)}`;
}

export async function POST(
  request: Request
) {
  try {
    configureWebPush();

    const token =
      getBearerToken(
        request
      );

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Connexion requise.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      sosId,
    } =
      (await request.json()) as {
        sosId?: string;
      };

    if (!sosId) {
      return NextResponse.json(
        {
          error:
            "SOS manquant.",
        },
        {
          status: 400,
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
            "Session invalide.",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      userData.user;

    const {
      data:
        profile,
      error:
        profileError,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(
          "role"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      profileError
    ) {
      throw profileError;
    }

    const role =
      String(
        profile?.role ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      ![
        "admin",
        "administrateur",
        "association",
      ].includes(
        role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Accès non autorisé.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data:
        sosData,
      error:
        sosError,
    } =
      await supabase
        .from(
          "help_sos"
        )
        .select(
          `
          id,
          created_by,
          title,
          help_type,
          island,
          city,
          message,
          urgency,
          status,
          animal_type,
          animals_count,
          push_sent_at
        `
        )
        .eq(
          "id",
          sosId
        )
        .single();

    if (
      sosError ||
      !sosData
    ) {
      return NextResponse.json(
        {
          error:
            "SOS introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    const sos =
      sosData as HelpSos;

    if (
      role ===
        "association" &&
      sos.created_by !==
        user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Vous ne pouvez notifier que vos propres SOS.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      sos.status ===
      "cloture"
    ) {
      return NextResponse.json(
        {
          error:
            "Ce SOS est clôturé.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Empêche le double envoi.
     */
    if (
      sos.push_sent_at
    ) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        alreadySent: true,
      });
    }

    const {
      data:
        helperData,
      error:
        helperError,
    } =
      await supabase
        .rpc(
          "get_matching_helpers_for_sos",
          {
            p_sos_id:
              sos.id,
          }
        );

    if (
      helperError
    ) {
      throw helperError;
    }

    const helperIds =
      Array.from(
        new Set(
          (
            helperData ||
            []
          )
            .map(
              (
                item:
                  MatchingHelper
              ) =>
                item.id
            )
            .filter(
              Boolean
            )
        )
      );

    if (
      helperIds.length ===
      0
    ) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        matched: 0,
      });
    }

    const {
      data:
        subscriptions,
      error:
        subscriptionsError,
    } =
      await supabase
        .from(
          "push_subscriptions"
        )
        .select(
          `
          id,
          endpoint,
          p256dh,
          auth,
          user_id
        `
        )
        .eq(
          "alert_sos",
          true
        )
        .in(
          "user_id",
          helperIds
        );

    if (
      subscriptionsError
    ) {
      throw subscriptionsError;
    }

    const sentAt =
      new Date()
        .toISOString();

    const {
      data:
        claimed,
      error:
        claimError,
    } =
      await supabase
        .from(
          "help_sos"
        )
        .update({
          push_sent_at:
            sentAt,
        })
        .eq(
          "id",
          sos.id
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

    const title =
      sos.urgency ===
      "critique"
        ? "🚨 SOS critique TAUI TE ORA"
        : sos.urgency ===
            "urgente"
          ? "⚠️ SOS urgent TAUI TE ORA"
          : "🤝 SOS TAUI TE ORA";

    const payload =
      JSON.stringify({
        title,
        body:
          buildBody(
            sos
          ),
        url:
          "/sos-aide",
        sosId:
          sos.id,
        type:
          "sos",
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
        await webpush
          .sendNotification(
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
                6,

              urgency:
                sos.urgency ===
                "critique"
                  ? "high"
                  : "normal",
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
            "Erreur envoi push SOS :",
            caughtError
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      matched:
        helperIds.length,
      subscriptions:
        rows.length,
      sent,
      removed,
    });
  } catch (
    caughtError
  ) {
    console.error(
      "POST /api/push/sos :",
      caughtError
    );

    return NextResponse.json(
      {
        error:
          caughtError instanceof
            Error
            ? caughtError.message
            : "Impossible d'envoyer les notifications SOS.",
      },
      {
        status: 500,
      }
    );
  }
}
