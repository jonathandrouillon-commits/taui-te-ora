"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Eye,
  MessageCircleMore,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type Conversation = {
  id: string;
  requester_id: string;
  owner_id: string;
  animal_id: string | null;
  adoption_request_id: string | null;
  sos_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type StartConversationResponse = {
  ok?: boolean;
  url?: string;
  error?: string;
};

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeRole(
  value: unknown
) {
  const role =
    clean(value)
      .toLowerCase();

  if (
    role === "utilisateur" ||
    role === "user"
  ) {
    return "adoptant";
  }

  return role;
}

function getProfileName(
  profile?: Profile | null
) {
  if (!profile) {
    return "Profil Taui Te Ora";
  }

  if (
    clean(
      profile.organization_name
    )
  ) {
    return clean(
      profile.organization_name
    );
  }

  const fullName =
    `${clean(
      profile.first_name
    )} ${clean(
      profile.last_name
    )}`.trim();

  if (fullName) {
    return fullName;
  }

  return (
    clean(
      profile.email
    ) ||
    "Profil Taui Te Ora"
  );
}

function getRoleLabel(
  role: string | null
) {
  const normalized =
    normalizeRole(
      role
    );

  const labels: Record<
    string,
    string
  > = {
    adoptant:
      "Adoptant / Utilisateur",
    association:
      "Association",
    refuge:
      "Refuge",
    sigfa:
      "SIGFA",
    fourriere:
      "Fourrière",
    benevole:
      "Bénévole",
    famille_accueil:
      "Famille d'accueil",
    famille_d_accueil:
      "Famille d'accueil",
    admin:
      "Administrateur",
  };

  return (
    labels[
      normalized
    ] ||
    normalized ||
    "Profil"
  );
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        dateStyle:
          "short",
        timeStyle:
          "short",
      }
    ).format(
      new Date(
        value
      )
    );
  } catch {
    return "";
  }
}

