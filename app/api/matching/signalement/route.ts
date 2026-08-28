import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MatchRow = {
  signalement_id: string;
  animal_name?: string | null;
  city?: string | null;
  island?: string | null;
  match_score?: number | null;
  match_level?: string | null;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRole) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return {
    url,
    anonKey,
    serviceRole,
  };
}

function getAdminClient(
  url: string,
  serviceRole: string
) {
  return createClient(
    url,
    serviceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getAuthClient(
  url: string,
  anonKey: string
) {
  return createClient(
    url,
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getBearerToken(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  return token || null;
}

function buildMatchMessage(
  match: MatchRow
) {
  const score =
    Number(
      match.match_score || 0
    );

  const animal =
    match.animal_name?.trim() ||
    "un animal";

  const place = [
    match.city,
    match.island,
  ]
    .filter(Boolean)
    .join(" · ");

  return `${score}% de compatibilité avec ${animal}${
    place
      ? ` à ${place}`
      : ""
  }.`;
}

export async function POST(
  request: Request
) {
  try {
    const accessToken =
      getBearerToken(request);

    if (!accessToken) {
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
      url,
      anonKey,
      serviceRole,
    } = getSupabaseConfig();

    const authClient =
      getAuthClient(
        url,
        anonKey
      );

    const {
      data: {
        user,
      },
      error: userError,
    } =
      await authClient.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !user
    ) {
      console.error(
        "Matching - token invalide :",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Session utilisateur invalide ou expirée.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as {
        signalementId?: string;
      };

    const signalementId =
      body.signalementId?.trim();

    if (!signalementId) {
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

    const admin =
      getAdminClient(
        url,
        serviceRole
      );

    const {
      data: source,
      error: sourceError,
    } = await admin
      .from("signalements")
      .select(
        `
          id,
          user_id,
          type_signalement,
          animal_name,
          animal_type,
          city,
          island
        `
      )
      .eq(
        "id",
        signalementId
      )
      .maybeSingle();

    if (
      sourceError ||
      !source
    ) {
      if (sourceError) {
        console.error(
          "Matching - lecture signalement :",
          sourceError
        );
      }

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

    if (
      !source.user_id ||
      source.user_id !==
        user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Vous n'êtes pas autorisé à lancer le matching de ce signalement.",
        },
        {
          status: 403,
        }
      );
    }

    const sourceType =
      String(
        source.type_signalement ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      ![
        "animal perdu",
        "animal trouvé",
      ].includes(sourceType)
    ) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        created: 0,
        matches: 0,
      });
    }

    const {
      data: matchesData,
      error: matchesError,
    } = await admin.rpc(
      "get_signalement_matches",
      {
        p_signalement_id:
          source.id,
      }
    );

    if (matchesError) {
      throw matchesError;
    }

    const matches = (
      (matchesData || []) as MatchRow[]
    )
      .filter(
        (match) =>
          Number(
            match.match_score ||
              0
          ) >= 70
      )
      .slice(0, 5);

    if (
      matches.length === 0
    ) {
      return NextResponse.json({
        ok: true,
        created: 0,
        matches: 0,
        duplicates_ignored: 0,
      });
    }

    const relatedIds =
      matches.map(
        (match) =>
          match.signalement_id
      );

    const {
      data: relatedRows,
      error: relatedError,
    } = await admin
      .from("signalements")
      .select(
        `
          id,
          user_id,
          type_signalement
        `
      )
      .in(
        "id",
        relatedIds
      );

    if (relatedError) {
      throw relatedError;
    }

    const relatedById =
      new Map(
        (relatedRows || []).map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    const rows: Array<{
      recipient_id: string;
      signalement_id: string;
      type: string;
      title: string;
      message: string;
      is_read: boolean;
    }> = [];

    for (
      const match of matches
    ) {
      const related =
        relatedById.get(
          match.signalement_id
        );

      if (source.user_id) {
        rows.push({
          recipient_id:
            source.user_id,

          signalement_id:
            match.signalement_id,

          type:
            "signalement_match",

          title:
            "🔎 Correspondance possible",

          message:
            buildMatchMessage(
              match
            ),

          is_read:
            false,
        });
      }

      if (
        related?.user_id &&
        related.user_id !==
          source.user_id
      ) {
        rows.push({
          recipient_id:
            related.user_id,

          signalement_id:
            source.id,

          type:
            "signalement_match",

          title:
            "🔎 Correspondance possible",

          message:
            `Une nouvelle alerte pourrait correspondre à votre signalement (${Number(
              match.match_score ||
                0
            )}% de compatibilité).`,

          is_read:
            false,
        });
      }
    }

    if (
      rows.length === 0
    ) {
      return NextResponse.json({
        ok: true,
        created: 0,
        matches:
          matches.length,
        duplicates_ignored: 0,
      });
    }

    const deduped =
      Array.from(
        new Map(
          rows.map(
            (row) => [
              `${row.recipient_id}-${row.signalement_id}-${row.type}`,
              row,
            ]
          )
        ).values()
      );

    const {
      data: insertedRows,
      error: insertError,
    } = await admin
      .from("notifications")
      .upsert(
        deduped,
        {
          onConflict:
            "recipient_id,signalement_id,type",

          ignoreDuplicates:
            true,
        }
      )
      .select("id");

    if (insertError) {
      throw insertError;
    }

    const created =
      insertedRows?.length ||
      0;

    return NextResponse.json({
      ok: true,

      created,

      duplicates_ignored:
        deduped.length -
        created,

      matches:
        matches.length,
    });
  } catch (error) {
    console.error(
      "POST /api/matching/signalement :",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de créer les notifications de correspondance.",
      },
      {
        status: 500,
      }
    );
  }
}