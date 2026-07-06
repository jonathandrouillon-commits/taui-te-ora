"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      alert("Mot de passe modifié.");
      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] p-8">
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-xl">
        <h1 className="text-4xl font-black text-[#064b42]">
          Nouveau mot de passe
        </h1>

        <input
          className="input mt-6"
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={updatePassword}
          className="mt-6 w-full rounded-full bg-[#064b42] py-4 font-black text-white"
        >
          {loading ? "Modification..." : "Modifier le mot de passe"}
        </button>
      </section>
    </main>
  );
}