"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Check,
  PawPrint,
  Search,
  Users,
} from "lucide-react";

import {
  createWalk,
  getWalkFacebookShareUrl,
} from "../../services/walk.service";

import {
  supabase,
} from "../../lib/supabase";

type CommunityCompanion = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  color: string | null;
  character: string | null;
  photo_url: string | null;
};

function formatSpecies(
  value: string | null
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  switch (normalized) {
    case "chien":
      return "Chien";

    case "chat":
      return "Chat";

    case "cheval":
      return "Cheval";

    default:
      return value || "Animal";
  }
}

function formatSex(
  value: string | null
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "male" ||
    normalized === "mâle"
  ) {
    return "Mâle";
  }

  if (
    normalized === "female" ||
    normalized === "femelle"
  ) {
    return "Femelle";
  }

  return "";
}

function calculateAge(
  birthDate: string | null
) {
  if (!birthDate) {
    return "";
  }

  const birth =
    new Date(birthDate);

  const today =
    new Date();

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return "";
  }

  let years =
    today.getFullYear() -
    birth.getFullYear();

  let months =
    today.getMonth() -
    birth.getMonth();

  if (
    today.getDate() <
    birth.getDate()
  ) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return `${years} an${
      years > 1 ? "s" : ""
    }`;
  }

  if (months > 0) {
    return `${months} mois`;
  }

  return "";
}

