"use client";

import { useRouter } from "next/navigation";
import LostFoundPushPreferences from "../../components/LostFoundPushPreferences";

export default function NotificationSetupPage() {
  const router = useRouter();
  function continueToApp() {
    const requested = new URLSearchParams(window.location.search).get("next") || "/";
    router.replace(requested.startsWith("/") && !requested.startsWith("//") ? requested : "/");
  }
  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42]">
      <section className="mx-auto max-w-2xl">
        <div className="rounded-[32px] bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-widest text-[#d96b4c]">Compte créé</p>
          <h1 className="mt-2 text-3xl font-black">Restez informé</h1>
          <p className="mx-auto mt-3 max-w-xl text-[#6f5a47]">Choisissez maintenant les alertes que vous souhaitez recevoir. Vous pourrez modifier ce choix plus tard.</p>
        </div>
        <LostFoundPushPreferences />
        <button type="button" onClick={continueToApp} className="mt-5 w-full rounded-full bg-[#064b42] px-6 py-3.5 font-black text-white shadow">Continuer vers Taui Te Ora</button>
      </section>
    </main>
  );
}
