"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, Send } from "lucide-react";
import { supabase } from "../lib/supabase";

const categories = [
  { value: "bug", label: "Bug / problème technique" },
  { value: "fiche", label: "Erreur dans une fiche" },
  { value: "compte", label: "Problème avec mon compte" },
  { value: "adoption", label: "Problème concernant une adoption" },
  { value: "signalement", label: "Problème avec un signalement" },
  { value: "suggestion", label: "Suggestion" },
  { value: "autre", label: "Autre" },
];

export default function SupportButton() {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [category, setCategory] = useState("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadUser();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id || null);
    } catch (error) {
      console.error("Erreur utilisateur support :", error);
    }
  }

  function closeModal() {
    if (sending) {
      return;
    }

    setOpen(false);
    setSuccess(false);
    setErrorMessage("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!userId) {
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setErrorMessage(
        "Merci de renseigner le sujet et de décrire le problème."
      );
      return;
    }

    try {
      setSending(true);
      setErrorMessage("");

      const pageUrl =
        typeof window !== "undefined"
          ? window.location.pathname
          : null;

      const {
        data: ticket,
        error,
      } = await supabase
        .from("support_tickets")
        .insert({
          user_id: userId,
          category,
          subject: subject.trim(),
          message: message.trim(),
          status: "nouveau",
          priority: "normale",
          page_url: pageUrl,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      const {
        error: messageError,
      } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticket.id,
          sender_id: userId,
          message: message.trim(),
        });

      if (messageError) {
        console.error(
          "Erreur création premier message support :",
          messageError
        );
      }

      setSuccess(true);
      setSubject("");
      setMessage("");
      setCategory("bug");
    } catch (error: any) {
      console.error("Erreur support :", error);

      setErrorMessage(
        error?.message ||
          "Impossible d'envoyer votre demande."
      );
    } finally {
      setSending(false);
    }
  }

  if (!userId) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSuccess(false);
          setErrorMessage("");
          setOpen(true);
        }}
        className="
          fixed
          bottom-[92px]
          right-4
          z-[300]
          flex
          items-center
          gap-2
          rounded-full
          border
          border-[#eadfd8]
          bg-white/95
          px-4
          py-3
          text-xs
          font-black
          text-[#064b42]
          shadow-lg
          backdrop-blur-md
          transition
          hover:bg-white
          active:scale-[0.97]
        "
      >
        <AlertTriangle
          size={17}
          className="text-[#e68a47]"
        />

        Signaler un problème
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fermer"
            onClick={closeModal}
            className="absolute inset-0"
          />

          <div className="relative z-10 w-full max-w-lg rounded-[30px] bg-[#fffaf7] p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="
                absolute
                right-4
                top-4
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-white
                text-[#064b42]
                shadow
              "
            >
              <X size={19} />
            </button>

            <div className="pr-12">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
                Assistance
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                Signaler un problème
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Votre message sera transmis directement à
                l'administration de Taui Te Ora.
              </p>
            </div>

            {success ? (
              <div className="mt-7">
                <div className="rounded-[24px] bg-[#e8f5ef] p-6 text-center">
                  <div className="text-4xl">
                    ✓
                  </div>

                  <h3 className="mt-3 text-xl font-black text-[#064b42]">
                    Message envoyé
                  </h3>

                  <p className="mt-2 text-sm text-[#557067]">
                    Votre demande a bien été transmise à
                    l'administration.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="
                    mt-5
                    w-full
                    rounded-full
                    bg-[#064b42]
                    px-5
                    py-3
                    font-black
                    text-white
                  "
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-black text-[#064b42]">
                    Type de problème
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-[#eadfd8]
                      bg-white
                      px-4
                      py-3
                      outline-none
                      focus:border-[#df8995]
                    "
                  >
                    {categories.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#064b42]">
                    Sujet
                  </label>

                  <input
                    type="text"
                    value={subject}
                    onChange={(event) =>
                      setSubject(event.target.value)
                    }
                    placeholder="Ex. Impossible de modifier mon profil"
                    maxLength={150}
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-[#eadfd8]
                      bg-white
                      px-4
                      py-3
                      outline-none
                      focus:border-[#df8995]
                    "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#064b42]">
                    Expliquez le problème
                  </label>

                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    placeholder="Décrivez ce qui s'est passé..."
                    rows={6}
                    maxLength={3000}
                    className="
                      w-full
                      resize-none
                      rounded-2xl
                      border
                      border-[#eadfd8]
                      bg-white
                      px-4
                      py-3
                      outline-none
                      focus:border-[#df8995]
                    "
                  />
                </div>

                <div className="rounded-2xl bg-[#f4efe8] px-4 py-3 text-xs text-gray-500">
                  La page depuis laquelle vous envoyez le
                  signalement sera enregistrée automatiquement.
                </div>

                {errorMessage && (
                  <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    bg-[#064b42]
                    px-5
                    py-3.5
                    font-black
                    text-white
                    shadow
                    transition
                    hover:bg-[#08695d]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <Send size={18} />

                  {sending
                    ? "Envoi..."
                    : "Envoyer à l'administration"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}