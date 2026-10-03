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

  animal_id?: string | null;
  adoption_request_id?: string | null;
};

type AdoptionRequestRow = {
  id: string;
  animal_id: string;
  requester_id: string;
  owner_id: string;
  status: string | null;
};

type ProfileRow = {
  id: string;
  role?: string | null;
  is_active?: boolean | null;
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

function normalizeRole(
  role:
    | string
    | null
    | undefined
) {
  return String(
    role || ""
  )
    .trim()
    .toLowerCase();
}

function normalizeStatus(
  status:
    | string
    | null
    | undefined
) {
  return String(
    status || ""
  )
    .trim()
    .toLowerCase();
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      getSupabaseAdmin();

    /*
     * =====================================================
     * AUTHENTIFICATION
     * =====================================================
     */

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
          status: 401,
        }
      );
    }

    const {
      data: userData,
      error: userError,
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

    const currentUser =
      userData.user;

    /*
     * =====================================================
     * PAYLOAD
     * =====================================================
     */

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
          status: 400,
        }
      );
    }

    const type =
      String(
        body.type ||
          ""
      )
        .trim()
        .toLowerCase();

    const adoptionRequestId =
      String(
        body
          .adoption_request_id ||
          ""
      ).trim();

    if (
      type !==
        "reponse_adoption" ||
      !adoptionRequestId
    ) {
      return NextResponse.json(
        {
          error:
            "Type de notification non autorisé.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * =====================================================
     * PROFIL UTILISATEUR
     * =====================================================
     */

    const {
      data:
        currentProfile,

      error:
        profileError,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(
          "id, role, is_active"
        )
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();

    if (
      profileError ||
      !currentProfile
    ) {
      return NextResponse.json(
        {
          error:
            "Profil utilisateur introuvable.",
        },
        {
          status: 403,
        }
      );
    }

    const profile =
      currentProfile as
        ProfileRow;

    const isAdmin =
      normalizeRole(
        profile.role
      ) ===
        "admin" ||
      normalizeRole(
        profile.role
      ) ===
        "administrateur";

    if (
      profile.is_active ===
        false
    ) {
      return NextResponse.json(
        {
          error:
            "Compte utilisateur inactif.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * =====================================================
     * DEMANDE D'ADOPTION
     * =====================================================
     */

    const {
      data:
        adoptionRequest,

      error:
        adoptionError,
    } =
      await supabase
        .from(
          "adoption_requests"
        )
        .select(
          `
            id,
            animal_id,
            requester_id,
            owner_id,
            status
          `
        )
        .eq(
          "id",
          adoptionRequestId
        )
        .maybeSingle();

    if (
      adoptionError ||
      !adoptionRequest
    ) {
      return NextResponse.json(
        {
          error:
            "Demande d'adoption introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    const adoption =
      adoptionRequest as
        AdoptionRequestRow;

    /*
     * Seul le propriétaire responsable
     * de la demande ou un admin
     * peut envoyer la réponse.
     */

    if (
      !isAdmin &&
      adoption.owner_id !==
        currentUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "Vous n'êtes pas autorisé à répondre à cette demande d'adoption.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Vérification supplémentaire :
     * le destinataire fourni par le client,
     * s'il existe, doit être le vrai demandeur.
     */

    if (
      body.recipient_id &&
      body.recipient_id !==
        adoption.requester_id
    ) {
      return NextResponse.json(
        {
          error:
            "Destinataire invalide.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Vérification supplémentaire de l'animal.
     */

    if (
      body.animal_id &&
      body.animal_id !==
        adoption.animal_id
    ) {
      return NextResponse.json(
        {
          error:
            "Animal invalide.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * =====================================================
     * STATUT
     * =====================================================
     */

    const status =
      normalizeStatus(
        adoption.status
      );

    if (
      status !== "accepted" &&
      status !== "refused"
    ) {
      return NextResponse.json(
        {
          error:
            "La demande n'a pas encore été acceptée ou refusée.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Le client ne contrôle plus
     * le titre ni le message.
     */

    const title =
      status === "accepted"
        ? "Demande d'adoption acceptée"
        : "Demande d'adoption refusée";

    const message =
      status === "accepted"
        ? "Bonne nouvelle, votre demande d'adoption a été acceptée."
        : "Votre demande d'adoption a été refusée.";

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
        .in(
          "role",
          [
            "admin",
            "administrateur",
          ]
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
          status: 500,
        }
      );
    }

    /*
     * =====================================================
     * DESTINATAIRES
     * =====================================================
     */

    const recipients =
      new Set<string>();

    /*
     * Vrai demandeur uniquement.
     */

    recipients.add(
      adoption.requester_id
    );

    /*
     * On conserve le fonctionnement actuel :
     * copie aux admins actifs.
     */

    for (
      const admin
      of (
        adminProfiles ||
        []
      ) as ProfileRow[]
    ) {
      if (
        admin.id
      ) {
        recipients.add(
          admin.id
        );
      }
    }

    /*
     * =====================================================
     * INSERTION
     * =====================================================
     */

    const rows =
      Array.from(
        recipients
      ).map(
        (
          recipient
        ) => ({
          recipient_id:
            recipient,

          type:
            "reponse_adoption",

          title,

          message,

          animal_id:
            adoption.animal_id,

          adoption_request_id:
            adoption.id,

          conversation_id:
            null,

          signalement_id:
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
          status: 500,
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
          adoption.requester_id
      ) ||
      (
        inserted ||
        []
      )[0] ||
      null;

    return NextResponse.json(
      {
        success: true,

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
        status: 200,
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
        status: 500,
      }
    );
  }
}