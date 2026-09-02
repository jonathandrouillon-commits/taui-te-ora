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

type NotificationBody = {
  recipient_id?: string;

  type?: string;
  title?: string;
  message?: string;

  animal_id?: string | null;
  adoption_request_id?: string | null;
  conversation_id?: string | null;
  signalement_id?: string | null;
};

type ProfileRow = {
  id: string;
};

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

function getSupabaseAdmin() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    url,
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
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      getSupabaseAdmin();

    const token =
      getBearerToken(
        request
      );

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Authentification requise.",
        },
        {
          status:
            401,
        }
      );
    }

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
          status:
            401,
        }
      );
    }

    let body:
      NotificationBody;

    try {
      body =
        (
          await request
            .json()
        ) as NotificationBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Requête invalide.",
        },
        {
          status:
            400,
        }
      );
    }

    const recipientId =
      String(
        body.recipient_id ||
          ""
      ).trim();

    const type =
      String(
        body.type ||
          ""
      ).trim();

    const title =
      String(
        body.title ||
          ""
      ).trim();

    const message =
      String(
        body.message ||
          ""
      ).trim();

    if (
      !recipientId ||
      !type ||
      !title ||
      !message
    ) {
      return NextResponse.json(
        {
          error:
            "Notification incomplète.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
     * =====================================================
     * ADMINS ACTIFS
     * =====================================================
     */

    const {
      data:
        adminProfiles,

      error:
        adminsError,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(
          "id"
        )
        .eq(
          "role",
          "admin"
        )
        .eq(
          "is_active",
          true
        );

    if (
      adminsError
    ) {
      console.error(
        "Erreur recherche admins :",
        adminsError
      );

      return NextResponse.json(
        {
          error:
            "Impossible de récupérer les administrateurs.",
        },
        {
          status:
            500,
        }
      );
    }

    /*
     * Destinataire normal
     * +
     * tous les admins.
     */

    const recipients =
      new Set<string>();

    recipients.add(
      recipientId
    );

    for (
      const profile
      of (
        adminProfiles ||
        []
      ) as ProfileRow[]
    ) {
      if (
        profile.id
      ) {
        recipients.add(
          profile.id
        );
      }
    }

    const rows =
      Array.from(
        recipients
      ).map(
        (
          recipient
        ) => ({
          recipient_id:
            recipient,

          type,

          title,

          message,

          animal_id:
            body.animal_id ??
            null,

          adoption_request_id:
            body
              .adoption_request_id ??
            null,

          conversation_id:
            body
              .conversation_id ??
            null,

          signalement_id:
            body
              .signalement_id ??
            null,

          is_read:
            false,

          read_at:
            null,
        })
      );

    const {
      data:
        inserted,

      error:
        insertError,
    } =
      await supabase
        .from(
          "notifications"
        )
        .insert(
          rows
        )
        .select();

    if (
      insertError
    ) {
      console.error(
        "Erreur création notifications :",
        insertError
      );

      return NextResponse.json(
        {
          error:
            insertError.message ||
            "Impossible de créer les notifications.",
        },
        {
          status:
            500,
        }
      );
    }

    const recipientNotification =
      (
        inserted ||
        []
      ).find(
        (
          item
        ) =>
          item.recipient_id ===
          recipientId
      ) ||
      (
        inserted ||
        []
      )[0] ||
      null;

    return NextResponse.json(
      {
        success:
          true,

        notification:
          recipientNotification,

        recipients:
          recipients.size,

        admins:
          (
            adminProfiles ||
            []
          ).length,
      },
      {
        status:
          200,
      }
    );
  } catch (
    caughtError
  ) {
    console.error(
      "POST /api/notifications/create :",
      caughtError
    );

    return NextResponse.json(
      {
        error:
          caughtError instanceof
            Error
            ? caughtError.message
            : "Erreur serveur.",
      },
      {
        status:
          500,
      }
    );
  }
}