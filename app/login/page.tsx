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
    if (loading) return;

    try {
      setLoading(true);

      if (!email.trim() || !password.trim()) {
        alert("Merci de renseigner votre adresse email et votre mot de passe.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      const profile = await profileService.getCurrentProfile();

      if (!profile) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (redirectTo && redirectTo.startsWith("/")) {
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      switch (profile.role) {
        case "admin":
          router.replace("/admin/dashboard");
          break;

        case "association":
          router.replace("/association/dashboard");
          break;

        case "refuge":
          router.replace("/refuge/dashboard");
          break;

        case "adoptant":
          router.replace("/dashboard");
          break;

        default:
          router.replace("/dashboard");
          break;
      }

      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la connexion.";

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      login();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] p-4 sm:p-8">
      <Card className="w-full max-w-lg rounded-[32px] p-6 sm:p-8">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="mx-auto mb-4 h-24 w-24 object-contain"
          />

          <h1 className="text-4xl font-black text-[#064b42]">
            Connexion
          </h1>

          <p className="mt-2 text-gray-500">
            Connectez-vous à votre espace TAUI TE ORA
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-bold text-[#064b42]"
            >
              📧 Adresse email
            </label>

            <input
              id="email"
              className="input"
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-bold text-[#064b42]"
            >
              🔒 Mot de passe
            </label>

            <input
              id="password"
              className="input"
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              disabled={loading}
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

          <Button
            onClick={login}
            className="mt-4 w-full"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <div className="border-t pt-6 text-center">
            <p className="text-gray-500">
              Vous n&apos;avez pas encore de compte ?
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
          <p className="font-bold text-[#064b42]">Chargement...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}