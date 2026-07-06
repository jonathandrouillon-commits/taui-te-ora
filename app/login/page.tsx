"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { profileService } from "../services/profile.service";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = await profileService.getCurrentProfile();

      if (!profile) {
        router.push("/pending-approval");
        return;
      }

      if (
        profile.approval_status !== "approved" ||
        profile.is_active === false
      ) {
        router.push("/pending-approval");
        return;
      }

      if (profile.role === "admin") {
        router.push("/admin/dashboard");
        return;
      }

      if (profile.role === "association") {
        router.push("/association/dashboard");
        return;
      }

      if (profile.role === "refuge") {
        router.push("/refuge/dashboard");
        return;
      }

      router.push("/");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] p-8">
      <Card className="w-full max-w-lg space-y-5">
        <h1 className="text-4xl font-black text-[#064b42]">Connexion</h1>

        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button onClick={login} className="w-full">
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </Card>
    </main>
  );
}<div className="text-right mt-2">
  <a
    href="/forgot-password"
    className="text-sm font-semibold text-[#064b42] hover:underline"
  >
    Mot de passe oublié ?
  </a>
</div>