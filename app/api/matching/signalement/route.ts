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

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Configuration Supabase serveur manquante.");
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function buildMatchMessage(match: MatchRow) {
  const score = Number(match.match_score || 0);
  const animal = match.animal_name?.trim() || "un animal";
  const place = [match.city, match.island].filter(Boolean).join(" · ");

  return `${score}% de compatibilité avec ${animal}${place ? ` à ${place}` : ""}.`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      signalementId?: string;
    };

    if (!body.signalementId) {
      return NextResponse.json(
        { error: "Signalement manquant." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    const { data: source, error: sourceError } = await admin
      .from("signalements")
      .select("id, user_id, type_signalement, animal_name, animal_type, city, island")
      .eq("id", body.signalementId)
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: "Signalement introuvable." },
        { status: 404 }
      );
    }

    const sourceType = String(source.type_signalement || "")
      .trim()
      .toLowerCase();

    if (!["animal perdu", "animal trouvé"].includes(sourceType)) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        created: 0,
      });
    }

    const { data: matchesData, error: matchesError } = await admin.rpc(
      "get_signalement_matches",
      {
        p_signalement_id: source.id,
      }
    );

    if (matchesError) {
      throw matchesError;
    }

    const matches = ((matchesData || []) as MatchRow[])
      .filter((match) => Number(match.match_score || 0) >= 70)
      .slice(0, 5);

    if (matches.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        matches: 0,
      });
    }

    const relatedIds = matches.map((match) => match.signalement_id);

    const { data: relatedRows, error: relatedError } = await admin
      .from("signalements")
      .select("id, user_id, type_signalement")
      .in("id", relatedIds);

    if (relatedError) {
      throw relatedError;
    }

    const relatedById = new Map(
      (relatedRows || []).map((item) => [item.id, item])
    );

    const rows: Array<{
      recipient_id: string;
      signalement_id: string;
      type: string;
      title: string;
      message: string;
      is_read: boolean;
    }> = [];

    for (const match of matches) {
      const related = relatedById.get(match.signalement_id);

      if (source.user_id) {
        rows.push({
          recipient_id: source.user_id,
          signalement_id: source.id,
          type: "signalement_match",
          title: "🔎 Correspondance possible",
          message: buildMatchMessage(match),
          is_read: false,
        });
      }

      if (related?.user_id && related.user_id !== source.user_id) {
        rows.push({
          recipient_id: related.user_id,
          signalement_id: related.id,
          type: "signalement_match",
          title: "🔎 Correspondance possible",
          message: `Une nouvelle alerte pourrait correspondre à votre signalement (${Number(
            match.match_score || 0
          )}% de compatibilité).`,
          is_read: false,
        });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        matches: matches.length,
      });
    }

    /*
     * Evite les doublons grossiers dans un même appel :
     * même destinataire + même signalement + même message.
     */
    const deduped = Array.from(
      new Map(
        rows.map((row) => [
          `${row.recipient_id}-${row.signalement_id}-${row.message}`,
          row,
        ])
      ).values()
    );

    const { error: insertError } = await admin
      .from("notifications")
      .insert(deduped);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      ok: true,
      created: deduped.length,
      matches: matches.length,
    });
  } catch (error) {
    console.error("POST /api/matching/signalement :", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de créer les notifications de correspondance.",
      },
      { status: 500 }
    );
  }
}
