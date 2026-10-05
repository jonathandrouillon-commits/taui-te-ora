"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Mail,
  MessageCircleMore,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../lib/supabase";

type RoleOption = {
  value: string;
  label: string;
  emoji: string;
  description: string;
};

type RecipientProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  role: string | null;
};

type ApiResponse = {
  ok: boolean;
  count?: number;
  recipients?: number;
  notifications_created?: number;
  pushes_sent?: number;
  pushes_failed?: number;
  emails_sent?: number;
  emails_failed?: number;
  profiles?: RecipientProfile[];
  error?: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "adoptant",
    label: "Adoptants",
    emoji: "💛",
    description:
      "Utilisateurs et familles adoptantes",
  },
  {
    value: "association",
    label: "Associations",
    emoji: "🤝",
    description:
      "Associations de protection animale",
  },
  {
    value: "refuge",
    label: "Refuges / SIGFA",
    emoji: "🏡",
    description:
      "Refuges et structures d'accueil",
  },
  {
    value: "fourriere",
    label: "Fourrières",
    emoji: "🐾",
    description:
      "Services et fourrières",
  },
  {
    value: "benevole",
    label: "Bénévoles",
    emoji: "🙋",
    description:
      "Membres bénévoles inscrits",
  },
  {
    value: "famille_accueil",
    label: "Familles d'accueil",
    emoji: "🏠",
    description:
      "Familles d'accueil actives",
  },
  {
    value: "famille_d_accueil",
    label: "Familles d'accueil",
    emoji: "🌺",
    description:
      "Ancien format de profil",
  },
  {
    value: "admin",
    label: "Administrateurs",
    emoji: "⚙️",
    description:
      "Équipe d'administration",
  },
];

function getProfileName(
  profile: RecipientProfile
) {
  if (
    profile.organization_name
  ) {
    return profile.organization_name;
  }

  const fullName =
    `${profile.first_name || ""} ${
      profile.last_name || ""
    }`.trim();

  if (fullName) {
    return fullName;
  }

  return profile.email ||
    "Profil Taui Te Ora";
}

