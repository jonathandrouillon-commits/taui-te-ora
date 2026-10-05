import {
  createClient,
} from "@supabase/supabase-js";

import webpush from "web-push";

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;

  alert_lost:
    boolean | null;

  alert_found:
    boolean | null;

  alert_messages:
    boolean | null;

  alert_profile:
    boolean | null;

  alert_sos:
    boolean | null;
};

export type PersonalPushPayload = {
  title: string;
  body: string;
  url?: string;
  type?: string;
  tag?: string;
  notificationId?: string;
  conversationId?: string;
  animalId?: string;
  signalementId?: string;
  adoptionRequestId?: string;
};

function getAdminClient() {
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

function isAllowedByPreferences(
  subscription:
    PushSubscriptionRow,
  type?: string
) {
  const normalizedType =
    String(
      type || "notification"
    )
      .trim()
      .toLowerCase();

  /*
   * Messages privés.
   */
  if (
    normalizedType ===
      "chat_message" ||
    normalizedType.includes(
      "message"
    )
  ) {
    return (
      subscription.alert_messages !==
      false
    );
  }

  /*
   * SOS.
   */
  if (
    normalizedType.includes(
      "sos"
    )
  ) {
    return (
      subscription.alert_sos !==
      false
    );
  }

  /*
   * Signalements ciblés.
   */
  if (
    normalizedType.includes(
      "lost"
    ) ||
    normalizedType.includes(
      "perdu"
    )
  ) {
    return (
      subscription.alert_lost !==
      false
    );
  }

  if (
    normalizedType.includes(
      "found"
    ) ||
    normalizedType.includes(
      "trouve"
    )
  ) {
    return (
      subscription.alert_found !==
      false
    );
  }

  /*
   * Toute notification personnelle :
   * adoption, validation, compte,
   * modification de statut, etc.
   */
  return (
    subscription.alert_profile !==
    false
  );
}

export async function sendPushToUser(
  userId: string,
  payload: PersonalPushPayload
) {
  const cleanUserId =
    String(
      userId ||
        ""
    ).trim();

  const title =
    String(
      payload.title ||
        ""
    ).trim();

  const body =
    String(
      payload.body ||
        ""
    ).trim();

  if (!cleanUserId) {
    throw new Error(
      "Destinataire push manquant."
    );
  }

  if (
    !title ||
    !body
  ) {
    throw new Error(
      "Titre et message push obligatoires."
    );
  }

  configureWebPush();

  const supabase =
    getAdminClient();

  const {
    data,
    error,
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
          user_id,
          alert_lost,
          alert_found,
          alert_messages,
          alert_profile,
          alert_sos
        `
      )
      .eq(
        "user_id",
        cleanUserId
      );

  if (error) {
    throw error;
  }

  const allSubscriptions =
    (
      data ||
      []
    ) as PushSubscriptionRow[];

  const subscriptions =
    allSubscriptions.filter(
      (
        subscription
      ) =>
        isAllowedByPreferences(
          subscription,
          payload.type
        )
    );

  const serializedPayload =
    JSON.stringify({
      title,
      body,

      url:
        payload.url ||
        "/notifications",

      type:
        payload.type ||
        "notification",

      tag:
        payload.tag,

      notificationId:
        payload.notificationId,

      conversationId:
        payload.conversationId,

      animalId:
        payload.animalId,

      signalementId:
        payload.signalementId,

      adoptionRequestId:
        payload.adoptionRequestId,
    });

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (
    const subscription
    of subscriptions
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
          serializedPayload,
          {
            TTL:
              60 *
              60 *
              24,

            urgency:
              "normal",
          }
        );

      sent += 1;
    } catch (
      caughtError
    ) {
      const pushError =
        caughtError as {
          statusCode?:
            number;
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
        failed += 1;

        console.error(
          "Erreur push personnel Taui Te Ora :",
          caughtError
        );
      }
    }
  }

  return {
    subscriptions:
      allSubscriptions.length,

    eligible:
      subscriptions.length,

    sent,
    removed,
    failed,
  };
}
