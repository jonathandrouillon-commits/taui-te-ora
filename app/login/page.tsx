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

         profiles.role devient la référence principale.
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
          "/dashboard"
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

         On prend profiles.role,
         PAS user_metadata.role.
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
         6. ADMIN
      ===================================================== */

      if (
        role === "admin"
      ) {
        router.replace(
          "/admin/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         7. ASSOCIATION
      ===================================================== */

      if (
        role ===
        "association"
      ) {
        router.replace(
          "/association/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         8. REFUGE / SIGFA
      ===================================================== */

      if (
        role === "refuge"
      ) {
        router.replace(
          "/refuge/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         9. FOURRIÈRE
      ===================================================== */

      if (
        role ===
        "fourriere"
      ) {
        router.replace(
          "/fourriere/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         10. BÉNÉVOLE
      ===================================================== */

      if (
        role ===
        "benevole"
      ) {
        router.replace(
          "/benevole/dashboard"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         11. ADOPTANT

         SEUL l'adoptant peut utiliser
         un redirect provenant par exemple de :

         /adoption/start/UUID
         /animal/UUID
         /favorites
      ===================================================== */

      if (
        role ===
        "adoptant"
      ) {
        if (
          redirectTo &&
          redirectTo.startsWith(
            "/"
          ) &&
          !redirectTo.startsWith(
            "//"
          )
        ) {
          router.replace(
            redirectTo
          );

          router.refresh();

          return;
        }

        router.replace(
          "/profile"
        );

        router.refresh();

        return;
      }

      /* =====================================================
         12. RÔLE INCONNU
      ===================================================== */

      console.warn(
        "Rôle inconnu :",
        role
      );

      router.replace(
        "/dashboard"
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
      login();
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