export default function AdminCommunicationsPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    profilesLoading,
    setProfilesLoading,
  ] = useState(false);

  const [
    selectedRoles,
    setSelectedRoles,
  ] = useState<string[]>(
    []
  );

  const [
    selectionMode,
    setSelectionMode,
  ] = useState<
    "all" | "selected"
  >("all");

  const [
    profiles,
    setProfiles,
  ] = useState<
    RecipientProfile[]
  >([]);

  const [
    selectedRecipientIds,
    setSelectedRecipientIds,
  ] = useState<
    string[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    sendNotification,
    setSendNotification,
  ] = useState(true);

  const [
    sendEmail,
    setSendEmail,
  ] = useState(false);

  const [
    recipientCount,
    setRecipientCount,
  ] = useState<
    number | null
  >(null);

  const [
    lastResult,
    setLastResult,
  ] = useState<
    ApiResponse | null
  >(null);

  const allSelected =
    selectedRoles.length ===
    ROLE_OPTIONS.length;

  const selectedLabels =
    useMemo(
      () =>
        ROLE_OPTIONS
          .filter(
            (option) =>
              selectedRoles.includes(
                option.value
              )
          )
          .map(
            (option) =>
              option.label
          ),
      [
        selectedRoles,
      ]
    );

  const filteredProfiles =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return profiles;
      }

      return profiles.filter(
        (profile) => {
          const haystack =
            [
              profile.organization_name,
              profile.first_name,
              profile.last_name,
              profile.email,
              profile.role,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return haystack.includes(
            query
          );
        }
      );
    }, [
      profiles,
      search,
    ]);

  const allVisibleSelected =
    filteredProfiles.length >
      0 &&
    filteredProfiles.every(
      (profile) =>
        selectedRecipientIds.includes(
          profile.id
        )
    );

  const canSend =
    title.trim().length >
      0 &&
    message.trim().length >
      0 &&
    selectedRoles.length >
      0 &&
    (
      selectionMode ===
        "all" ||
      selectedRecipientIds
        .length > 0
    ) &&
    (
      sendNotification ||
      sendEmail
    ) &&
    !sending;

  useEffect(() => {
    let cancelled =
      false;

    async function verifyAdmin() {
      try {
        const {
          data: {
            user,
          },
          error:
            authError,
        } =
          await supabase
            .auth
            .getUser();

        if (
          authError ||
          !user
        ) {
          router.replace(
            "/login?redirect=/admin/communications"
          );

          return;
        }

        const {
          data:
            profile,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id, role, is_active"
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (
          profileError
        ) {
          throw profileError;
        }

        const role =
          String(
            profile?.role ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          role !==
            "admin" ||
          profile?.is_active ===
            false
        ) {
          router.replace(
            "/"
          );

          return;
        }

        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Erreur accès communications :",
          error
        );

        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void verifyAdmin();

    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);

  useEffect(() => {
    setRecipientCount(
      null
    );

    setLastResult(
      null
    );

    setSelectedRecipientIds(
      []
    );

    setSearch("");

    if (
      selectedRoles.length ===
      0
    ) {
      setProfiles([]);
      return;
    }

    void loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedRoles,
  ]);

  useEffect(() => {
    setRecipientCount(
      selectionMode ===
        "selected"
        ? selectedRecipientIds
            .length
        : null
    );
  }, [
    selectionMode,
    selectedRecipientIds,
  ]);

  function toggleRole(
    role: string
  ) {
    setSelectedRoles(
      (current) =>
        current.includes(
          role
        )
          ? current.filter(
              (value) =>
                value !==
                role
            )
          : [
              ...current,
              role,
            ]
    );
  }

  function toggleAll() {
    setSelectedRoles(
      allSelected
        ? []
        : ROLE_OPTIONS.map(
            (option) =>
              option.value
          )
    );
  }

  async function getAccessToken() {
    const {
      data: {
        session,
      },
    } =
      await supabase
        .auth
        .getSession();

    return (
      session
        ?.access_token ||
      ""
    );
  }

  async function loadProfiles() {
    if (
      selectedRoles.length ===
      0
    ) {
      setProfiles([]);
      return;
    }

    try {
      setProfilesLoading(
        true
      );

      const token =
        await getAccessToken();

      if (!token) {
        throw new Error(
          "Session expirée."
        );
      }

      const response =
        await fetch(
          "/api/admin/broadcast",
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
              JSON.stringify(
                {
                  action:
                    "profiles",
                  roles:
                    selectedRoles,
                }
              ),
          }
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
            "Impossible de charger les profils."
        );
      }

      setProfiles(
        data.profiles ||
          []
      );
    } catch (
      error
    ) {
      console.error(
        "Erreur chargement profils :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Erreur."
      );

      setProfiles([]);
    } finally {
      setProfilesLoading(
        false
      );
    }
  }

  function toggleRecipient(
    id: string
  ) {
    setSelectedRecipientIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (value) =>
                value !== id
            )
          : [
              ...current,
              id,
            ]
    );
  }

  function toggleVisibleRecipients() {
    const visibleIds =
      filteredProfiles.map(
        (profile) =>
          profile.id
      );

    if (
      allVisibleSelected
    ) {
      setSelectedRecipientIds(
        (current) =>
          current.filter(
            (id) =>
              !visibleIds.includes(
                id
              )
          )
      );

      return;
    }

    setSelectedRecipientIds(
      (current) =>
        Array.from(
          new Set([
            ...current,
            ...visibleIds,
          ])
        )
    );
  }

  async function previewRecipients() {
    if (
      selectedRoles.length ===
      0
    ) {
      return;
    }

    try {
      const token =
        await getAccessToken();

      if (!token) {
        throw new Error(
          "Session expirée."
        );
      }

      const response =
        await fetch(
          "/api/admin/broadcast",
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
              JSON.stringify(
                {
                  action:
                    "preview",
                  roles:
                    selectedRoles,
                  recipient_ids:
                    selectionMode ===
                    "selected"
                      ? selectedRecipientIds
                      : undefined,
                }
              ),
          }
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
            "Impossible de compter les destinataires."
        );
      }

      setRecipientCount(
        Number(
          data.count ||
            0
        )
      );
    } catch (
      error
    ) {
      alert(
        error instanceof
          Error
          ? error.message
          : "Erreur."
      );
    }
  }

  async function sendBroadcast() {
    if (!canSend) {
      return;
    }

    const countText =
      recipientCount !==
      null
        ? ` à ${recipientCount} profil(s)`
        : "";

    if (
      !window.confirm(
        `Envoyer cette communication${countText} ?`
      )
    ) {
      return;
    }

    try {
      setSending(true);
      setLastResult(
        null
      );

      const token =
        await getAccessToken();

      if (!token) {
        throw new Error(
          "Session expirée."
        );
      }

      const response =
        await fetch(
          "/api/admin/broadcast",
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
              JSON.stringify(
                {
                  action:
                    "send",
                  roles:
                    selectedRoles,
                  recipient_ids:
                    selectionMode ===
                    "selected"
                      ? selectedRecipientIds
                      : undefined,
                  title:
                    title.trim(),
                  message:
                    message.trim(),
                  channels: {
                    notification:
                      sendNotification,
                    email:
                      sendEmail,
                  },
                }
              ),
          }
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
            "Impossible d'envoyer la communication."
        );
      }

      setLastResult(
        data
      );

      setRecipientCount(
        Number(
          data.recipients ||
            0
        )
      );

      alert(
        "Communication envoyée."
      );
    } catch (
      error
    ) {
      alert(
        error instanceof
          Error
          ? error.message
          : "Erreur lors de l'envoi."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f1e8] px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-[#eaded1] bg-[#fffaf4] p-8 text-center shadow-[0_16px_50px_rgba(52,43,35,.07)]">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-[#dfeee8]" />
          <p className="font-black text-[#07594f]">
            Chargement du centre de communication…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f1e8_0%,#fbf8f2_48%,#f3eee7_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/dashboard"
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-[#ddd1c5] bg-[#fffaf4]/90 px-4 py-2.5 text-sm font-black text-[#07594f] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ArrowLeft size={17} />
            Centre de pilotage
          </button>

          <div className="rounded-full border border-[#efdfd4] bg-[#fff4ed] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#d86f5c]">
            Administration Taui Te Ora
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[36px] border border-[#0f675d]/10 bg-[#07594f] px-6 py-7 text-white shadow-[0_24px_70px_rgba(7,89,79,.18)] sm:px-8 sm:py-9">
          <div className="absolute -right-8 -top-14 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 right-20 h-56 w-56 rounded-full bg-[#ef907d]/10" />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
                <Sparkles size={14} />
                Centre de communication
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Parler à la bonne communauté,
                <span className="block text-[#ffd4cb]">
                  précisément.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Envoie à tout un groupe, à une seule personne ou à plusieurs profils choisis.
              </p>
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-black">
                  {selectedRoles.length}
                </div>
                <div className="mt-1 text-xs font-bold text-white/65">
                  groupes sélectionnés
                </div>
              </div>

              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-black">
                  {selectionMode ===
                  "selected"
                    ? selectedRecipientIds.length
                    : recipientCount ??
                      "—"}
                </div>
                <div className="mt-1 text-xs font-bold text-white/65">
                  destinataires
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-6">
            <section className="rounded-[30px] border border-[#e8ddd2] bg-[#fffaf4] p-5 shadow-[0_16px_45px_rgba(73,58,43,.06)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d86f5c]">
                    Étape 1
                  </div>
                  <h2 className="mt-1 text-xl font-black text-[#2f2b27]">
                    À qui veux-tu parler ?
                  </h2>
                  <p className="mt-1 text-sm text-[#7f746b]">
                    Sélectionne d'abord le type de profils.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    toggleAll
                  }
                  className="rounded-full bg-[#e7f3ee] px-4 py-2 text-xs font-black text-[#07594f] transition hover:bg-[#d8ece4]"
                >
                  {allSelected
                    ? "Tout retirer"
                    : "Tout sélectionner"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ROLE_OPTIONS.map(
                  (option) => {
                    const selected =
                      selectedRoles.includes(
                        option.value
                      );

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          toggleRole(
                            option.value
                          )
                        }
                        className={[
                          "group relative min-h-[132px] rounded-[24px] border p-4 text-left transition-all duration-200",
                          selected
                            ? "border-[#168273] bg-[#e5f4ef] shadow-[0_10px_28px_rgba(22,130,115,.10)]"
                            : "border-[#e5d9cd] bg-[#fdf8f1] hover:-translate-y-0.5 hover:border-[#cfded8] hover:bg-white hover:shadow-md",
                        ].join(
                          " "
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                            {
                              option.emoji
                            }
                          </div>

                          <div
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-full border transition",
                              selected
                                ? "border-[#168273] bg-[#168273] text-white"
                                : "border-[#dbcec1] bg-white text-transparent",
                            ].join(
                              " "
                            )}
                          >
                            <Check
                              size={
                                16
                              }
                              strokeWidth={
                                3
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 text-sm font-black text-[#2f2b27]">
                          {
                            option.label
                          }
                        </div>

                        <div className="mt-1 text-xs leading-5 text-[#81756c]">
                          {
                            option.description
                          }
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[22px] bg-[#f0ebe4] px-4 py-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#07594f] text-white">
                  <Users
                    size={19}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black uppercase tracking-[0.12em] text-[#9a8d82]">
                    Cible
                  </div>

                  <div className="mt-1 truncate text-sm font-bold text-[#3b3530]">
                    {selectedLabels.length >
                    0
                      ? selectedLabels.join(
                          " • "
                        )
                      : "Aucun profil sélectionné"}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-[#e8ddd2] bg-[#fffaf4] p-5 shadow-[0_16px_45px_rgba(73,58,43,.06)] sm:p-6">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d86f5c]">
                Étape 2
              </div>

              <h2 className="mt-1 text-xl font-black text-[#2f2b27]">
                Tous ou seulement certains ?
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={
                    selectedRoles.length ===
                    0
                  }
                  onClick={() =>
                    setSelectionMode(
                      "all"
                    )
                  }
                  className={[
                    "rounded-[24px] border p-5 text-left transition",
                    selectionMode ===
                    "all"
                      ? "border-[#168273] bg-[#e8f5f1]"
                      : "border-[#e5d9cd] bg-[#fdf8f1]",
                  ].join(
                    " "
                  )}
                >
                  <div className="font-black text-[#07594f]">
                    Tous les profils sélectionnés
                  </div>
                  <p className="mt-1 text-xs text-[#81756c]">
                    Exemple : toutes les associations.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={
                    selectedRoles.length ===
                    0
                  }
                  onClick={() =>
                    setSelectionMode(
                      "selected"
                    )
                  }
                  className={[
                    "rounded-[24px] border p-5 text-left transition",
                    selectionMode ===
                    "selected"
                      ? "border-[#e98b78] bg-[#fff0eb]"
                      : "border-[#e5d9cd] bg-[#fdf8f1]",
                  ].join(
                    " "
                  )}
                >
                  <div className="font-black text-[#a65445]">
                    Choisir les destinataires
                  </div>
                  <p className="mt-1 text-xs text-[#81756c]">
                    Une personne, deux, trois ou autant que tu veux.
                  </p>
                </button>
              </div>

              {selectionMode ===
                "selected" &&
                selectedRoles.length >
                  0 && (
                  <div className="mt-5 rounded-[24px] border border-[#eadfd5] bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative flex-1">
                        <Search
                          size={
                            17
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#968b82]"
                        />
                        <input
                          value={
                            search
                          }
                          onChange={(
                            event
                          ) =>
                            setSearch(
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Rechercher un nom, une association ou un e-mail..."
                          className="w-full rounded-[18px] border border-[#e2d7cc] bg-[#fdf9f4] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#168273]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={
                          toggleVisibleRecipients
                        }
                        disabled={
                          filteredProfiles.length ===
                          0
                        }
                        className="rounded-full bg-[#e7f3ee] px-4 py-2.5 text-xs font-black text-[#07594f] disabled:opacity-40"
                      >
                        {allVisibleSelected
                          ? "Désélectionner la liste"
                          : "Sélectionner la liste"}
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#81756c]">
                      <span>
                        {
                          selectedRecipientIds.length
                        }{" "}
                        destinataire(s) sélectionné(s)
                      </span>

                      {selectedRecipientIds.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRecipientIds(
                              []
                            )
                          }
                          className="inline-flex items-center gap-1 text-[#d86f5c]"
                        >
                          <X
                            size={
                              14
                            }
                          />
                          Tout retirer
                        </button>
                      )}
                    </div>

                    <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                      {profilesLoading ? (
                        <div className="py-8 text-center text-sm font-bold text-[#81756c]">
                          Chargement des profils…
                        </div>
                      ) : filteredProfiles.length ===
                        0 ? (
                        <div className="py-8 text-center text-sm text-[#81756c]">
                          Aucun profil trouvé.
                        </div>
                      ) : (
                        filteredProfiles.map(
                          (
                            profile
                          ) => {
                            const selected =
                              selectedRecipientIds.includes(
                                profile.id
                              );

                            return (
                              <button
                                key={
                                  profile.id
                                }
                                type="button"
                                onClick={() =>
                                  toggleRecipient(
                                    profile.id
                                  )
                                }
                                className={[
                                  "flex w-full items-center gap-3 rounded-[18px] border p-3 text-left transition",
                                  selected
                                    ? "border-[#168273] bg-[#e8f5f1]"
                                    : "border-[#eee3d9] bg-[#fffaf4] hover:bg-white",
                                ].join(
                                  " "
                                )}
                              >
                                <div
                                  className={[
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                                    selected
                                      ? "border-[#168273] bg-[#168273] text-white"
                                      : "border-[#d8cec4] bg-white text-transparent",
                                  ].join(
                                    " "
                                  )}
                                >
                                  <Check
                                    size={
                                      15
                                    }
                                    strokeWidth={
                                      3
                                    }
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-black text-[#2f2b27]">
                                    {getProfileName(
                                      profile
                                    )}
                                  </div>

                                  <div className="mt-0.5 truncate text-xs text-[#8b8178]">
                                    {profile.email ||
                                      "E-mail non renseigné"}
                                    {" • "}
                                    {ROLE_OPTIONS.find(
                                      (
                                        option
                                      ) =>
                                        option.value ===
                                        profile.role
                                    )
                                      ?.label ||
                                      profile.role ||
                                      "Profil"}
                                  </div>
                                </div>
                              </button>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f0ebe4] px-4 py-3.5">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.12em] text-[#9a8d82]">
                    Destinataires
                  </div>
                  <div className="mt-1 text-sm font-bold text-[#3b3530]">
                    {selectionMode ===
                    "selected"
                      ? `${selectedRecipientIds.length} profil(s) choisi(s)`
                      : "Tous les profils des groupes sélectionnés"}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    selectedRoles.length ===
                      0 ||
                    (
                      selectionMode ===
                        "selected" &&
                      selectedRecipientIds.length ===
                        0
                    )
                  }
                  onClick={() =>
                    void previewRecipients()
                  }
                  className="rounded-full bg-[#fffaf4] px-4 py-2 text-xs font-black text-[#07594f] shadow-sm disabled:opacity-40"
                >
                  {recipientCount !==
                  null
                    ? `${recipientCount} destinataire(s)`
                    : "Compter"}
                </button>
              </div>
            </section>

            <section className="rounded-[30px] border border-[#e8ddd2] bg-[#fffaf4] p-5 shadow-[0_16px_45px_rgba(73,58,43,.06)] sm:p-6">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d86f5c]">
                Étape 3
              </div>
              <h2 className="mt-1 text-xl font-black text-[#2f2b27]">
                Comment veux-tu les prévenir ?
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setSendNotification(
                      (current) =>
                        !current
                    )
                  }
                  className={[
                    "relative rounded-[24px] border p-5 text-left transition-all",
                    sendNotification
                      ? "border-[#168273] bg-[#e8f5f1] shadow-[0_10px_30px_rgba(22,130,115,.08)]"
                      : "border-[#e5d9cd] bg-[#fdf8f1] hover:bg-white",
                  ].join(
                    " "
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07594f] text-white shadow-sm">
                      <MessageCircleMore
                        size={
                          23
                        }
                      />
                    </div>

                    <div
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-full border",
                        sendNotification
                          ? "border-[#168273] bg-[#168273] text-white"
                          : "border-[#dbcec1] bg-white text-transparent",
                      ].join(
                        " "
                      )}
                    >
                      <Check
                        size={
                          16
                        }
                        strokeWidth={
                          3
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 font-black text-[#2f2b27]">
                    Message Taui Te Ora
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#81756c]">
                    Notification dans l'application + PUSH téléphone.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSendEmail(
                      (current) =>
                        !current
                    )
                  }
                  className={[
                    "relative rounded-[24px] border p-5 text-left transition-all",
                    sendEmail
                      ? "border-[#e98b78] bg-[#fff0eb] shadow-[0_10px_30px_rgba(233,139,120,.08)]"
                      : "border-[#e5d9cd] bg-[#fdf8f1] hover:bg-white",
                  ].join(
                    " "
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e98b78] text-white shadow-sm">
                      <Mail
                        size={
                          23
                        }
                      />
                    </div>

                    <div
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-full border",
                        sendEmail
                          ? "border-[#e98b78] bg-[#e98b78] text-white"
                          : "border-[#dbcec1] bg-white text-transparent",
                      ].join(
                        " "
                      )}
                    >
                      <Check
                        size={
                          16
                        }
                        strokeWidth={
                          3
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 font-black text-[#2f2b27]">
                    E-mail
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#81756c]">
                    Envoyé uniquement aux profils choisis.
                  </p>
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-[#e8ddd2] bg-[#fffaf4] p-5 shadow-[0_16px_45px_rgba(73,58,43,.06)] sm:p-6">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d86f5c]">
                Étape 4
              </div>
              <h2 className="mt-1 text-xl font-black text-[#2f2b27]">
                Ton message
              </h2>
              <p className="mt-1 text-sm text-[#7f746b]">
                Simple, lisible et direct.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#8f8277]">
                    Objet
                  </span>
                  <input
                    value={
                      title
                    }
                    onChange={(
                      event
                    ) =>
                      setTitle(
                        event
                          .target
                          .value
                      )
                    }
                    maxLength={
                      160
                    }
                    placeholder="Ex. Information importante"
                    className="w-full rounded-[20px] border border-[#dfd3c8] bg-[#fdf9f4] px-4 py-3.5 text-sm font-semibold text-[#2f2b27] outline-none transition placeholder:text-[#b4a9a0] focus:border-[#168273] focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#8f8277]">
                    Message
                  </span>
                  <textarea
                    value={
                      message
                    }
                    onChange={(
                      event
                    ) =>
                      setMessage(
                        event
                          .target
                          .value
                      )
                    }
                    rows={
                      12
                    }
                    maxLength={
                      8000
                    }
                    placeholder="Écris ton message ici…"
                    className="w-full resize-y rounded-[22px] border border-[#dfd3c8] bg-[#fdf9f4] px-4 py-4 text-sm leading-6 text-[#2f2b27] outline-none transition placeholder:text-[#b4a9a0] focus:border-[#168273] focus:bg-white"
                  />
                </label>

                <div className="flex items-center justify-between text-xs font-bold text-[#a0958c]">
                  <span>
                    {
                      message.length
                    }
                    /8000 caractères
                  </span>

                  <span>
                    {sendNotification &&
                    sendEmail
                      ? "Application + e-mail"
                      : sendEmail
                        ? "E-mail"
                        : "Application"}
                  </span>
                </div>
              </div>
            </section>

            {lastResult && (
              <section className="rounded-[26px] border border-[#bcded3] bg-[#e8f6f1] p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#168273] text-white">
                    <CheckCircle2
                      size={
                        20
                      }
                    />
                  </div>

                  <div>
                    <h3 className="font-black text-[#07594f]">
                      Communication envoyée
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#47675f]">
                      {lastResult.recipients ||
                        0}{" "}
                      profil(s) ciblé(s)
                      {" • "}
                      {lastResult.notifications_created ||
                        0}{" "}
                      notification(s)
                      {" • "}
                      {lastResult.pushes_sent ||
                        0}{" "}
                      PUSH
                      {" • "}
                      {lastResult.emails_sent ||
                        0}{" "}
                      e-mail(s)
                      {Number(
                        lastResult.emails_failed ||
                          0
                      ) >
                      0
                        ? ` • ${lastResult.emails_failed} échec(s) e-mail`
                        : ""}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="sticky bottom-4 rounded-[28px] border border-[#0b6d60]/10 bg-[#07594f] p-4 shadow-[0_18px_55px_rgba(7,89,79,.22)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-white/55">
                    Prêt à envoyer
                  </div>

                  <div className="mt-1 text-sm font-bold text-white">
                    {selectedRoles.length ===
                    0
                      ? "Choisis au moins un groupe"
                      : selectionMode ===
                          "selected"
                        ? `${selectedRecipientIds.length} profil(s) choisi(s)`
                        : `${selectedRoles.length} groupe(s) sélectionné(s)`}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    !canSend
                  }
                  onClick={() =>
                    void sendBroadcast()
                  }
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] bg-[#ef8f7c] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#e67f6b] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send
                    size={
                      19
                    }
                  />
                  {sending
                    ? "Envoi en cours..."
                    : "Envoyer"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
