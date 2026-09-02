import {
  supabase,
} from "../lib/supabase";

export type Notification = {
  id: string;
  created_at: string;

  recipient_id: string;

  title: string;
  message: string;
  type: string;

  animal_id?: string | null;

  adoption_request_id?:
    string | null;

  conversation_id?:
    string | null;

  signalement_id?:
    string | null;

  is_read: boolean;

  read_at?:
    string | null;
};

type CreateNotificationInput = {
  recipient_id: string;

  type: string;

  title: string;

  message: string;

  animal_id?:
    string | null;

  adoption_request_id?:
    string | null;

  conversation_id?:
    string | null;

  signalement_id?:
    string | null;
};

export const notificationService = {

  /* =====================================================
     MES NOTIFICATIONS
  ===================================================== */

  async getMyNotifications(
    recipientId: string
  ): Promise<
    Notification[]
  > {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .select(
          "*"
        )
        .eq(
          "recipient_id",
          recipientId
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (
      error
    ) {
      throw error;
    }

    return (
      data ||
      []
    ) as Notification[];
  },

  /* =====================================================
     MARQUER UNE NOTIFICATION
  ===================================================== */

  async markAsRead(
    notificationId: string
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .update({
          is_read:
            true,

          read_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          notificationId
        );

    if (
      error
    ) {
      throw error;
    }
  },

  /* =====================================================
     TOUT MARQUER
  ===================================================== */

  async markAllAsRead(
    recipientId: string
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .update({
          is_read:
            true,

          read_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "recipient_id",
          recipientId
        )
        .eq(
          "is_read",
          false
        );

    if (
      error
    ) {
      throw error;
    }
  },

  /* =====================================================
     CRÉATION
     DESTINATAIRE + TOUS LES ADMINS
  ===================================================== */

  async create({
    recipient_id,
    type,
    title,
    message,

    animal_id,

    adoption_request_id,

    conversation_id,

    signalement_id,
  }: CreateNotificationInput) {

    /*
     * La création passe désormais
     * par le serveur.
     *
     * Le serveur crée automatiquement :
     *
     * - la notification du destinataire
     * - une copie pour chaque admin actif
     *
     * Les autres utilisateurs
     * ne reçoivent rien.
     */

    const {
      data: {
        session,
      },

      error:
        sessionError,
    } =
      await supabase
        .auth
        .getSession();

    if (
      sessionError
    ) {
      throw sessionError;
    }

    if (
      !session
        ?.access_token
    ) {
      throw new Error(
        "Session utilisateur introuvable."
      );
    }

    const response =
      await fetch(
        "/api/notifications/create",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body:
            JSON.stringify({
              recipient_id,

              type,

              title,

              message,

              animal_id:
                animal_id ??
                null,

              adoption_request_id:
                adoption_request_id ??
                null,

              conversation_id:
                conversation_id ??
                null,

              signalement_id:
                signalement_id ??
                null,
            }),
        }
      );

    const result =
      (
        await response
          .json()
          .catch(
            () => null
          )
      ) as
        | {
            notification?:
              Notification | null;

            error?:
              string;
          }
        | null;

    if (
      !response.ok
    ) {
      throw new Error(
        result?.error ||
          "Impossible de créer la notification."
      );
    }

    if (
      !result
        ?.notification
    ) {
      throw new Error(
        "Notification créée mais réponse serveur invalide."
      );
    }

    return result
      .notification;
  },
};