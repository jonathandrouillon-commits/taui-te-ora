
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Subscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type Signalement = {
  id: string;
  type_signalement: string | null;
  animal_name: string | null;
  animal_type: string | null;
  city: string | null;
  island: string | null;
  status: string | null;
  archived_at: string | null;
};

function fail(error: string, status: number) {
  return NextResponse.json(
    { ok: false, error },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization") || "";

    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return fail("Authentification requise.", 401);
    }

    const accessToken = authorization.slice(7).trim();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!url || !key || !vapidPublic || !vapidPrivate) {
      return fail("Configuration serveur incomplète.", 500);
    }

    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return fail("Session invalide ou expirée.", 401);
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) throw profileError;

    if (
      String(profile?.role || "").trim().toLowerCase() !==
      "admin"
    ) {
      return fail("Accès réservé aux administrateurs.", 403);
    }

    const input = (await request.json().catch(() => null)) as {
      signalementId?: string;
    } | null;

    const signalementId = String(
      input?.signalementId || ""
    ).trim();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        signalementId
      )
    ) {
      return fail("Identifiant invalide.", 400);
    }

    const { data, error: signalementError } =
      await supabase
        .from("signalements")
        .select(
          "id,type_signalement,animal_name,animal_type,city,island,status,archived_at"
        )
        .eq("id", signalementId)
        .maybeSingle();

    if (signalementError) throw signalementError;

    if (!data) {
      return fail("Signalement introuvable.", 404);
    }

    const signalement = data as Signalement;

    const isLost =
      signalement.type_signalement === "Animal perdu";

    const isFound =
      signalement.type_signalement === "Animal trouvé";

    if (!isLost && !isFound) {
      return fail(
        "Seules les alertes perdu/trouvé peuvent être relancées.",
        400
      );
    }

    const status = String(
      signalement.status || "nouveau"
    )
      .trim()
      .toLowerCase();

    if (
      signalement.archived_at ||
      [
        "cloture",
        "animal_retrouve",
        "animal retrouvé",
        "animal retrouve",
        "retrouve",
      ].includes(status)
    ) {
      return fail(
        "Ce signalement est clôturé, retrouvé ou archivé.",
        409
      );
    }

    const { data: relanceId, error: claimError } =
      await supabase.rpc("claim_signalement_push_relance", {
        p_signalement_id: signalement.id,
        p_admin_id: user.id,
      });

    if (claimError) throw claimError;

    if (!relanceId) {
      return fail(
        "Une relance a déjà été effectuée au cours des 12 dernières heures.",
        429
      );
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ||
        "mailto:contact@taui-te-ora.com",
      vapidPublic,
      vapidPrivate
    );

    const payload = JSON.stringify({
      title: isLost
        ? "🚨 Rappel : animal perdu"
        : "🐾 Rappel : animal trouvé",
      body: [
        signalement.animal_name ||
          signalement.animal_type ||
          "Animal",
        signalement.city,
        signalement.island,
      ]
        .filter(Boolean)
        .join(" • "),
      url: `/signalement/public/${signalement.id}`,
      signalementId: signalement.id,
      type: isLost ? "lost" : "found",
      tag: `relance-${signalement.id}-${relanceId}`,
    });

    let sent = 0;
    let failed = 0;
    let removed = 0;
    let scanned = 0;
    let lastError = "";

    try {
      const pageSize = 250;
      let cursor: string | null = null;

      for (;;) {
        let query = supabase
          .from("push_subscriptions")
          .select("id,endpoint,p256dh,auth")
          .order("id", { ascending: true })
          .limit(pageSize);

        if (cursor) {
          query = query.gt("id", cursor);
        }

        query = isLost
          ? query.eq("alert_lost", true)
          : query.eq("alert_found", true);

        const {
          data: subscriptions,
          error: subscriptionError,
        } = await query;

        if (subscriptionError) {
          throw subscriptionError;
        }

        const rows = (subscriptions || []) as Subscription[];

        scanned += rows.length;

        if (rows.length) {
          cursor = rows[rows.length - 1].id;
        }

        for (let i = 0; i < rows.length; i += 10) {
          await Promise.all(
            rows.slice(i, i + 10).map(async (subscription) => {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: subscription.endpoint,
                    keys: {
                      p256dh: subscription.p256dh,
                      auth: subscription.auth,
                    },
                  },
                  payload,
                  {
                    TTL: 60 * 60 * 12,
                    urgency: "high",
                  }
                );

                sent++;
              } catch (error) {
                const code = (
                  error as { statusCode?: number }
                )?.statusCode;

                if (code === 404 || code === 410) {
                  const { error: deletionError } =
                    await supabase
                      .from("push_subscriptions")
                      .delete()
                      .eq("id", subscription.id);

                  if (!deletionError) {
                    removed++;
                  }
                } else {
                  failed++;
                  console.error(
                    "Erreur relance push :",
                    error
                  );
                }
              }
            })
          );
        }

        if (rows.length < pageSize) {
          break;
        }
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : "Erreur d'envoi";

      console.error(
        "Relance push interrompue :",
        error
      );
    }

    const { error: logError } = await supabase
      .from("signalement_push_relances")
      .update({
        sent_count: sent,
        failed_count: failed,
        removed_count: removed,
        scanned_count: scanned,
        error_message: lastError || null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", relanceId);

    if (logError) {
      console.error(
        "Historique relance non mis à jour :",
        logError
      );
    }

    if (lastError) {
      return fail(
        `Relance interrompue : ${lastError}. ${sent} push déjà acceptés ; ne réessayez pas immédiatement.`,
        500
      );
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      removed,
      scanned,
      relanceId,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/push/signalement/relance :",
      error
    );

    return fail(
      "Impossible de relancer les notifications. Vérifiez la migration SQL et les journaux serveur.",
      500
    );
  }
}
