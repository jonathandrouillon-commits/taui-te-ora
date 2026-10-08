
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function getSafeRedirect(value: string | null): string | null {
    if (!value) return null;

    // Autoriser uniquement les chemins internes.
    if (!value.startsWith("/") || value.startsWith("//")) {
      return null;
    }

    if (value.includes("\\") || /[\r\n]/.test(value)) {
      return null;
    }

    // Éviter de retourner vers la page de connexion.
    if (value === "/login" || value.startsWith("/login?")) {
      return null;
    }

    return value;
  }

  async function login() {
    if (loading) return;

    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage(
        "Merci de renseigner votre adresse email et votre mot de passe."
      );
      return;
    }

    try {
      setLoading(true);

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) throw authError;

      const user = authData.user;

      if (!user) {
        throw new Error(
          "Utilisateur introuvable après connexion."
        );
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, role, is_active, approval_status")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.is_active === false) {
        await supabase.auth.signOut();
        setErrorMessage(
          "Ce compte est actuellement désactivé."
        );
        return;
      }

      // Conserver la destination d'une action en cours.
      // Sinon, TOUS les profils arrivent au menu principal.
      const destination = getSafeRedirect(redirectTo) || "/";

      router.replace(destination);
      router.refresh();
    } catch (error: unknown) {
      console.error("Erreur connexion :", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la connexion."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      void login();
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
            Connectez-vous à TAUI TE ORA pour retrouver
            vos compagnons et accéder à toutes les fonctionnalités.
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

          {errorMessage && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <Button
            onClick={login}
            className="mt-4 w-full"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-full border-2 border-[#064b42] bg-white px-6 py-3 text-center font-black text-[#064b42] shadow-sm transition hover:bg-[#eef7f4] active:scale-[0.98]"
          >
            🐾 Découvrir TAUI TE ORA sans compte
          </Link>

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
          <p className="font-bold text-[#064b42]">
            Chargement...
          </p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
