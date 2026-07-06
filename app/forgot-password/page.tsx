"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendResetEmail() {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://www.taui-te-ora.com/update-password",
      });

      if (error) throw error;

      alert("Un email de réinitialisation a été envoyé.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] p-8">
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="mx-auto mb-4 h-24 w-24 object-contain"
          />

          <h1 className="text-4xl font-black text-[#064b42]">
            Mot de passe oublié
          </h1>

          <p className="mt-3 text-gray-500">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <input
          className="input"
          type="email"
          placeholder="Votre adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendResetEmail}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#064b42] py-4 font-black text-white disabled:opacity-60"
        >
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>

        <Link
          href="/login"
          className="mt-5 block text-center text-sm font-bold text-[#064b42] hover:underline"
        >
          Retour connexion
        </Link>
      </section>
    </main>
  );
}