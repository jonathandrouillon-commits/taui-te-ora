"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    if (!password) {
      setErrorMessage(
        "Merci de saisir un nouveau mot de passe."
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "Les deux mots de passe ne correspondent pas."
      );
      return;
    }

    try {
      setLoading(true);

      const {
        error,
      } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setMessage(
        "Votre mot de passe a bien été modifié."
      );

      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error: unknown) {
      console.error(
        "Erreur mise à jour mot de passe :",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#064b42]">
            Nouveau mot de passe
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#746c64]">
            Choisissez votre nouveau mot de passe
            pour accéder à votre compte Taui Te Ora.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#064b42]">
              Nouveau mot de passe
            </span>

            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="••••••••"
              className="
                w-full
                rounded-2xl
                border
                border-[#ded4c5]
                bg-[#fffaf7]
                px-4
                py-3.5
                text-[#2f241c]
                outline-none
                transition
                focus:border-[#064b42]
                focus:ring-2
                focus:ring-[#064b42]/10
              "
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#064b42]">
              Confirmer le mot de passe
            </span>

            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="••••••••"
              className="
                w-full
                rounded-2xl
                border
                border-[#ded4c5]
                bg-[#fffaf7]
                px-4
                py-3.5
                text-[#2f241c]
                outline-none
                transition
                focus:border-[#064b42]
                focus:ring-2
                focus:ring-[#064b42]/10
              "
            />
          </label>

          {errorMessage && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-2xl
              bg-[#064b42]
              px-5
              py-4
              font-black
              text-white
              transition
              hover:opacity-90
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading
              ? "Modification..."
              : "Modifier mon mot de passe"}
          </button>
        </form>
      </div>
    </main>
  );
}