
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEIVA_ID = "55aae411-9476-412e-b8d4-6e0c54536347";

function fail(message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: message },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    const token = (
      request.headers.get("authorization") || ""
    ).replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return fail("Connexion requise.", 401);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!url || !key || !publicKey || !privateKey) {
      return fail("Configuration serveur incomplète.", 500);
    }

    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: auth, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !auth.user) {
      return fail("Session invalide.", 401);
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle();

    if (profileError) throw profileError;

    if (
      String(profile?.role || "").trim().toLowerCase() !==
      "admin"
    ) {
      return fail("Accès administrateur requis.", 403);
    }

    const input = (await request.json().catch(() => null)) as {
      endpoint?: string;
    } | null;

    const endpoint = String(input?.endpoint || "").trim();

    if (
      !endpoint.startsWith("https://") ||
      endpoint.length > 4096
    ) {
      return fail("Abonnement du téléphone invalide.", 400);
    }

    // L'abonnement doit appartenir au compte connecté.
    const { data: subscription, error: subError } =
      await supabase
        .from("push_subscriptions")
        .select("id,endpoint,p256dh,auth,user_id")
        .eq("endpoint", endpoint)
        .eq("user_id", auth.user.id)
        .maybeSingle();

    if (subError) throw subError;

    if (!subscription) {
      return fail(
        "Ce téléphone n'est pas enregistré sur votre compte. Réactivez ses notifications.",
        404
      );
    }

    const { data: signalement, error: signalementError } =
      await supabase
        .from("signalements")
        .select(
          "id,type_signalement,animal_name,animal_type,city,island,color,breed"
        )
        .eq("id", TEIVA_ID)
        .maybeSingle();

    if (signalementError) throw signalementError;

    if (!signalement) {
      return fail("Signalement Teiva introuvable.", 404);
    }

    const { data: medias, error: mediaError } =
      await supabase
        .from("signalement_medias")
        .select("file_url,file_type")
        .eq("signalement_id", TEIVA_ID)
        .order("created_at", { ascending: true })
        .limit(20);

    if (mediaError) throw mediaError;

    const photo = (medias || []).find(
      (media) =>
        String(media.file_type || "")
          .toLowerCase()
          .startsWith("image/") &&
        String(media.file_url || "")
          .startsWith("https://")
    );

    if (!photo?.file_url) {
      return fail(
        "Aucune photo publique disponible pour Teiva.",
        404
      );
    }

    const isLost =
      signalement.type_signalement === "Animal perdu";

    const name =
      signalement.animal_name ||
      signalement.animal_type ||
      "Animal";

    const title = isLost
      ? `🚨 ANIMAL PERDU — ${name}`
      : `🐾 ANIMAL TROUVÉ — ${name}`;

    const body = [
      name,
      signalement.city,
      signalement.island,
      [signalement.color, signalement.breed]
        .filter(Boolean)
        .join(", "),
    ]
      .filter(Boolean)
      .join(" • ");

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ||
        "mailto:contact@taui-te-ora.com",
      publicKey,
      privateKey
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title,
        body,
        image: photo.file_url,
        url: `/signalement/public/${TEIVA_ID}`,
        signalementId: TEIVA_ID,
        type: isLost ? "lost" : "found",
        tag: `test-prive-${TEIVA_ID}`,
      }),
      {
        TTL: 300,
        urgency: "high",
      }
    );

    return NextResponse.json({
      ok: true,
      message: "Notification de test acceptée par le service push.",
      target: "Abonnement du téléphone demandeur",
    });
  } catch (error) {
    console.error("Test push privé :", error);

    return fail(
      "Échec de l'envoi du test privé. Consultez les journaux serveur.",
      500
    );
  }
}