export default function AdminMessagesPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    starting,
    setStarting,
  ] = useState<
    string | null
  >(null);

  const [
    currentAdminId,
    setCurrentAdminId,
  ] = useState("");

  const [
    profiles,
    setProfiles,
  ] = useState<
    Profile[]
  >([]);

  const [
    conversations,
    setConversations,
  ] = useState<
    Conversation[]
  >([]);

  const [
    profileSearch,
    setProfileSearch,
  ] = useState("");

  const [
    conversationSearch,
    setConversationSearch,
  ] = useState("");

  const [
    tab,
    setTab,
  ] = useState<
    "mine" | "all"
  >("mine");

  const profilesById =
    useMemo(() => {
      return new Map(
        profiles.map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );
    }, [
      profiles,
    ]);

  const contactableProfiles =
    useMemo(() => {
      const query =
        profileSearch
          .trim()
          .toLowerCase();

      return profiles
        .filter(
          (profile) =>
            profile.id !==
              currentAdminId &&
            profile.is_active !==
              false
        )
        .filter(
          (profile) => {
            if (!query) {
              return true;
            }

            return [
              getProfileName(
                profile
              ),
              profile.email,
              profile.role,
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLowerCase()
              .includes(
                query
              );
          }
        );
    }, [
      profiles,
      profileSearch,
      currentAdminId,
    ]);

  const visibleConversations =
    useMemo(() => {
      const query =
        conversationSearch
          .trim()
          .toLowerCase();

      return conversations
        .filter(
          (
            conversation
          ) => {
            if (
              tab ===
              "mine"
            ) {
              return (
                conversation.requester_id ===
                  currentAdminId ||
                conversation.owner_id ===
                  currentAdminId
              );
            }

            return true;
          }
        )
        .filter(
          (
            conversation
          ) => {
            if (!query) {
              return true;
            }

            const requester =
              profilesById.get(
                conversation.requester_id
              );

            const owner =
              profilesById.get(
                conversation.owner_id
              );

            const haystack =
              [
                getProfileName(
                  requester
                ),
                getProfileName(
                  owner
                ),
                requester?.email,
                owner?.email,
                requester?.role,
                owner?.role,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLowerCase();

            return haystack.includes(
              query
            );
          }
        );
    }, [
      conversations,
      conversationSearch,
      currentAdminId,
      profilesById,
      tab,
    ]);

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      try {
        setLoading(
          true
        );

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
            "/login?redirect=/admin/messages"
          );

          return;
        }

        const {
          data:
            adminProfile,
          error:
            adminProfileError,
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
          adminProfileError
        ) {
          throw adminProfileError;
        }

        const role =
          normalizeRole(
            adminProfile?.role
          );

        if (
          role !==
            "admin" ||
          adminProfile
            ?.is_active ===
            false
        ) {
          router.replace(
            "/"
          );

          return;
        }

        const [
          profilesResult,
          conversationsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "profiles"
              )
              .select(
                `
                  id,
                  email,
                  first_name,
                  last_name,
                  organization_name,
                  role,
                  is_active
                `
              )
              .neq(
                "is_active",
                false
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "conversations"
              )
              .select(
                `
                  id,
                  requester_id,
                  owner_id,
                  animal_id,
                  adoption_request_id,
                  sos_id,
                  created_at,
                  updated_at
                `
              )
              .order(
                "updated_at",
                {
                  ascending:
                    false,
                }
              ),
          ]);

        if (
          profilesResult.error
        ) {
          throw profilesResult.error;
        }

        if (
          conversationsResult.error
        ) {
          throw conversationsResult.error;
        }

        if (
          cancelled
        ) {
          return;
        }

        setCurrentAdminId(
          user.id
        );

        setProfiles(
          (
            profilesResult.data ||
            []
          ) as Profile[]
        );

        setConversations(
          (
            conversationsResult.data ||
            []
          ) as Conversation[]
        );
      } catch (
        error
      ) {
        console.error(
          "Erreur centre messagerie admin :",
          error
        );

        alert(
          error instanceof
            Error
            ? error.message
            : "Impossible de charger la messagerie."
        );
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

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);

  async function startConversation(
    recipientId: string
  ) {
    try {
      setStarting(
        recipientId
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
        session
          ?.access_token ||
        "";

      if (!token) {
        throw new Error(
          "Session expirée."
        );
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
        (await response.json()) as StartConversationResponse;

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
      setStarting(
        null
      );
    }
  }

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f1e8] px-4">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-[#dfeee8]" />
          <p className="mt-4 font-black text-[#07594f]">
            Chargement de la messagerie…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f1e8_0%,#fbf8f2_52%,#f2ece4_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/dashboard"
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-[#ddd1c5] bg-[#fffaf4] px-4 py-2.5 text-sm font-black text-[#07594f] shadow-sm"
          >
            <ArrowLeft
              size={17}
            />
            Centre de pilotage
          </button>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f5f1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#07594f]">
            <ShieldCheck
              size={15}
            />
            Messagerie administrateur
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[36px] bg-[#07594f] px-6 py-7 text-white shadow-[0_24px_70px_rgba(7,89,79,.18)] sm:px-8 sm:py-9">
          <div className="absolute -right-10 -top-14 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              <MessageCircleMore
                size={14}
              />
              Centre de messagerie
            </div>

            <h1 className="mt-4 text-3xl font-black sm:text-4xl">
              Conversations Taui Te Ora
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75 sm:text-base">
              Écris directement à n'importe quel profil, retrouve tes conversations et consulte les échanges entre utilisateurs lorsque tu en as besoin.
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[.86fr_1.14fr]">
          <section className="rounded-[30px] border border-[#e8ddd2] bg-[#fffaf4] p-5 shadow-[0_16px_45px_rgba(73,58,43,.06)] sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f5f1] text-[#07594f]">
                <Send
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-black text-[#2f2b27]">
                  Nouveau message
                </h2>
                <p className="text-xs text-[#81756c]">
                  Recherche un profil et démarre une conversation.
                </p>
              </div>
            </div>

            <div className="relative mt-5">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#968b82]"
              />

              <input
                value={
                  profileSearch
                }
                onChange={(
                  event
                ) =>
                  setProfileSearch(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Nom, structure, e-mail, rôle..."
                className="w-full rounded-[18px] border border-[#e2d7cc] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#168273]"
              />
            </div>

            <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {contactableProfiles.length ===
              0 ? (
                <div className="py-8 text-center text-sm text-[#81756c]">
                  Aucun profil trouvé.
                </div>
              ) : (
                contactableProfiles.map(
                  (
                    profile
                  ) => (
                    <button
                      key={
                        profile.id
                      }
                      type="button"
                      disabled={
                        starting ===
                        profile.id
                      }
                      onClick={() =>
                        void startConversation(
                          profile.id
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-[18px] border border-[#eee3d9] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#cbded7] hover:shadow-sm disabled:opacity-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#07594f] text-sm font-black text-white">
                        {getProfileName(
                          profile
                        )
                          .charAt(
                            0
                          )
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black text-[#2f2b27]">
                          {getProfileName(
                            profile
                          )}
                        </div>

                        <div className="mt-0.5 truncate text-xs text-[#8b8178]">
                          {getRoleLabel(
                            profile.role
                          )}
                          {profile.email
                            ? ` • ${profile.email}`
                            : ""}
                        </div>
                      </div>

                      <MessageCircleMore
                        size={18}
                        className="shrink-0 text-[#168273]"
                      />
                    </button>
                  )
                )
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e8ddd2] bg-[#fffaf4] p-5 shadow-[0_16px_45px_rgba(73,58,43,.06)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#2f2b27]">
                  Conversations
                </h2>
                <p className="mt-1 text-xs text-[#81756c]">
                  Tes conversations personnelles ou l'ensemble des échanges.
                </p>
              </div>

              <div className="flex rounded-full bg-[#f0ebe4] p-1">
                <button
                  type="button"
                  onClick={() =>
                    setTab(
                      "mine"
                    )
                  }
                  className={[
                    "rounded-full px-4 py-2 text-xs font-black transition",
                    tab ===
                    "mine"
                      ? "bg-[#07594f] text-white shadow-sm"
                      : "text-[#756b63]",
                  ].join(
                    " "
                  )}
                >
                  Mes conversations
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTab(
                      "all"
                    )
                  }
                  className={[
                    "rounded-full px-4 py-2 text-xs font-black transition",
                    tab ===
                    "all"
                      ? "bg-[#07594f] text-white shadow-sm"
                      : "text-[#756b63]",
                  ].join(
                    " "
                  )}
                >
                  Toutes
                </button>
              </div>
            </div>

            <div className="relative mt-5">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#968b82]"
              />
              <input
                value={
                  conversationSearch
                }
                onChange={(
                  event
                ) =>
                  setConversationSearch(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Rechercher une conversation..."
                className="w-full rounded-[18px] border border-[#e2d7cc] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#168273]"
              />
            </div>

            <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
              {visibleConversations.length ===
              0 ? (
                <div className="py-10 text-center">
                  <Users
                    size={30}
                    className="mx-auto text-[#c9bfb5]"
                  />
                  <p className="mt-3 text-sm font-bold text-[#81756c]">
                    Aucune conversation.
                  </p>
                </div>
              ) : (
                visibleConversations.map(
                  (
                    conversation
                  ) => {
                    const requester =
                      profilesById.get(
                        conversation.requester_id
                      );

                    const owner =
                      profilesById.get(
                        conversation.owner_id
                      );

                    const adminIsParticipant =
                      conversation.requester_id ===
                        currentAdminId ||
                      conversation.owner_id ===
                        currentAdminId;

                    return (
                      <button
                        key={
                          conversation.id
                        }
                        type="button"
                        onClick={() =>
                          router.push(
                            `/messages/${conversation.id}`
                          )
                        }
                        className="w-full rounded-[22px] border border-[#eadfd5] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#cbded7] hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={[
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                              adminIsParticipant
                                ? "bg-[#e8f5f1] text-[#07594f]"
                                : "bg-[#fff0eb] text-[#c55f4c]",
                            ].join(
                              " "
                            )}
                          >
                            {adminIsParticipant ? (
                              <MessageCircleMore
                                size={20}
                              />
                            ) : (
                              <Eye
                                size={20}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate font-black text-[#2f2b27]">
                                {getProfileName(
                                  requester
                                )}
                                {" ↔ "}
                                {getProfileName(
                                  owner
                                )}
                              </div>

                              <span
                                className={[
                                  "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
                                  adminIsParticipant
                                    ? "bg-[#e8f5f1] text-[#07594f]"
                                    : "bg-[#fff0eb] text-[#b85d4d]",
                                ].join(
                                  " "
                                )}
                              >
                                {adminIsParticipant
                                  ? "Participant"
                                  : "Consultation"}
                              </span>
                            </div>

                            <div className="mt-1 text-xs text-[#8b8178]">
                              {getRoleLabel(
                                requester?.role ||
                                  null
                              )}
                              {" • "}
                              {getRoleLabel(
                                owner?.role ||
                                  null
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-[#9b9087]">
                              {conversation.animal_id && (
                                <span className="rounded-full bg-[#f2eee8] px-2.5 py-1">
                                  Animal
                                </span>
                              )}

                              {conversation.adoption_request_id && (
                                <span className="rounded-full bg-[#f2eee8] px-2.5 py-1">
                                  Adoption
                                </span>
                              )}

                              {conversation.sos_id && (
                                <span className="rounded-full bg-[#fff0eb] px-2.5 py-1 text-[#bd5f4d]">
                                  SOS
                                </span>
                              )}

                              {!conversation.animal_id &&
                                !conversation.adoption_request_id &&
                                !conversation.sos_id && (
                                  <span className="rounded-full bg-[#e8f5f1] px-2.5 py-1 text-[#07594f]">
                                    Direct
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="shrink-0 text-right text-[10px] font-bold text-[#a0958c]">
                            {formatDate(
                              conversation.updated_at ||
                                conversation.created_at
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
