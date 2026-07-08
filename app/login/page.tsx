"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { profileService } from "../services/profile.service";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

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

      if (
        profile.approval_status !== "approved" ||
        profile.is_active === false
      ) {
        router.push("/pending-approval");
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      switch (profile.role) {
        case "admin":
          router.push("/admin/dashboard");
          return;
        case "association":
          router.push("/association/dashboard");
          return;
        case "refuge":
          router.push("/refuge/dashboard");
          return;
        case "adoptant":
          router.push("/dashboard");
          return;
        default:
          router.push("/dashboard");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] p-8">
      <Card className="w-full max-w-lg rounded-[32px] p-8">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="mx-auto mb-4 h-24 w-24"
          />

          <h1 className="text-4xl font-black text-[#064b42]">Connexion</h1>

          <p className="mt-2 text-gray-500">
            Connectez-vous à votre espace TAUI TE ORA
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-bold text-[#064b42]">
              📧 Adresse email
            </label>

            <input
              className="input"
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block font-bold text-[#064b42]">
              🔒 Mot de passe
            </label>

            <input
              className="input"
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-[#064b42] hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <Button onClick={login} className="mt-4 w-full">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <div className="border-t pt-6 text-center">
            <p className="text-gray-500">
              Vous n'avez pas encore de compte ?
            </p>

            <Link
              href="/register"
              className="mt-3 inline-block rounded-full bg-[#064b42] px-6 py-3 font-bold text-white transition hover:bg-[#0a6659]"
            >
              🐾 Créer un compte
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] p-8">
          Chargement...
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}