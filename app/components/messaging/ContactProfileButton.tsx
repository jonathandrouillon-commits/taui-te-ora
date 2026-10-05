"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  MessageCircleMore,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../lib/supabase";

type ContactProfileButtonProps = {
  recipientId: string;
  recipientRole?: string | null;
  label?: string;
  className?: string;
};

function normalizeRole(
  value: unknown
) {
  const role =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  if (
    role === "utilisateur" ||
    role === "user"
  ) {
    return "adoptant";
  }

  return role;
}

export default function ContactProfileButton({
  recipientId,
  recipientRole,
  label =
    "Envoyer un message",
  className = "",
}: ContactProfileButtonProps) {
  const router =
    useRouter();

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState("");

  const [
    currentUserRole,
    setCurrentUserRole,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    opening,
    setOpening,
  ] = useState(false);

  useEffect(() => {
    let cancelled =
      false;

    async function loadCurrentProfile() {
      try {
        const {
          data: {
            user,
          },
        } =
          await supabase
            .auth
            .getUser();

        if (!user) {
          if (!cancelled) {
            setLoading(
              false
            );
          }

          return;
        }

        const {
          data:
            profile,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id, role"
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (
          !cancelled
        ) {
          setCurrentUserId(
            user.id
          );

          setCurrentUserRole(
            normalizeRole(
              profile?.role
            )
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void loadCurrentProfile();

    return () => {
      cancelled =
        true;
    };
  }, []);

  if (
    loading ||
    !currentUserId ||
    currentUserId ===
      recipientId
  ) {
    return null;
  }

  const normalizedRecipientRole =
    normalizeRole(
      recipientRole
    );

  /*
   * Même règle côté interface :
   * adoptant <-> adoptant = aucun bouton.
   */
  if (
    currentUserRole ===
      "adoptant" &&
    normalizedRecipientRole ===
      "adoptant"
  ) {
    return null;
  }

  async function openConversation() {
    try {
      setOpening(
        true
      );

      const {
        data: {
          session,
        },
      } =
        await supabase
          .auth
          .getSession();

      const token =
        session?.access_token ||
        "";

      if (!token) {
        router.push(
          `/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`
        );

        return;
      }

      const response =
        await fetch(
          "/api/messages/start",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body:
              JSON.stringify({
                recipientId,
              }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          url?: string;
          error?: string;
        };

      if (
        !response.ok ||
        !data.ok ||
        !data.url
      ) {
        throw new Error(
          data.error ||
            "Impossible d'ouvrir la conversation."
        );
      }

      router.push(
        data.url
      );
    } catch (
      error
    ) {
      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible d'ouvrir la conversation."
      );
    } finally {
      setOpening(
        false
      );
    }
  }

  return (
    <button
      type="button"
      onClick={() =>
        void openConversation()
      }
      disabled={
        opening
      }
      className={[
        "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#07594f] px-5 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#064b42] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
    >
      <MessageCircleMore
        size={18}
      />

      {opening
        ? "Ouverture..."
        : label}
    </button>
  );
}