export default function CreateWalkPage() {
  const router =
    useRouter();

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    communityLoading,
    setCommunityLoading,
  ] =
    useState(true);

  const [
    communityCompanions,
    setCommunityCompanions,
  ] =
    useState<
      CommunityCompanion[]
    >([]);

  const [
    selectedCommunityCompanionIds,
    setSelectedCommunityCompanionIds,
  ] =
    useState<string[]>([]);

  const [
    communitySearch,
    setCommunitySearch,
  ] =
    useState("");

  const [
    inviteCommunity,
    setInviteCommunity,
  ] =
    useState(false);

  const [
    myCompanionsLoading,
    setMyCompanionsLoading,
  ] =
    useState(true);

  const [
    myCompanions,
    setMyCompanions,
  ] =
    useState<
      CommunityCompanion[]
    >([]);

  const [
    selectedMyCompanionIds,
    setSelectedMyCompanionIds,
  ] =
    useState<string[]>([]);

  /* =========================================================
     CHARGEMENT DE MES COMPAGNONS
  ========================================================= */

  useEffect(() => {
    let active = true;

    async function loadMyCompanions() {
      try {
        setMyCompanionsLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          if (active) {
            setMyCompanions([]);
          }
          return;
        }

        const {
          data,
          error: companionsError,
        } = await supabase
          .from("companions")
          .select(`
            id,
            owner_id,
            name,
            species,
            breed,
            sex,
            birth_date,
            color,
            character,
            photo_url
          `)
          .eq("owner_id", user.id)
          .eq("is_deceased", false)
          .order("name", {
            ascending: true,
          });

        if (companionsError) {
          throw companionsError;
        }

        if (!active) {
          return;
        }

        setMyCompanions(
          (data || []) as CommunityCompanion[]
        );
      } catch (cause) {
        console.error(
          "Erreur chargement de mes compagnons :",
          cause
        );
      } finally {
        if (active) {
          setMyCompanionsLoading(false);
        }
      }
    }

    void loadMyCompanions();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     CHARGEMENT COMMUNAUTE
  ========================================================= */

  useEffect(() => {
    let active = true;

    async function loadCommunity() {
      try {
        setCommunityLoading(
          true
        );

        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          return;
        }

        const {
          data,
          error:
            communityError,
        } =
          await supabase
            .from("companions")
            .select(`
              id,
              owner_id,
              name,
              species,
              breed,
              sex,
              birth_date,
              color,
              character,
              photo_url
            `)
            .eq(
              "is_public",
              true
            )
            .eq(
              "is_deceased",
              false
            )
            .neq(
              "owner_id",
              user.id
            )
            .order(
              "name",
              {
                ascending: true,
              }
            );

        if (
          communityError
        ) {
          throw communityError;
        }

        if (!active) {
          return;
        }

        setCommunityCompanions(
          (data ||
            []) as CommunityCompanion[]
        );
      } catch (cause) {
        console.error(
          "Erreur chargement communauté Sans Voix :",
          cause
        );
      } finally {
        if (active) {
          setCommunityLoading(
            false
          );
        }
      }
    }

    void loadCommunity();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     FILTRE
  ========================================================= */

  const filteredCommunity =
    useMemo(() => {
      const query =
        communitySearch
          .trim()
          .toLowerCase();

      if (!query) {
        return communityCompanions;
      }

      return communityCompanions.filter(
        (companion) =>
          [
            companion.name,
            companion.species,
            companion.breed,
            companion.color,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      communityCompanions,
      communitySearch,
    ]);

  function toggleMyCompanion(
    companionId: string
  ) {
    setSelectedMyCompanionIds(
      (previous) => {
        if (
          previous.includes(
            companionId
          )
        ) {
          return previous.filter(
            (id) =>
              id !==
              companionId
          );
        }

        return [
          ...previous,
          companionId,
        ];
      }
    );
  }

  function toggleCommunityCompanion(
    companionId: string
  ) {
    setSelectedCommunityCompanionIds(
      (previous) => {
        if (
          previous.includes(
            companionId
          )
        ) {
          return previous.filter(
            (id) =>
              id !==
              companionId
          );
        }

        return [
          ...previous,
          companionId,
        ];
      }
    );
  }

  /* =========================================================
     CREATION
  ========================================================= */

  async function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    let facebookShareWindow:
      Window | null = null;

    setBusy(true);
    setError("");

    facebookShareWindow =
      window.open(
        "",
        "taui-walk-facebook-share",
        "popup=yes,width=760,height=820"
      );

    if (
      facebookShareWindow
    ) {
      facebookShareWindow.document.title =
        "Préparation du partage Facebook…";

      facebookShareWindow.document.body.innerHTML =
        `
          <div style="
            font-family: Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f4eee3;
            color: #064b42;
            text-align: center;
            padding: 32px;
            box-sizing: border-box;
          ">
            <div>
              <div style="
                font-size: 44px;
                margin-bottom: 16px;
              ">
                🐾
              </div>

              <div style="
                font-size: 22px;
                font-weight: 800;
              ">
                Création de la balade…
              </div>

              <div style="
                margin-top: 10px;
                font-size: 15px;
                opacity: 0.7;
              ">
                Facebook va s'ouvrir automatiquement.
              </div>
            </div>
          </div>
        `;
    }

    const form =
      new FormData(
        event.currentTarget
      );

    try {
      const {
        data: {
          user,
        },
        error:
          authError,
      } =
        await supabase.auth.getUser();

      if (
        authError
      ) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          "Connecte-toi pour organiser une balade."
        );
      }

      const {
        data,
        error:
          createError,
      } =
        await createWalk({
          title:
            String(
              form.get(
                "title"
              )
            ),

          description:
            String(
              form.get(
                "description"
              ) ||
                ""
            ),

          location:
            String(
              form.get(
                "location"
              )
            ),

          starts_at:
            new Date(
              String(
                form.get(
                  "starts_at"
                )
              )
            ).toISOString(),

          duration_minutes:
            Number(
              form.get(
                "duration_minutes"
              )
            ),

          max_dogs:
            Number(
              form.get(
                "max_dogs"
              )
            ),

          pace:
            String(
              form.get(
                "pace"
              )
            ) as
              | "calme"
              | "moderee"
              | "sportive",

          audience:
            String(
              form.get(
                "audience"
              )
            ),
        });

      if (
        createError
      ) {
        throw createError;
      }

      if (!data) {
        throw new Error(
          "La balade a été créée mais son identifiant est introuvable."
        );
      }

      /* =====================================================
         MES COMPAGNONS PARTICIPANTS
      ===================================================== */

      if (
        selectedMyCompanionIds.length >
        0
      ) {
        const ownParticipants =
          selectedMyCompanionIds.map(
            (companionId) => ({
              walk_id:
                data.id,

              companion_id:
                companionId,

              owner_id:
                user.id,

              participation_type:
                "organizer",
            })
          );

        const {
          error:
            ownParticipantsError,
        } =
          await supabase
            .from(
              "community_walk_companions"
            )
            .insert(
              ownParticipants
            );

        if (
          ownParticipantsError
        ) {
          console.error(
            "Erreur ajout de mes compagnons à la balade :",
            ownParticipantsError
          );

          throw new Error(
            "La balade a été créée, mais vos compagnons n'ont pas pu être ajoutés."
          );
        }
      }

      /* =====================================================
         INVITATIONS SANS VOIX
      ===================================================== */

      if (
        inviteCommunity &&
        selectedCommunityCompanionIds.length >
          0
      ) {
        const selected =
          communityCompanions.filter(
            (companion) =>
              selectedCommunityCompanionIds.includes(
                companion.id
              )
          );

        const invitations =
          selected.map(
            (companion) => ({
              walk_id:
                data.id,

              companion_id:
                companion.id,

              invited_by:
                user.id,

              owner_id:
                companion.owner_id,

              status:
                "pending",
            })
          );

        const {
          error:
            invitationError,
        } =
          await supabase
            .from(
              "community_walk_companion_invitations"
            )
            .insert(
              invitations
            );

        if (
          invitationError
        ) {
          console.error(
            "Erreur invitations Sans Voix :",
            invitationError
          );

          throw new Error(
            "La balade a été créée, mais les invitations aux compagnons n'ont pas pu être envoyées."
          );
        }
      }

      const facebookShareUrl =
        getWalkFacebookShareUrl(
          data.id
        );

      if (
        facebookShareWindow &&
        !facebookShareWindow.closed
      ) {
        facebookShareWindow.location.href =
          facebookShareUrl;
      } else {
        window.open(
          facebookShareUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }

      router.push(
        `/balades/${data.id}`
      );
    } catch (
      cause
    ) {
      if (
        facebookShareWindow &&
        !facebookShareWindow.closed
      ) {
        facebookShareWindow.close();
      }

      setError(
        cause instanceof
          Error
          ? cause.message
          : "Impossible de créer la balade."
      );

      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-2xl border border-[#d9cec7] bg-white px-4 py-3 outline-none focus:border-[#ef7f61]";

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42]">
      <form
        onSubmit={
          submit
        }
        className="mx-auto max-w-2xl rounded-[32px] bg-white p-6 shadow-sm sm:p-8"
      >
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-5 font-black"
        >
          ← Retour
        </button>

        <h1 className="text-3xl font-black">
          Organiser une balade
        </h1>

        <p className="mb-6 mt-2 text-sm text-[#416c66]">
          La balade doit rester
          collective et dédiée au
          bien-être animal.
        </p>

        <div className="space-y-4">
          <label className="block text-sm font-bold">
            Nom de la balade

            <input
              required
              name="title"
              className={
                field
              }
              placeholder="Balade du dimanche"
            />
          </label>

          <label className="block text-sm font-bold">
            Lieu

            <input
              required
              name="location"
              className={
                field
              }
              placeholder="Parc Paofai"
            />
          </label>

          <label className="block text-sm font-bold">
            Date et heure

            <input
              required
              name="starts_at"
              type="datetime-local"
              className={
                field
              }
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">
              Durée (minutes)

              <input
                required
                name="duration_minutes"
                type="number"
                min="15"
                max="240"
                defaultValue="45"
                className={
                  field
                }
              />
            </label>

            <label className="text-sm font-bold">
              Chiens maximum

              <input
                required
                name="max_dogs"
                type="number"
                min="2"
                max="20"
                defaultValue="6"
                className={
                  field
                }
              />
            </label>
          </div>

          <label className="block text-sm font-bold">
            Rythme

            <select
              name="pace"
              className={
                field
              }
            >
              <option value="calme">
                Tranquille
              </option>

              <option value="moderee">
                Modéré
              </option>

              <option value="sportive">
                Sportif
              </option>
            </select>
          </label>

          <label className="block text-sm font-bold">
            Pour quels chiens ?

            <input
              required
              name="audience"
              className={
                field
              }
              placeholder="Tous, chiens timides, chiots…"
            />
          </label>

          <label className="block text-sm font-bold">
            Informations utiles

            <textarea
              name="description"
              rows={4}
              className={
                field
              }
              placeholder="Point de rendez-vous, matériel à prévoir…"
            />
          </label>
        </div>

        {/* ===================================================
            MES COMPAGNONS PARTICIPANTS
        =================================================== */}

        <section className="mt-8 rounded-[28px] border border-[#d7e6df] bg-[#f2f8f5] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dfeee8] text-[#064b42]">
              <PawPrint
                size={21}
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-[#064b42]">
                Mes compagnons participants
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-[#416c66]">
                Choisissez uniquement les compagnons qui participeront à cette balade.
                Vous pouvez en sélectionner un, plusieurs, ou aucun.
              </p>
            </div>
          </div>

          <div className="mt-5">
            {myCompanionsLoading ? (
              <div className="rounded-[20px] bg-white p-6 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#dfeee8] border-t-[#064b42]" />

                <p className="mt-3 text-sm font-bold">
                  Chargement de mes compagnons...
                </p>
              </div>
            ) : myCompanions.length ===
              0 ? (
              <div className="rounded-[20px] bg-white p-6 text-center">
                <PawPrint
                  size={34}
                  className="mx-auto text-[#064b42]"
                />

                <p className="mt-3 font-black">
                  Aucun compagnon actif enregistré
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/mes-compagnons/ajouter"
                    )
                  }
                  className="mt-4 rounded-full bg-[#064b42] px-5 py-2.5 text-sm font-black text-white"
                >
                  Ajouter un compagnon
                </button>
              </div>
            ) : (
              <>
                {selectedMyCompanionIds.length >
                  0 && (
                  <p className="mb-4 rounded-full bg-white px-4 py-2 text-center text-sm font-black text-[#064b42]">
                    {
                      selectedMyCompanionIds.length
                    }{" "}
                    compagnon
                    {selectedMyCompanionIds.length >
                    1
                      ? "s"
                      : ""}{" "}
                    participant
                    {selectedMyCompanionIds.length >
                    1
                      ? "s"
                      : ""}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {myCompanions.map(
                    (
                      companion
                    ) => {
                      const selected =
                        selectedMyCompanionIds.includes(
                          companion.id
                        );

                      const age =
                        calculateAge(
                          companion.birth_date
                        );

                      const sex =
                        formatSex(
                          companion.sex
                        );

                      return (
                        <button
                          key={
                            companion.id
                          }
                          type="button"
                          onClick={() =>
                            toggleMyCompanion(
                              companion.id
                            )
                          }
                          className={`relative overflow-hidden rounded-[22px] border-2 bg-white text-left transition ${
                            selected
                              ? "border-[#064b42] shadow-md"
                              : "border-transparent shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3 p-3">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-[#f4eee3]">
                              {companion.photo_url ? (
                                <img
                                  src={
                                    companion.photo_url
                                  }
                                  alt={
                                    companion.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-3xl">
                                  🐾
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-lg font-black text-[#064b42]">
                                {
                                  companion.name
                                }
                              </p>

                              <p className="mt-1 text-xs font-bold text-[#756d67]">
                                {formatSpecies(
                                  companion.species
                                )}
                                {sex
                                  ? ` · ${sex}`
                                  : ""}
                                {age
                                  ? ` · ${age}`
                                  : ""}
                              </p>

                              {companion.breed && (
                                <p className="mt-1 truncate text-xs text-[#756d67]">
                                  {
                                    companion.breed
                                  }
                                </p>
                              )}

                              {companion.character && (
                                <p className="mt-1 line-clamp-2 text-xs text-[#416c66]">
                                  {
                                    companion.character
                                  }
                                </p>
                              )}
                            </div>

                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                selected
                                  ? "bg-[#064b42] text-white"
                                  : "bg-[#f4eee3] text-[#9c9188]"
                              }`}
                            >
                              {selected ? (
                                <Check
                                  size={17}
                                  strokeWidth={
                                    3
                                  }
                                />
                              ) : (
                                <PawPrint
                                  size={16}
                                />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ===================================================
            COMMUNAUTE DES SANS VOIX
        =================================================== */}

        <section className="mt-8 rounded-[28px] border border-[#e5d8cd] bg-[#faf7f2] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fde7e9] text-[#df8995]">
              <Users
                size={21}
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-[#064b42]">
                Inviter des compagnons
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-[#6f625a]">
                Proposez cette balade à un
                ou plusieurs animaux de la
                Communauté des Sans Voix.
                Leur humain devra accepter
                l&apos;invitation avant que
                le compagnon soit considéré
                comme participant.
              </p>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-[20px] bg-white p-4 shadow-sm">
            <input
              type="checkbox"
              checked={
                inviteCommunity
              }
              onChange={(
                event
              ) => {
                setInviteCommunity(
                  event.target.checked
                );

                if (
                  !event.target.checked
                ) {
                  setSelectedCommunityCompanionIds(
                    []
                  );
                }
              }}
              className="h-5 w-5 accent-[#ef7f61]"
            />

            <div>
              <p className="font-black text-[#064b42]">
                Inviter des Sans Voix
              </p>

              <p className="text-xs text-[#756d67]">
                Sélection multiple possible
              </p>
            </div>
          </label>

          {inviteCommunity && (
            <div className="mt-5">
              {communityLoading ? (
                <div className="rounded-[20px] bg-white p-6 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#eadfd8] border-t-[#064b42]" />

                  <p className="mt-3 text-sm font-bold">
                    Chargement de la communauté...
                  </p>
                </div>
              ) : communityCompanions.length ===
                0 ? (
                <div className="rounded-[20px] bg-white p-6 text-center">
                  <PawPrint
                    size={34}
                    className="mx-auto text-[#df8995]"
                  />

                  <p className="mt-3 font-black">
                    Aucun compagnon public disponible
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={
                        communitySearch
                      }
                      onChange={(
                        event
                      ) =>
                        setCommunitySearch(
                          event.target.value
                        )
                      }
                      placeholder="Rechercher un compagnon..."
                      className="w-full rounded-full border border-[#e5d8cd] bg-white py-3 pl-11 pr-4 outline-none focus:border-[#ef7f61]"
                    />
                  </div>

                  {selectedCommunityCompanionIds.length >
                    0 && (
                    <p className="mt-4 rounded-full bg-[#eaf5f1] px-4 py-2 text-center text-sm font-black text-[#064b42]">
                      {
                        selectedCommunityCompanionIds.length
                      }{" "}
                      compagnon
                      {selectedCommunityCompanionIds.length >
                      1
                        ? "s"
                        : ""}{" "}
                      invité
                      {selectedCommunityCompanionIds.length >
                      1
                        ? "s"
                        : ""}
                    </p>
                  )}

                  <div className="mt-4 grid max-h-[480px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                    {filteredCommunity.map(
                      (
                        companion
                      ) => {
                        const selected =
                          selectedCommunityCompanionIds.includes(
                            companion.id
                          );

                        const age =
                          calculateAge(
                            companion.birth_date
                          );

                        const sex =
                          formatSex(
                            companion.sex
                          );

                        return (
                          <button
                            key={
                              companion.id
                            }
                            type="button"
                            onClick={() =>
                              toggleCommunityCompanion(
                                companion.id
                              )
                            }
                            className={`relative overflow-hidden rounded-[22px] border-2 bg-white text-left transition ${
                              selected
                                ? "border-[#ef7f61] shadow-md"
                                : "border-transparent shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-3 p-3">
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-[#f4eee3]">
                                {companion.photo_url ? (
                                  <img
                                    src={
                                      companion.photo_url
                                    }
                                    alt={
                                      companion.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-3xl">
                                    🐾
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-lg font-black text-[#064b42]">
                                  {
                                    companion.name
                                  }
                                </p>

                                <p className="mt-1 text-xs font-bold text-[#756d67]">
                                  {formatSpecies(
                                    companion.species
                                  )}
                                  {sex
                                    ? ` · ${sex}`
                                    : ""}
                                  {age
                                    ? ` · ${age}`
                                    : ""}
                                </p>

                                {companion.breed && (
                                  <p className="mt-1 truncate text-xs text-[#756d67]">
                                    {
                                      companion.breed
                                    }
                                  </p>
                                )}
                              </div>

                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                  selected
                                    ? "bg-[#ef7f61] text-white"
                                    : "bg-[#f4eee3] text-[#9c9188]"
                                }`}
                              >
                                {selected ? (
                                  <Check
                                    size={17}
                                    strokeWidth={
                                      3
                                    }
                                  />
                                ) : (
                                  <PawPrint
                                    size={16}
                                  />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={
            busy
          }
          className="mt-6 w-full rounded-full bg-[#ef7f61] px-5 py-3.5 font-black text-white disabled:opacity-60"
        >
          {busy
            ? "Création…"
            : selectedCommunityCompanionIds.length >
                0
              ? `Créer la balade et envoyer ${selectedCommunityCompanionIds.length} invitation${
                  selectedCommunityCompanionIds.length >
                  1
                    ? "s"
                    : ""
                }`
              : selectedMyCompanionIds.length >
                  0
                ? `Créer la balade avec ${selectedMyCompanionIds.length} compagnon${
                    selectedMyCompanionIds.length >
                    1
                      ? "s"
                      : ""
                  }`
                : "Créer la balade"}
        </button>
      </form>
    </main>
  );
}