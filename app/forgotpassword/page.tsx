"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function resetPassword() {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:3000/update-password",
      });

      if (error) throw error;

      alert("Un e-mail de réinitialisation a été envoyé.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <h1 className="text-4xl font-black text-[#064b42]">
          Mot de passe oublié
        </h1>

        <p className="mt-3 text-gray-500">
          Entrez votre adresse e-mail.
        </p>

        <input
          className="mt-6 w-full rounded-xl border p-4"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={resetPassword}
          className="mt-6 w-full rounded-xl bg-[#064b42] py-4 font-black text-white"
        >
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>

      </div>
    </main>
  );
}