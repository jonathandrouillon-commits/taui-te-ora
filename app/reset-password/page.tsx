"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [validSession, setValidSession] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function initializeRecovery() {
      try {
        /*
         * Avec le lien de récupération Supabase,
         * les informations de session peuvent arriver
         * dans le hash de l'URL.
         *
         * Le client Supabase du navigateur récupère
         * normalement automatiquement cette session.
         */

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          mounted &&
          session
        ) {
          setValidSession(true);
          setCheckingSession(false);
          return;
        }

        /*
         * On écoute également PASSWORD_RECOVERY.
         * C'est l'événement envoyé par Supabase
         * lorsqu'un lien "mot de passe oublié"
         * vient d'être utilisé.
         */

        const {
          data: {
            subscription,
          },
        } =
          supabase.auth.onAuthStateChange(
            (
              event,
              session
            ) => {
              if (
                !mounted
              ) {
                return;
              }

              if (
                event ===
                  "PASSWORD_RECOVERY" ||
                (
                  event ===
                    "SIGNED_IN" &&
                  session
                )
              ) {
                setValidSession(true);
                setCheckingSession(false);
              }
            }
          );

        /*
         * On laisse quelques instants au client
         * Supabase pour traiter le hash de l'URL.
         */

        window.setTimeout(
          async () => {
            if (
              !mounted
            ) {
              return;
            }

            const {
              data: {
                session:
                  refreshedSession,
              },
            } =
              await supabase.auth.getSession();

            if (
              refreshedSession
            ) {
              setValidSession(true);
            }

            setCheckingSession(false);
          },
          1200
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (
        caught
      ) {
        console.error(
          "Erreur récupération session :",
          caught
        );

        if (
          mounted
        ) {
          setCheckingSession(false);
        }
      }
    }

    const cleanupPromise =
      initializeRecovery();

    return () => {
      mounted = false;

      void cleanupPromise.then(
        (
          cleanup
        ) => {
          if (
            typeof cleanup ===
            "function"
          ) {
            cleanup();
          }
        }
      );
    };
  }, []);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      loading
    ) {
      return;
    }

    setError("");
    setSuccess("");

    if (
      !password
    ) {
      setError(
        "Veuillez saisir votre nouveau mot de passe."
      );

      return;
    }

    if (
      password.length <
      8
    ) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Les deux mots de passe ne sont pas identiques."
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data: {
          session,
        },
        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError
      ) {
        throw sessionError;
      }

      if (
        !session
      ) {
        throw new Error(
          "Le lien de réinitialisation n'est plus valide. Veuillez demander un nouveau lien."
        );
      }

      const {
        error:
          updateError,
      } =
        await supabase.auth.updateUser({
          password,
        });

      if (
        updateError
      ) {
        throw updateError;
      }

      setSuccess(
        "Votre mot de passe a bien été modifié."
      );

      setPassword("");
      setConfirmPassword("");

      /*
       * On ferme la session temporaire
       * créée par le lien de récupération.
       */

      await supabase.auth.signOut();

      window.setTimeout(
        () => {
          router.replace(
            "/login"
          );
        },
        1800
      );
    } catch (
      caught
    ) {
      console.error(
        "Erreur modification mot de passe :",
        caught
      );

      const message =
        caught instanceof Error
          ? caught.message
          : "Impossible de modifier le mot de passe.";

      setError(
        message
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    checkingSession
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] px-4">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="mx-auto mb-5 h-24 w-24 object-contain"
          />

          <p className="font-black text-[#064b42]">
            Vérification du lien...
          </p>
        </div>
      </main>
    );
  }

  if (
    !validSession
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] px-4 py-12">
        <section className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-xl">
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="mx-auto mb-5 h-24 w-24 object-contain"
          />

          <div className="text-5xl">
            🔐
          </div>

          <h1 className="mt-5 text-3xl font-black text-[#064b42]">
            Lien invalide
          </h1>

          <p className="mt-4 leading-relaxed text-gray-600">
            Ce lien de
            réinitialisation est
            invalide ou a expiré.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Demandez simplement
            un nouveau lien depuis
            la page de connexion.
          </p>

          <Link
            href="/forgot-password"
            className="mt-7 block w-full rounded-full bg-[#064b42] px-6 py-4 font-black text-white transition hover:bg-[#0a6659]"
          >
            Recevoir un nouveau lien
          </Link>

          <Link
            href="/login"
            className="mt-3 block w-full rounded-full border-2 border-[#064b42] px-6 py-4 font-black text-[#064b42]"
          >
            Retour à la connexion
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] px-4 py-12">
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-xl">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="mx-auto mb-4 h-24 w-24 object-contain"
          />

          <div className="text-4xl">
            🔐
          </div>

          <h1 className="mt-4 text-3xl font-black text-[#064b42]">
            Nouveau mot de passe
          </h1>

          <p className="mt-3 text-gray-500">
            Choisissez votre
            nouveau mot de passe
            TAUI TE ORA.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-bold text-[#064b42]"
            >
              Nouveau mot de passe
            </label>

            <input
              id="password"
              type="password"
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
              autoComplete="new-password"
              placeholder="Minimum 8 caractères"
              disabled={
                loading
              }
              className="w-full rounded-2xl border-2 border-[#e8dfd2] bg-white px-5 py-4 text-[#064b42] outline-none transition focus:border-[#064b42]"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block font-bold text-[#064b42]"
            >
              Confirmer le mot de passe
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={
                confirmPassword
              }
              onChange={(
                event
              ) =>
                setConfirmPassword(
                  event.target
                    .value
                )
              }
              autoComplete="new-password"
              placeholder="Retapez votre mot de passe"
              disabled={
                loading
              }
              className="w-full rounded-2xl border-2 border-[#e8dfd2] bg-white px-5 py-4 text-[#064b42] outline-none transition focus:border-[#064b42]"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
              ✓ {success}
              <br />
              Redirection vers
              la connexion...
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              Boolean(
                success
              )
            }
            className="w-full rounded-full bg-[#064b42] px-6 py-4 font-black text-white shadow-sm transition hover:bg-[#0a6659] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Modification..."
              : "Modifier mon mot de passe"}
          </button>

          <Link
            href="/login"
            className="block text-center text-sm font-bold text-[#064b42] hover:underline"
          >
            Retour à la connexion
          </Link>
        </form>
      </section>
    </main>
  );
}