import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StartConversationBody = {
  recipientId?: string;
};

type ProfileRow = {
  id: string;
  role: string | null;
  is_active: boolean | null;
};

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeRole(
  value: unknown
) {
  const role =
    clean(value)
      .toLowerCase();

  if (
    role === "utilisateur" ||
    role === "user"
  ) {
    return "adoptant";
  }

  return role;
}

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

function canProfilesTalk(
  senderRole: string,
  recipientRole: string
) {
  /*
   * RÈGLE TAUI TE ORA :
   *
   * Une seule interdiction :
   * adoptant/utilisateur <-> adoptant/utilisateur
   *
   * Toutes les autres combinaisons sont autorisées.
   */
  return !(
    normalizeRole(
      senderRole
    ) === "adoptant" &&
    normalizeRole(
      recipientRole
    ) === "adoptant"
  );
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
          ok: false,
          error:
            "Configuration Supabase serveur manquante.",
        },
        {
          status: 500,
        }
      );
    }

    const token =
      getBearerToken(
        request
      );

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Connexion requise.",
        },
        {
          status: 401,
        }
      );
    }

    const adminClient =
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
      await adminClient
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
          ok: false,
          error:
            "Session invalide ou expirée.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (
        await request
          .json()
          .catch(
            () => null
          )
      ) as
        | StartConversationBody
        | null;

    const recipientId =
      clean(
        body?.recipientId
      );

    if (!recipientId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Destinataire manquant.",
        },
        {
          status: 400,
        }
      );
    }

    const senderId =
      authData.user.id;

    if (
      senderId ===
      recipientId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Vous ne pouvez pas vous envoyer un message à vous-même.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        profileRows,
      error:
        profileError,
    } =
      await adminClient
        .from(
          "profiles"
        )
        .select(
          "id, role, is_active"
        )
        .in(
          "id",
          [
            senderId,
            recipientId,
          ]
        );

    if (profileError) {
      throw profileError;
    }

    const profiles =
      (
        profileRows ||
        []
      ) as ProfileRow[];

    const sender =
      profiles.find(
        (profile) =>
          profile.id ===
          senderId
      );

    const recipient =
      profiles.find(
        (profile) =>
          profile.id ===
          recipientId
      );

    if (
      !sender ||
      !recipient
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Profil introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      sender.is_active ===
        false ||
      recipient.is_active ===
        false
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Ce profil n'est pas disponible pour la messagerie.",
        },
        {
          status: 403,
        }
      );
    }

    const senderRole =
      normalizeRole(
        sender.role
      );

    const recipientRole =
      normalizeRole(
        recipient.role
      );

    if (
      !canProfilesTalk(
        senderRole,
        recipientRole
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          code:
            "ADOPTANT_TO_ADOPTANT_FORBIDDEN",
          error:
            "Les comptes adoptant/utilisateur ne peuvent pas se contacter entre eux.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * On cherche d'abord une conversation directe
     * déjà existante entre ces deux profils.
     *
     * Une conversation directe Taui Te Ora n'a
     * ni animal, ni demande d'adoption, ni SOS.
     */
    const {
      data:
        existingRows,
      error:
        existingError,
    } =
      await adminClient
        .from(
          "conversations"
        )
        .select(
          `
            id,
            requester_id,
            owner_id,
            animal_id,
            adoption_request_id,
            sos_id,
            created_at,
            updated_at
          `
        )
        .is(
          "animal_id",
          null
        )
        .is(
          "adoption_request_id",
          null
        )
        .is(
          "sos_id",
          null
        )
        .or(
          `and(requester_id.eq.${senderId},owner_id.eq.${recipientId}),and(requester_id.eq.${recipientId},owner_id.eq.${senderId})`
        )
        .order(
          "updated_at",
          {
            ascending:
              false,
          }
        )
        .limit(1);

    if (existingError) {
      throw existingError;
    }

    const existing =
      existingRows?.[0];

    if (existing?.id) {
      return NextResponse.json({
        ok: true,
        created: false,
        conversationId:
          existing.id,
        url:
          `/messages/${existing.id}`,
      });
    }

    const now =
      new Date()
        .toISOString();

    /*
     * La création passe côté serveur avec la
     * service-role. La règle de sécurité est
     * donc appliquée ici avant l'INSERT.
     */
    const {
      data:
        created,
      error:
        createError,
    } =
      await adminClient
        .from(
          "conversations"
        )
        .insert({
          requester_id:
            senderId,
          owner_id:
            recipientId,
          animal_id:
            null,
          adoption_request_id:
            null,
          sos_id:
            null,
          created_at:
            now,
          updated_at:
            now,
        })
        .select(
          "id"
        )
        .single();

    if (
      createError ||
      !created?.id
    ) {
      throw (
        createError ||
        new Error(
          "Impossible de créer la conversation."
        )
      );
    }

    return NextResponse.json({
      ok: true,
      created: true,
      conversationId:
        created.id,
      url:
        `/messages/${created.id}`,
    });
  } catch (
    error: unknown
  ) {
    console.error(
      "Erreur création conversation directe :",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof
            Error
            ? error.message
            : "Impossible d'ouvrir la conversation.",
      },
      {
        status: 500,
      }
    );
  }
}
