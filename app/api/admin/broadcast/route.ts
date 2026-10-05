import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  sendPushToUser,
} from "../../../lib/server/push";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type BroadcastBody = {
  action?:
    | "profiles"
    | "preview"
    | "send";
  roles?: string[];
  recipient_ids?: string[];
  title?: string;
  message?: string;
  channels?: {
    notification?: boolean;
    email?: boolean;
  };
};

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  role: string | null;
  is_active: boolean | null;
};

const ALLOWED_ROLES =
  new Set([
    "adoptant",
    "association",
    "refuge",
    "fourriere",
    "sigfa",
    "benevole",
    "famille_accueil",
    "famille_d_accueil",
    "admin",
  ]);

function clean(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

function escapeHtml(
  value: string
): string {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function messageToHtml(
  value: string
): string {
  return escapeHtml(
    value
  ).replace(
    /\n/g,
    "<br />"
  );
}

function sleep(
  milliseconds: number
) {
  return new Promise<void>(
    (
      resolve
    ) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

function getBearerToken(
  request: Request
): string {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization
  ) {
    return "";
  }

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

function sanitizeRoles(
  roles: unknown
): string[] {
  if (
    !Array.isArray(
      roles
    )
  ) {
    return [];
  }

  return Array.from(
    new Set(
      roles
        .map(
          (role) =>
            clean(
              role
            ).toLowerCase()
        )
        .filter(
          (role) =>
            ALLOWED_ROLES.has(
              role
            )
        )
    )
  );
}

function sanitizeRecipientIds(
  value: unknown
): string[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map(
          (id) =>
            clean(id)
        )
        .filter(
          Boolean
        )
    )
  );
}

async function sendEmail({
  email,
  firstName,
  organizationName,
  title,
  message,
}: {
  email: string;
  firstName: string;
  organizationName: string;
  title: string;
  message: string;
}) {
  const resendApiKey =
    process.env
      .RESEND_API_KEY;

  if (
    !resendApiKey
  ) {
    throw new Error(
      "RESEND_API_KEY manquant."
    );
  }

  /*
   * Domaine Resend maintenant vérifié.
   *
   * Tu peux éventuellement définir RESEND_FROM_EMAIL
   * dans Vercel plus tard.
   *
   * Sinon cette adresse sera utilisée automatiquement.
   */
  const from =
    process.env
      .RESEND_FROM_EMAIL ||
    "TAUI TE ORA <info@taui-te-ora.com>";

  const displayName =
    firstName ||
    organizationName ||
    "";

  const greeting =
    displayName
      ? `Ia ora na ${escapeHtml(
          displayName
        )},`
      : "Ia ora na,";

  const html = `
<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#fbf7ef;font-family:Arial,Helvetica,sans-serif;color:#332d29;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #eadfd8;">
        <div style="background:#064b42;padding:28px;color:#ffffff;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.8;">
            TAUI TE ORA
          </div>

          <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;">
            ${escapeHtml(
              title
            )}
          </h1>
        </div>

        <div style="padding:28px;">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">
            ${greeting}
          </p>

          <div style="font-size:16px;line-height:1.7;">
            ${messageToHtml(
              message
            )}
          </div>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #eee4dc;font-size:13px;line-height:1.6;color:#756d67;">
            Message envoyé par l'administration de TAUI TE ORA.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;

  /*
   * Retry automatique si Resend répond 429.
   */
  const maxAttempts =
    3;

  for (
    let attempt = 1;
    attempt <=
    maxAttempts;
    attempt += 1
  ) {
    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method:
            "POST",
          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(
              {
                from,
                to: [
                  email,
                ],
                subject:
                  title,
                html,
              }
            ),
          cache:
            "no-store",
        }
      );

    if (
      response.ok
    ) {
      return;
    }

    const providerError =
      await response
        .text()
        .catch(
          () => ""
        );

    /*
     * Rate limit Resend :
     * on attend puis on réessaie.
     */
    if (
      response.status ===
        429 &&
      attempt <
        maxAttempts
    ) {
      await sleep(
        attempt *
          1500
      );

      continue;
    }

    throw new Error(
      providerError ||
        `Erreur Resend (${response.status}).`
    );
  }
}

async function sendEmailsInChunks({
  recipients,
  title,
  message,
}: {
  recipients:
    ProfileRow[];
  title: string;
  message: string;
}) {
  let sent = 0;
  let failed = 0;

  const emailRecipients =
    recipients.filter(
      (
        recipient
      ) =>
        clean(
          recipient.email
        ).length >
        0
    );

  /*
   * Resend limite actuellement les requêtes.
   *
   * On envoie maximum 5 mails simultanément,
   * puis on laisse 750 ms avant le groupe suivant.
   *
   * Cela évite les erreurs 429 rencontrées
   * lors de l'envoi des 35 profils.
   */
  const chunkSize =
    5;

  for (
    let index = 0;
    index <
    emailRecipients.length;
    index +=
      chunkSize
  ) {
    const chunk =
      emailRecipients.slice(
        index,
        index +
          chunkSize
      );

    const results =
      await Promise.allSettled(
        chunk.map(
          async (
            recipient
          ) => {
            await sendEmail({
              email:
                clean(
                  recipient.email
                ),

              firstName:
                clean(
                  recipient.first_name
                ),

              organizationName:
                clean(
                  recipient.organization_name
                ),

              title,

              message,
            });
          }
        )
      );

    results.forEach(
      (
        result,
        resultIndex
      ) => {
        if (
          result.status ===
          "fulfilled"
        ) {
          sent +=
            1;

          return;
        }

        failed +=
          1;

        console.error(
          "Erreur email broadcast :",
          {
            recipient_id:
              chunk[
                resultIndex
              ]?.id,

            email:
              chunk[
                resultIndex
              ]?.email,

            reason:
              result.reason,
          }
        );
      }
    );

    /*
     * Pause entre deux groupes.
     *
     * Pas nécessaire après le dernier groupe.
     */
    if (
      index +
        chunkSize <
      emailRecipients.length
    ) {
      await sleep(
        750
      );
    }
  }

  return {
    sent,
    failed,
  };
}

async function sendPushesInChunks({
  recipients,
  title,
  message,
}: {
  recipients:
    ProfileRow[];
  title: string;
  message: string;
}) {
  let sent = 0;
  let failed = 0;

  const chunkSize =
    10;

  for (
    let index = 0;
    index <
    recipients.length;
    index +=
      chunkSize
  ) {
    const chunk =
      recipients.slice(
        index,
        index +
          chunkSize
      );

    const results =
      await Promise.allSettled(
        chunk.map(
          async (
            recipient
          ) => {
            const result =
              await sendPushToUser(
                recipient.id,
                {
                  title,

                  body:
                    message.length >
                    180
                      ? `${message.slice(
                          0,
                          180
                        )}…`
                      : message,

                  url:
                    "/notifications",

                  type:
                    "admin_broadcast",

                  tag:
                    `admin-broadcast-${recipient.id}`,
                }
              );

            return result;
          }
        )
      );

    results.forEach(
      (
        result
      ) => {
        if (
          result.status ===
          "fulfilled"
        ) {
          sent +=
            result.value.sent;

          failed +=
            result.value.failed;
        } else {
          failed +=
            1;
        }
      }
    );
  }

  return {
    sent,
    failed,
  };
}

export async function POST(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Configuration Supabase serveur manquante.",
        },
        {
          status:
            500,
        }
      );
    }

    const token =
      getBearerToken(
        request
      );

    if (
      !token
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Connexion requise.",
        },
        {
          status:
            401,
        }
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
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

    const {
      data:
        authData,

      error:
        authError,
    } =
      await supabaseAdmin
        .auth
        .getUser(
          token
        );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Session invalide.",
        },
        {
          status:
            401,
        }
      );
    }

    const {
      data:
        adminProfile,

      error:
        adminProfileError,
    } =
      await supabaseAdmin
        .from(
          "profiles"
        )
        .select(
          "id, role, is_active"
        )
        .eq(
          "id",
          authData.user.id
        )
        .maybeSingle();

    if (
      adminProfileError
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            adminProfileError.message,
        },
        {
          status:
            500,
        }
      );
    }

    const adminRole =
      clean(
        adminProfile?.role
      ).toLowerCase();

    if (
      adminRole !==
      "admin"
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Accès administrateur requis.",
        },
        {
          status:
            403,
        }
      );
    }

    if (
      adminProfile
        ?.is_active ===
      false
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Compte administrateur désactivé.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      (
        await request
          .json()
          .catch(
            () =>
              null
          )
      ) as
        | BroadcastBody
        | null;

    if (
      !body
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Requête invalide.",
        },
        {
          status:
            400,
        }
      );
    }

    const roles =
      sanitizeRoles(
        body.roles
      );

    if (
      roles.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Sélectionne au moins un type de profil.",
        },
        {
          status:
            400,
        }
      );
    }

    const recipientIds =
      sanitizeRecipientIds(
        body.recipient_ids
      );

    let query =
      supabaseAdmin
        .from(
          "profiles"
        )
        .select(
          `
            id,
            email,
            first_name,
            last_name,
            organization_name,
            role,
            is_active
          `
        )
        .in(
          "role",
          roles
        )
        .neq(
          "is_active",
          false
        );

    if (
      recipientIds.length >
      0
    ) {
      query =
        query.in(
          "id",
          recipientIds
        );
    }

    const {
      data:
        recipientData,

      error:
        recipientError,
    } =
      await query.order(
        "organization_name",
        {
          ascending:
            true,

          nullsFirst:
            false,
        }
      );

    if (
      recipientError
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            recipientError.message,
        },
        {
          status:
            500,
        }
      );
    }

    const recipients =
      (
        recipientData ||
        []
      ) as ProfileRow[];

    if (
      body.action ===
      "profiles"
    ) {
      return NextResponse.json({
        ok:
          true,

        count:
          recipients.length,

        profiles:
          recipients.map(
            (
              recipient
            ) => ({
              id:
                recipient.id,

              email:
                recipient.email,

              first_name:
                recipient.first_name,

              last_name:
                recipient.last_name,

              organization_name:
                recipient.organization_name,

              role:
                recipient.role,
            })
          ),
      });
    }

    if (
      body.action ===
      "preview"
    ) {
      return NextResponse.json({
        ok:
          true,

        count:
          recipients.length,

        roles,
      });
    }

    const title =
      clean(
        body.title
      );

    const message =
      clean(
        body.message
      );

    if (
      !title ||
      !message
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Le titre et le message sont obligatoires.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      title.length >
      160
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Le titre est trop long.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      message.length >
      8000
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Le message est trop long.",
        },
        {
          status:
            400,
        }
      );
    }

    const wantNotification =
      Boolean(
        body.channels
          ?.notification
      );

    const wantEmail =
      Boolean(
        body.channels
          ?.email
      );

    if (
      !wantNotification &&
      !wantEmail
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Choisis au moins un canal d'envoi.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      recipients.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "Aucun destinataire ne correspond à cette sélection.",
        },
        {
          status:
            400,
        }
      );
    }

    let notificationsCreated =
      0;

    let pushesSent =
      0;

    let pushesFailed =
      0;

    if (
      wantNotification
    ) {
      const rows =
        recipients.map(
          (
            recipient
          ) => ({
            recipient_id:
              recipient.id,

            type:
              "admin_broadcast",

            title,

            message,

            is_read:
              false,
          })
        );

      const chunkSize =
        500;

      for (
        let index = 0;
        index <
        rows.length;
        index +=
          chunkSize
      ) {
        const chunk =
          rows.slice(
            index,
            index +
              chunkSize
          );

        const {
          error:
            notificationError,
        } =
          await supabaseAdmin
            .from(
              "notifications"
            )
            .insert(
              chunk
            );

        if (
          notificationError
        ) {
          return NextResponse.json(
            {
              ok:
                false,

              error:
                `Erreur notifications : ${notificationError.message}`,
            },
            {
              status:
                500,
            }
          );
        }

        notificationsCreated +=
          chunk.length;
      }

      const pushResult =
        await sendPushesInChunks(
          {
            recipients,

            title,

            message,
          }
        );

      pushesSent =
        pushResult.sent;

      pushesFailed =
        pushResult.failed;
    }

    let emailsSent =
      0;

    let emailsFailed =
      0;

    if (
      wantEmail
    ) {
      const emailResult =
        await sendEmailsInChunks(
          {
            recipients,

            title,

            message,
          }
        );

      emailsSent =
        emailResult.sent;

      emailsFailed =
        emailResult.failed;
    }

    console.log(
      "Communication admin envoyée",
      {
        admin_id:
          authData.user.id,

        roles,

        selected_ids:
          recipientIds,

        recipients:
          recipients.length,

        notifications:
          notificationsCreated,

        pushes_sent:
          pushesSent,

        pushes_failed:
          pushesFailed,

        emails_sent:
          emailsSent,

        emails_failed:
          emailsFailed,
      }
    );

    return NextResponse.json({
      ok:
        true,

      recipients:
        recipients.length,

      notifications_created:
        notificationsCreated,

      pushes_sent:
        pushesSent,

      pushes_failed:
        pushesFailed,

      emails_sent:
        emailsSent,

      emails_failed:
        emailsFailed,
    });
  } catch (
    error: unknown
  ) {
    console.error(
      "Erreur API broadcast :",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof
            Error
            ? error.message
            : "Erreur inconnue.",
      },
      {
        status:
          500,
      }
    );
  }
}