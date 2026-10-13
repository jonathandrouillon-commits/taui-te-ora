
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function TestPushPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function sendTest() {
    if (loading) return;

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        throw new Error(
          "Les notifications ne sont pas disponibles sur cet appareil."
        );
      }

      if (Notification.permission !== "granted") {
        throw new Error(
          "Autorise d'abord les notifications sur ton Android."
        );
      }

      const registration =
        await navigator.serviceWorker.ready;

      const subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        throw new Error(
          "Aucun abonnement push trouvé sur ce téléphone."
        );
      }

      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !data.session?.access_token) {
        throw new Error(
          "Connecte-toi à ton compte administrateur."
        );
      }

      const response = await fetch(
        "/api/admin/push/test-prive",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Erreur lors du test."
        );
      }

      setMessage(
        "Notification envoyée au service push. Vérifie ton Android."
      );
    } catch (caught) {
      setError(true);
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Erreur inconnue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-10 text-[#064b42]">
      <section className="mx-auto max-w-xl rounded-[28px] bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-widest text-[#d96b4c]">
          Administration
        </p>

        <h1 className="mt-3 text-2xl font-black">
          Test privé des notifications
        </h1>

        <p className="mt-4 text-sm leading-6 text-[#6f5a47]">
          Ce test utilise le signalement de Teiva.
          Il envoie une notification uniquement à
          l'abonnement push de cet appareil.
          Aucune alerte communautaire ne sera déclenchée.
        </p>

        <button
          type="button"
          onClick={sendTest}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#064b42] px-6 py-4 font-black text-white disabled:opacity-50"
        >
          {loading
            ? "Envoi en cours..."
            : "🔔 Tester ma notification"}
        </button>

        {message && (
          <p
            role="status"
            className={`mt-5 rounded-2xl px-4 py-4 text-sm font-semibold ${
              error
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-800"
            }`}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
