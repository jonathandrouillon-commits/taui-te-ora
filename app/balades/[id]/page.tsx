"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../lib/supabase";

import {
  getWalkFacebookShareUrl,
  getWalkPublicUrl,
  getWalkWhatsappShareUrl,
  requestToJoin,
  type Walk,
} from "../../services/walk.service";

type Participant = {
  id: string;
  user_id: string;
  dog_name: string;
  status:
    | "pending"
    | "accepted"
    | "refused";
};

type CompanionInvitation = {
  id: string;
  walk_id: string;
  companion_id: string;
  invited_by: string;
  owner_id: string;
  status: "pending" | "accepted" | "refused";
  companion: {
    id: string;
    name: string;
    species: string;
    photo_url: string | null;
  } | null;
};

type Message = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export default function WalkDetailsPage() {
  const {
    id,
  } =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const [
    walk,
    setWalk,
  ] =
    useState<Walk | null>(
      null
    );

  const [
    participants,
    setParticipants,
  ] =
    useState<Participant[]>(
      []
    );

  const [
    companionInvitations,
    setCompanionInvitations,
  ] =
    useState<CompanionInvitation[]>(
      []
    );

  const [
    invitationBusyId,
    setInvitationBusyId,
  ] =
    useState<string | null>(
      null
    );

  const [
    messages,
    setMessages,
  ] =
    useState<Message[]>(
      []
    );

  const [
    userId,
    setUserId,
  ] =
    useState<string | null>(
      null
    );

  const [
    dogName,
    setDogName,
  ] =
    useState("");

  const [
    notice,
    setNotice,
  ] =
    useState("");

  const [
    copyNotice,
    setCopyNotice,
  ] =
    useState("");

  const load =
    useCallback(
      async () => {
        const [
          {
            data:
              auth,
          },

          {
            data:
              walkData,
          },

          {
            data:
              participantData,
          },
        ] =
          await Promise.all([
            supabase
              .auth
              .getUser(),

            supabase
              .from(
                "community_walks"
              )
              .select("*")
              .eq(
                "id",
                id
              )
              .single(),

            supabase
              .from(
                "walk_participants"
              )
              .select(
                "id,user_id,dog_name,status"
              )
              .eq(
                "walk_id",
                id
              ),
          ]);

        setUserId(
          auth.user?.id ||
            null
        );

        setWalk(
          walkData as Walk
        );

        setParticipants(
          (
            participantData as Participant[]
          ) ||
            []
        );

        if (auth.user) {
          const {
            data: invitationData,
            error: invitationLoadError,
          } = await supabase
            .from(
              "community_walk_companion_invitations"
            )
            .select(`
              id,
              walk_id,
              companion_id,
              invited_by,
              owner_id,
              status,
              companion:companions (
                id,
                name,
                species,
                photo_url
              )
            `)
            .eq(
              "walk_id",
              id
            )
            .eq(
              "owner_id",
              auth.user.id
            )
            .order(
              "id",
              {
                ascending: true,
              }
            );

          if (invitationLoadError) {
            console.error(
              "Erreur chargement invitations compagnons :",
              invitationLoadError
            );
            setCompanionInvitations([]);
          } else {
            setCompanionInvitations(
              (invitationData || []).map(
                (invitation: any) => ({
                  ...invitation,
                  companion:
                    Array.isArray(
                      invitation.companion
                    )
                      ? invitation.companion[0] ||
                        null
                      : invitation.companion ||
                        null,
                })
              ) as CompanionInvitation[]
            );
          }
        } else {
          setCompanionInvitations([]);
        }

        const canLoadChat =
          Boolean(
            auth.user &&
              (
                participantData?.some(
                  (participant) =>
                    participant.user_id ===
                      auth.user?.id &&
                    participant.status ===
                      "accepted"
                ) ||
                walkData?.organizer_id ===
                  auth.user?.id
              )
          );

        if (canLoadChat) {
          const {
            data,
          } =
            await supabase
              .from(
                "walk_messages"
              )
              .select(
                "id,user_id,body,created_at"
              )
              .eq(
                "walk_id",
                id
              )
              .order(
                "created_at"
              );

          setMessages(
            (
              data as Message[]
            ) ||
              []
          );
        } else {
          setMessages([]);
        }
      },
      [
        id,
      ]
    );

  useEffect(
    () => {
      void load();
    },
    [
      load,
    ]
  );

  async function join(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      const {
        error,
      } =
        await requestToJoin(
          id,
          dogName.trim()
        );

      if (error) {
        throw error;
      }

      setNotice(
        "Ta demande a été envoyée à l’organisateur."
      );

      setDogName("");

      await load();
    } catch {
      setNotice(
        "Impossible d’envoyer la demande. Vérifie que tu es connecté."
      );
    }
  }

  async function decide(
    participantId: string,
    status:
      | "accepted"
      | "refused"
  ) {
    await supabase
      .from(
        "walk_participants"
      )
      .update({
        status,
      })
      .eq(
        "id",
        participantId
      );

    await load();
  }

  async function decideCompanionInvitation(
    invitation: CompanionInvitation,
    status: "accepted" | "refused"
  ) {
    if (!userId) {
      setNotice(
        "Connecte-toi pour répondre à cette invitation."
      );
      return;
    }

    try {
      setInvitationBusyId(
        invitation.id
      );
      setNotice("");

      const {
        error: updateError,
      } = await supabase
        .from(
          "community_walk_companion_invitations"
        )
        .update({
          status,
        })
        .eq(
          "id",
          invitation.id
        )
        .eq(
          "owner_id",
          userId
        );

      if (updateError) {
        throw updateError;
      }

      if (status === "accepted") {
        const {
          data: existingParticipant,
          error: existingError,
        } = await supabase
          .from(
            "community_walk_companions"
          )
          .select("companion_id")
          .eq(
            "walk_id",
            id
          )
          .eq(
            "companion_id",
            invitation.companion_id
          )
          .maybeSingle();

        if (existingError) {
          throw existingError;
        }

        if (!existingParticipant) {
          const {
            error: participantError,
          } = await supabase
            .from(
              "community_walk_companions"
            )
            .insert({
              walk_id: id,
              companion_id:
                invitation.companion_id,
              owner_id: userId,
              participation_type:
                "invited",
            });

          if (participantError) {
            throw participantError;
          }
        }

        setNotice(
          `${
            invitation.companion?.name ||
            "Ton compagnon"
          } participera à cette balade 🐾`
        );
      } else {
        setNotice(
          "Invitation refusée."
        );
      }

      await load();
    } catch (cause) {
      console.error(
        "Erreur réponse invitation compagnon :",
        cause
      );

      setNotice(
        cause instanceof Error
          ? cause.message
          : "Impossible de répondre à l'invitation."
      );
    } finally {
      setInvitationBusyId(
        null
      );
    }
  }

  async function send(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const body =
      String(
        form.get(
          "body"
        ) ||
          ""
      ).trim();

    if (
      !body ||
      !userId
    ) {
      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          "walk_messages"
        )
        .insert({
          walk_id:
            id,

          user_id:
            userId,

          body,
        });

    if (!error) {
      event.currentTarget.reset();

      await load();
    }
  }

  function shareFacebook() {
    window.open(
      getWalkFacebookShareUrl(
        id
      ),
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareWhatsapp() {
    if (!walk) {
      return;
    }

    window.open(
      getWalkWhatsappShareUrl(
        id,
        walk.title
      ),
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyLink() {
    const url =
      getWalkPublicUrl(
        id
      );

    try {
      await navigator.clipboard.writeText(
        url
      );

      setCopyNotice(
        "Lien copié ✓"
      );
    } catch {
      window.prompt(
        "Copiez ce lien :",
        url
      );
    }
  }

  if (!walk) {
    return (
      <main className="min-h-screen bg-[#f4eee3] p-8 text-center font-bold text-[#064b42]">
        Chargement…
      </main>
    );
  }

  const mine =
    participants.find(
      (participant) =>
        participant.user_id ===
        userId
    );

  const canChat =
    walk.organizer_id ===
      userId ||
    mine?.status ===
      "accepted";

  const acceptedCount =
    participants.filter(
      (participant) =>
        participant.status ===
        "accepted"
    ).length;

  const paceLabel =
    walk.pace ===
    "calme"
      ? "Tranquille"
      : walk.pace ===
        "sportive"
      ? "Sportif"
      : "Modéré";

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42]">
      <section className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-5 font-black"
        >
          ← Retour
        </button>

        <article className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-[#d96b4c]">
                🐾 Balade & Copains
              </p>

              <h1 className="text-3xl font-black">
                {walk.title}
              </h1>
            </div>

            <span className="h-fit rounded-full bg-[#e5f4ef] px-4 py-2 text-sm font-black">
              {acceptedCount}/
              {walk.max_dogs} chiens
            </span>
          </div>

          <div className="mt-6 space-y-2 font-bold">
            <p>
              📍 {walk.location}
            </p>

            <p>
              📅{" "}
              {new Intl.DateTimeFormat(
                "fr-FR",
                {
                  dateStyle:
                    "full",
                  timeStyle:
                    "short",
                }
              ).format(
                new Date(
                  walk.starts_at
                )
              )}
            </p>

            <p>
              🚶{" "}
              {
                walk.duration_minutes
              }{" "}
              minutes ·{" "}
              {paceLabel}
            </p>

            <p>
              🐕 {walk.audience}
            </p>
          </div>

          {walk.description && (
            <p className="mt-5 whitespace-pre-line text-[#416c66]">
              {walk.description}
            </p>
          )}

          <div className="mt-6 rounded-2xl bg-[#fff4e8] p-4 text-sm">
            <strong>
              Règle de la communauté :
            </strong>{" "}
            cette balade est consacrée
            à la socialisation et au
            bien-être. Les propositions
            de reproduction ou de
            saillie sont interdites.
          </div>

          <section className="mt-7">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#9c7b54]">
              Partager cette balade
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={
                  shareFacebook
                }
                className="rounded-2xl bg-[#1877F2] px-5 py-3 font-black text-white"
              >
                Facebook
              </button>

              <button
                type="button"
                onClick={
                  shareWhatsapp
                }
                className="rounded-2xl bg-[#25D366] px-5 py-3 font-black text-white"
              >
                WhatsApp
              </button>

              <button
                type="button"
                onClick={() =>
                  void copyLink()
                }
                className="rounded-2xl border border-[#d9cec7] bg-white px-5 py-3 font-black text-[#064b42]"
              >
                Copier le lien
              </button>
            </div>

            {copyNotice && (
              <p className="mt-2 text-sm font-bold text-[#416c66]">
                {copyNotice}
              </p>
            )}
          </section>

          {!userId && (
            <Link
              href={`/login?redirect=/balades/${id}`}
              className="mt-6 block rounded-full bg-[#ef7f61] px-5 py-3 text-center font-black text-white"
            >
              Se connecter pour
              participer
            </Link>
          )}

          {userId &&
            companionInvitations.length >
              0 && (
              <section className="mt-6 rounded-[26px] border border-[#f0d8cf] bg-[#fff8f4] p-5">
                <h2 className="text-xl font-black text-[#064b42]">
                  🐾 Invitations pour mes compagnons
                </h2>

                <p className="mt-1 text-sm text-[#6f625a]">
                  Un autre membre de la communauté souhaite partager cette balade avec l&apos;un de tes compagnons.
                </p>

                <div className="mt-4 space-y-3">
                  {companionInvitations.map(
                    (invitation) => (
                      <div
                        key={
                          invitation.id
                        }
                        className="rounded-[22px] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[#f4eee3]">
                            {invitation.companion?.photo_url ? (
                              <img
                                src={
                                  invitation.companion.photo_url
                                }
                                alt={
                                  invitation.companion.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-2xl">
                                🐾
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-black text-[#064b42]">
                              {invitation.companion?.name ||
                                "Mon compagnon"}
                            </p>

                            {invitation.status ===
                            "pending" ? (
                              <p className="mt-1 text-sm font-bold text-[#d96b4c]">
                                Invitation en attente
                              </p>
                            ) : invitation.status ===
                              "accepted" ? (
                              <p className="mt-1 text-sm font-bold text-[#0c7164]">
                                ✅ Invitation acceptée
                              </p>
                            ) : (
                              <p className="mt-1 text-sm font-bold text-[#756d67]">
                                Invitation refusée
                              </p>
                            )}
                          </div>
                        </div>

                        {invitation.status ===
                          "pending" && (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={
                                invitationBusyId ===
                                invitation.id
                              }
                              onClick={() =>
                                void decideCompanionInvitation(
                                  invitation,
                                  "accepted"
                                )
                              }
                              className="rounded-full bg-[#0c7164] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                            >
                              Accepter
                            </button>

                            <button
                              type="button"
                              disabled={
                                invitationBusyId ===
                                invitation.id
                              }
                              onClick={() =>
                                void decideCompanionInvitation(
                                  invitation,
                                  "refused"
                                )
                              }
                              className="rounded-full bg-gray-100 px-4 py-3 text-sm font-black text-[#064b42] disabled:opacity-60"
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

          {userId &&
            walk.organizer_id !==
              userId &&
            !mine && (
              <form
                onSubmit={join}
                className="mt-6 flex gap-2"
              >
                <input
                  required
                  value={
                    dogName
                  }
                  onChange={(
                    event
                  ) =>
                    setDogName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Prénom de ton chien"
                  className="min-w-0 flex-1 rounded-full border border-[#d9cec7] px-4"
                />

                <button className="rounded-full bg-[#ef7f61] px-5 py-3 font-black text-white">
                  Demander à participer
                </button>
              </form>
            )}

          {mine && (
            <p className="mt-5 rounded-2xl bg-[#e5f4ef] p-4 font-bold">
              {mine.status ===
              "pending"
                ? "⏳ Demande en attente"
                : mine.status ===
                  "accepted"
                ? "✅ Participation acceptée"
                : "Demande non retenue"}
            </p>
          )}

          {notice && (
            <p className="mt-3 text-sm font-bold">
              {notice}
            </p>
          )}

          {walk.organizer_id ===
            userId &&
            participants.some(
              (participant) =>
                participant.status ===
                "pending"
            ) && (
              <div className="mt-7">
                <h2 className="text-xl font-black">
                  Demandes à valider
                </h2>

                {participants
                  .filter(
                    (
                      participant
                    ) =>
                      participant.status ===
                      "pending"
                  )
                  .map(
                    (
                      participant
                    ) => (
                      <div
                        key={
                          participant.id
                        }
                        className="mt-3 flex items-center justify-between rounded-2xl border border-[#e5ddd2] p-3"
                      >
                        <strong>
                          🐕{" "}
                          {
                            participant.dog_name
                          }
                        </strong>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void decide(
                                participant.id,
                                "accepted"
                              )
                            }
                            className="rounded-full bg-[#0c7164] px-3 py-2 text-sm font-black text-white"
                          >
                            Accepter
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void decide(
                                participant.id,
                                "refused"
                              )
                            }
                            className="rounded-full bg-gray-100 px-3 py-2 text-sm font-black"
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    )
                  )}
              </div>
            )}
        </article>

        {canChat && (
          <section className="mt-5 rounded-[32px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">
              💬 Discussion de la balade
            </h2>

            <p className="mt-1 text-xs text-[#416c66]">
              Visible uniquement par
              l’organisateur et les
              participants acceptés.
            </p>

            <div className="mt-5 max-h-96 space-y-3 overflow-y-auto">
              {messages.length ===
                0 && (
                <p className="rounded-2xl bg-[#f4eee3] p-4 text-sm">
                  Aucun message.
                  Présentez-vous et
                  précisez le rendez-vous.
                </p>
              )}

              {messages.map(
                (
                  message
                ) => (
                  <div
                    key={
                      message.id
                    }
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      message.user_id ===
                      userId
                        ? "ml-auto bg-[#0c7164] text-white"
                        : "bg-[#f4eee3]"
                    }`}
                  >
                    <p>
                      {message.body}
                    </p>

                    <time className="mt-1 block text-[10px] opacity-70">
                      {new Intl.DateTimeFormat(
                        "fr-FR",
                        {
                          dateStyle:
                            "short",
                          timeStyle:
                            "short",
                        }
                      ).format(
                        new Date(
                          message.created_at
                        )
                      )}
                    </time>
                  </div>
                )
              )}
            </div>

            <form
              onSubmit={send}
              className="mt-4 flex gap-2"
            >
              <input
                name="body"
                required
                maxLength={
                  1000
                }
                placeholder="Écrire au groupe…"
                className="min-w-0 flex-1 rounded-full border border-[#d9cec7] px-4 py-3"
              />

              <button className="rounded-full bg-[#ef7f61] px-5 font-black text-white">
                Envoyer
              </button>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}
