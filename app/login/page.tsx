"use client";

import {
  Suspense,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "../lib/supabase";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

function LoginContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const redirectTo =
    searchParams.get(
      "redirect"
    );

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  /* =========================================================
     CONNEXION
  ========================================================= */

  async function login() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      if (
        !email.trim() ||
        !password.trim()
      ) {
        alert(
          "Merci de renseigner votre adresse email et votre mot de passe."
        );

        return;
      }

      /* =====================================================
         1. CONNEXION SUPABASE
      ===================================================== */

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              email.trim(),

            password,
          });

      if (authError) {
        throw authError;
      }

      const user =
        authData.user;

      if (!user) {
        throw new Error(
          "Utilisateur introuvable après connexion."
        );
      }

      /* =====================================================
         2. LIRE LE VRAI PROFIL
      ===================================================== */

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            `
              id,
              role,
              first_name,
              last_name,
              organization_name,
              is_active,
              approval_status
            `
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      /* =====================================================
         3. PROFIL ABSENT
      ===================================================== */

      if (!profile) {
        console.warn(
          "Profil absent pour :",
          user.id
        );

        router.replace(
          "/"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         4. COMPTE DÉSACTIVÉ
      ===================================================== */

      if (
        profile.is_active ===
        false
      ) {
        await supabase.auth
          .signOut();

        alert(
          "Ce compte est actuellement désactivé."
        );

        return;
      }

      /* =====================================================
         5. RÔLE
      ===================================================== */

      const role =
        String(
          profile.role ||
            ""
        )
          .trim()
          .toLowerCase();

      console.log(
        "Connexion Taui Te Ora :",
        {
          userId:
            user.id,

          role,

          redirectTo,
        }
      );

      /* =====================================================
         6. REDIRECTION SPÉCIALE
      =====================================================

         Si un utilisateur arrivait depuis :
         - une adoption
         - une fiche animal
         - les favoris
         - une autre page protégée

         on conserve cette destination.
      ===================================================== */

      const safeRedirect =
        redirectTo &&
        redirectTo.startsWith(
          "/"
        ) &&
        !redirectTo.startsWith(
          "//"
        )
          ? redirectTo
          : null;

      /* =====================================================
         7. ADMIN
      ===================================================== */

      if (
        role === "admin"
      ) {
        router.replace(
          safeRedirect ||
            "/admin/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         8. ASSOCIATION
      ===================================================== */

      if (
        role ===
        "association"
      ) {
        router.replace(
          safeRedirect ||
            "/association/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         9. REFUGE
      ===================================================== */

      if (
        role === "refuge"
      ) {
        router.replace(
          safeRedirect ||
            "/refuge/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         10. FOURRIÈRE / SIGFA
      ===================================================== */

      if (
        role ===
          "fourriere" ||
        role ===
          "sigfa"
      ) {
        router.replace(
          safeRedirect ||
            "/fourriere/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         11. BÉNÉVOLE
      ===================================================== */

      if (
        role ===
          "benevole" ||
        role ===
          "famille_accueil" ||
        role ===
          "famille_d_accueil"
      ) {
        router.replace(
          safeRedirect ||
            "/benevole/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         12. ADOPTANT
      =====================================================

         Connexion normale :
         → accueil /
         → swipe card

         Si redirect existe :
         → on respecte le redirect.
      ===================================================== */

      if (
        role ===
          "adoptant" ||
        role ===
          "utilisateur"
      ) {
        router.replace(
          safeRedirect ||
            "/"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         13. RÔLE INCONNU
      ===================================================== */

      console.warn(
        "Rôle inconnu :",
        role
      );

      router.replace(
        safeRedirect ||
          "/"
      );

      router.refresh();
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur connexion :",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la connexion.";

      alert(
        message
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     TOUCHE ENTRÉE
  ========================================================= */

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key ===
      "Enter"
    ) {
      void login();
    }
  }

  /* =========================================================
     DESIGN
  ========================================================= */

  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[#f8f4ec]
        p-4
        sm:p-8
      "
    >
      <Card
        className="
          w-full
          max-w-lg
          rounded-[32px]
          p-6
          sm:p-8
        "
      >
        {/* HEADER */}

        <div
          className="
            mb-8
            text-center
          "
        >
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="
              mx-auto
              mb-4
              h-24
              w-24
              object-contain
            "
          />

          <h1
            className="
              text-4xl
              font-black
              text-[#064b42]
            "
          >
            Connexion
          </h1>

          <p
            className="
              mt-2
              text-gray-500
            "
          >
            Connectez-vous à votre espace TAUI TE ORA
          </p>
        </div>

        <div
          className="
            space-y-5
          "
        >
          {/* EMAIL */}

          <div>
            <label
              htmlFor="email"
              className="
                mb-2
                block
                font-bold
                text-[#064b42]
              "
            >
              📧 Adresse email
            </label>

            <input
              id="email"
              className="input"
              type="email"
              placeholder="Votre adresse email"
              value={
                email
              }
              onChange={(
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              autoComplete="email"
              disabled={
                loading
              }
            />
          </div>

          {/* MOT DE PASSE */}

          <div>
            <label
              htmlFor="password"
              className="
                mb-2
                block
                font-bold
                text-[#064b42]
              "
            >
              🔒 Mot de passe
            </label>

            <input
              id="password"
              className="input"
              type="password"
              placeholder="Votre mot de passe"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event.target
                    .value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              autoComplete="current-password"
              disabled={
                loading
              }
            />

            <div
              className="
                mt-2
                text-right
              "
            >
              <Link
                href="/forgot-password"
                className="
                  text-sm
                  font-semibold
                  text-[#064b42]
                  hover:underline
                "
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {/* CONNEXION */}

          <Button
            onClick={
              login
            }
            className="
              mt-4
              w-full
            "
            disabled={
              loading
            }
          >
            {loading
              ? "Connexion..."
              : "Se connecter"}
          </Button>

          {/* VISITER SANS COMPTE */}

          <Link
            href="/"
            className="
              flex
              w-full
              items-center
              justify-center
              rounded-full
              border-2
              border-[#064b42]
              bg-white
              px-6
              py-3
              text-center
              font-black
              text-[#064b42]
              shadow-sm
              transition
              hover:bg-[#eef7f4]
              active:scale-[0.98]
            "
          >
            🐾 Voir les animaux sans se connecter
          </Link>

          {/* INSCRIPTION */}

          <div
            className="
              border-t
              pt-6
              text-center
            "
          >
            <p
              className="
                text-gray-500
              "
            >
              Vous n&apos;avez pas encore de compte ?
            </p>

            <Link
              href="/register"
              className="
                mt-3
                inline-block
                rounded-full
                bg-[#064b42]
                px-6
                py-3
                font-bold
                text-white
                transition
                hover:bg-[#0a6659]
              "
            >
              🐾 Créer un compte
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main
          className="
            flex
            min-h-screen
            items-center
            justify-center
            bg-[#f8f4ec]
            p-8
          "
        >
          <p
            className="
              font-bold
              text-[#064b42]
            "
          >
            Chargement...
          </p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}