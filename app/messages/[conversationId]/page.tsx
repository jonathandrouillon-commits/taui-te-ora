"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "../../lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type Conversation = {
  id: string;
  animal_id: string;
  adoption_request_id: string;
  requester_id: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at?: string | null;
};

type AnimalPhoto = {
  photo_url: string;
  is_cover?: boolean | null;
};

type Animal = {
  id: string;
  animal_name: string | null;
  animal_type?: string | null;
  animal_photos?: AnimalPhoto[];
};

type Profile = {
  id: string;
  organization_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

/* =========================================================
   PAGE
========================================================= */

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();

  const conversationId =
    Array.isArray(
      params.conversationId
    )
      ? params.conversationId[0]
      : String(
          params.conversationId ||
            ""
        );

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState("");

  const [
    currentUserRole,
    setCurrentUserRole,
  ] = useState("");

  const [
    conversation,
    setConversation,
  ] =
    useState<Conversation | null>(
      null
    );

  const [animal, setAnimal] =
    useState<Animal | null>(
      null
    );

  const [
    otherProfile,
    setOtherProfile,
  ] =
    useState<Profile | null>(
      null
    );

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    newMessage,
    setNewMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  useEffect(() => {
    if (!conversationId) {
      router.replace("/");
      return;
    }

    loadConversation();
  }, [conversationId]);

  /* =========================================================
     REALTIME
  ========================================================= */

  useEffect(() => {
    if (
      !conversationId ||
      !currentUserId
    ) {
      return;
    }

    const channel =
      supabase
        .channel(
          `conversation-${conversationId}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table:
              "conversation_messages",
            filter:
              `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const incoming =
              payload.new as Message;

            setMessages(
              (
                previousMessages
              ) => {
                const exists =
                  previousMessages.some(
                    (message) =>
                      message.id ===
                      incoming.id
                  );

                if (exists) {
                  return previousMessages;
                }

                return [
                  ...previousMessages,
                  incoming,
                ];
              }
            );

            if (
              incoming.sender_id !==
              currentUserId
            ) {
              markMessageAsRead(
                incoming.id
              );
            }
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [
    conversationId,
    currentUserId,
  ]);

  /* =========================================================
     SCROLL AUTOMATIQUE
  ========================================================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  /* =========================================================
     CHARGEMENT CONVERSATION
  ========================================================= */

  async function loadConversation() {
    try {
      setLoading(true);
      setErrorMessage("");

      /* =====================================================
         UTILISATEUR
      ===================================================== */

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/login?redirect=" +
            encodeURIComponent(
              `/messages/${conversationId}`
            )
        );

        return;
      }

      setCurrentUserId(
        user.id
      );

      /* =====================================================
         ROLE
      ===================================================== */

      let role =
        String(
          user.user_metadata
            ?.role || ""
        )
          .toLowerCase()
          .trim();

      /*
       * Sécurité :
       * si le rôle n'est pas présent
       * dans les metadata Auth,
       * on regarde profiles.
       */

      if (!role) {
        const {
          data: currentProfile,
        } =
          await supabase
            .from("profiles")
            .select("role")
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        role =
          String(
            currentProfile?.role ||
              ""
          )
            .toLowerCase()
            .trim();
      }

      setCurrentUserRole(
        role
      );

      /* =====================================================
         CONVERSATION
      ===================================================== */

      const {
        data:
          conversationData,
        error:
          conversationError,
      } =
        await supabase
          .from("conversations")
          .select(
            `
              id,
              animal_id,
              adoption_request_id,
              requester_id,
              owner_id,
              created_at,
              updated_at
            `
          )
          .eq(
            "id",
            conversationId
          )
          .single();

      if (
        conversationError ||
        !conversationData
      ) {
        throw (
          conversationError ||
          new Error(
            "Conversation introuvable."
          )
        );
      }

      /* =====================================================
         AUTORISATION
      ===================================================== */

      const isParticipant =
        conversationData
          .requester_id ===
          user.id ||
        conversationData
          .owner_id ===
          user.id;

      const isAdmin =
        role === "admin";

      if (
        !isParticipant &&
        !isAdmin
      ) {
        throw new Error(
          "Vous n'avez pas accès à cette conversation."
        );
      }

      setConversation(
        conversationData as Conversation
      );

      /* =====================================================
         ANIMAL
         
         IMPORTANT :
         animals.photo_url N'EXISTE PAS.
         Les photos viennent de animal_photos.
      ===================================================== */

      const {
        data: animalData,
        error: animalError,
      } =
        await supabase
          .from("animals")
          .select(
            `
              id,
              animal_name,
              animal_type,
              animal_photos (
                photo_url,
                is_cover
              )
            `
          )
          .eq(
            "id",
            conversationData
              .animal_id
          )
          .single();

      if (animalError) {
        console.error(
          "Erreur animal :",
          animalError
        );
      }

      if (animalData) {
        setAnimal(
          animalData as Animal
        );
      } else {
        setAnimal(null);
      }

      /* =====================================================
         AUTRE PARTICIPANT
      ===================================================== */

      const otherUserId =
        user.id ===
        conversationData
          .requester_id
          ? conversationData
              .owner_id
          : conversationData
              .requester_id;

      /*
       * Si l'admin consulte une conversation
       * dont il n'est pas participant,
       * on affiche prioritairement
       * la structure propriétaire.
       */

      const profileId =
        isAdmin &&
        !isParticipant
          ? conversationData
              .owner_id
          : otherUserId;

      const {
        data: profileData,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            `
              id,
              organization_name,
              avatar_url,
              role
            `
          )
          .eq(
            "id",
            profileId
          )
          .maybeSingle();

      if (profileError) {
        console.error(
          "Erreur profil :",
          profileError
        );
      }

      setOtherProfile(
        (profileData as Profile) ||
          null
      );

      /* =====================================================
         MESSAGES
      ===================================================== */

      const {
        data: messagesData,
        error: messagesError,
      } =
        await supabase
          .from(
            "conversation_messages"
          )
          .select(
            `
              id,
              conversation_id,
              sender_id,
              message,
              created_at,
              read_at
            `
          )
          .eq(
            "conversation_id",
            conversationId
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

      if (messagesError) {
        throw messagesError;
      }

      setMessages(
        (messagesData ||
          []) as Message[]
      );

      /* =====================================================
         MARQUER LES MESSAGES COMME LUS
      ===================================================== */

      const unreadIds =
        (
          messagesData || []
        )
          .filter(
            (message) =>
              message.sender_id !==
                user.id &&
              !message.read_at
          )
          .map(
            (message) =>
              message.id
          );

      if (
        unreadIds.length > 0
      ) {
        const {
          error: readError,
        } =
          await supabase
            .from(
              "conversation_messages"
            )
            .update({
              read_at:
                new Date()
                  .toISOString(),
            })
            .in(
              "id",
              unreadIds
            );

        if (readError) {
          console.error(
            "Erreur mise à jour messages lus :",
            readError
          );
        }
      }

      /* =====================================================
         NOTIFICATIONS LUES
      ===================================================== */

      const {
        error:
          notificationReadError,
      } =
        await supabase
          .from("notifications")
          .update({
            is_read:
              true,

            read_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "recipient_id",
            user.id
          )
          .eq(
            "conversation_id",
            conversationId
          )
          .eq(
            "is_read",
            false
          );

      if (
        notificationReadError
      ) {
        console.error(
          "Erreur notifications lues :",
          notificationReadError
        );
      }
    } catch (
      error: any
    ) {
      console.error(
        "Erreur chat :",
        error
      );

      setErrorMessage(
        error?.message ||
          "Impossible d'ouvrir cette conversation."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     MESSAGE LU
  ========================================================= */

  async function markMessageAsRead(
    messageId: string
  ) {
    try {
      const { error } =
        await supabase
          .from(
            "conversation_messages"
          )
          .update({
            read_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            messageId
          );

      if (error) {
        console.error(
          "Erreur lecture message :",
          error
        );

        return;
      }

      setMessages(
        (
          previousMessages
        ) =>
          previousMessages.map(
            (message) =>
              message.id ===
              messageId
                ? {
                    ...message,

                    read_at:
                      new Date()
                        .toISOString(),
                  }
                : message
          )
      );
    } catch (error) {
      console.error(
        "Erreur lecture message :",
        error
      );
    }
  }

  /* =========================================================
     ENVOYER MESSAGE
  ========================================================= */

  async function sendMessage() {
    try {
      if (
        sending ||
        !conversation ||
        !currentUserId
      ) {
        return;
      }

      const text =
        newMessage.trim();

      if (!text) {
        return;
      }

      /* =====================================================
         SEULS LES PARTICIPANTS PEUVENT ECRIRE
      ===================================================== */

      const isParticipant =
        currentUserId ===
          conversation
            .requester_id ||
        currentUserId ===
          conversation
            .owner_id;

      if (!isParticipant) {
        alert(
          "L'administrateur peut consulter cette conversation mais ne peut pas écrire dans cet échange."
        );

        return;
      }

      setSending(true);

      /* =====================================================
         INSERT MESSAGE
      ===================================================== */

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "conversation_messages"
          )
          .insert({
            conversation_id:
              conversation.id,

            sender_id:
              currentUserId,

            message:
              text,
          })
          .select()
          .single();

      if (error) {
        throw error;
      }

      setMessages(
        (
          previousMessages
        ) => {
          if (
            previousMessages.some(
              (message) =>
                message.id ===
                data.id
            )
          ) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            data as Message,
          ];
        }
      );

      setNewMessage("");

      /* =====================================================
         UPDATE CONVERSATION
      ===================================================== */

      const {
        error:
          conversationUpdateError,
      } =
        await supabase
          .from(
            "conversations"
          )
          .update({
            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            conversation.id
          );

      if (
        conversationUpdateError
      ) {
        console.error(
          "Erreur mise à jour conversation :",
          conversationUpdateError
        );
      }

      /* =====================================================
         NOTIFICATION DESTINATAIRE
         
         TABLE REELLE notifications :
         
         user_id
         recipient_id
         title
         message
         type
         animal_id
         adoption_request_id
         is_read
         conversation_id
         read_at
      ===================================================== */

      const recipientId =
        currentUserId ===
        conversation
          .requester_id
          ? conversation
              .owner_id
          : conversation
              .requester_id;

      const animalName =
        animal?.animal_name ||
        "cet animal";

      const preview =
        text.length > 90
          ? `${text.slice(
              0,
              90
            )}…`
          : text;

      const {
        error:
          notificationError,
      } =
        await supabase
          .from("notifications")
          .insert({
            user_id:
              recipientId,

            recipient_id:
              recipientId,

            animal_id:
              conversation
                .animal_id,

            adoption_request_id:
              conversation
                .adoption_request_id,

            conversation_id:
              conversation.id,

            type:
              "chat_message",

            title:
              `Nouveau message — ${animalName}`,

            message:
              preview,

            is_read:
              false,
          });

      if (
        notificationError
      ) {
        console.error(
          "Erreur notification message :",
          notificationError
        );
      }
    } catch (
      error: any
    ) {
      console.error(
        "Erreur envoi message :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'envoyer le message."
      );
    } finally {
      setSending(false);
    }
  }

  /* =========================================================
     ENTREE CLAVIER
  ========================================================= */

  function handleKeyDown(
    event:
      React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  }

  /* =========================================================
     PHOTO ANIMAL
  ========================================================= */

  function getAnimalPhoto() {
    if (!animal) {
      return "";
    }

    const photos =
      animal.animal_photos ||
      [];

    const cover =
      photos.find(
        (photo) =>
          photo.is_cover
      );

    return (
      cover?.photo_url ||
      photos[0]?.photo_url ||
      ""
    );
  }

  /* =========================================================
     NOM AUTRE PARTICIPANT
  ========================================================= */

  function getOtherParticipantName() {
    if (
      otherProfile
        ?.organization_name
    ) {
      return otherProfile
        .organization_name;
    }

    const role =
      String(
        otherProfile?.role ||
          ""
      ).toLowerCase();

    if (
      role ===
      "association"
    ) {
      return "Association";
    }

    if (
      role ===
      "refuge"
    ) {
      return "Refuge / SIGFA";
    }

    if (
      role ===
      "benevole"
    ) {
      return "Bénévole indépendant";
    }

    if (
      role ===
      "fourriere"
    ) {
      return "Fourrière";
    }

    if (
      role ===
      "adoptant"
    ) {
      return "Adoptant";
    }

    return "Utilisateur Taui Te Ora";
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-[100dvh]
          items-center
          justify-center
          bg-[#f4eee3]
          px-5
        "
      >
        <div
          className="
            rounded-[28px]
            bg-white
            px-8
            py-7
            text-center
            shadow-xl
          "
        >
          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="
              mx-auto
              h-20
              w-20
              object-contain
            "
          />

          <div
            className="
              mx-auto
              mt-5
              h-9
              w-9
              animate-spin
              rounded-full
              border-4
              border-[#efd5d7]
              border-t-[#df8995]
            "
          />

          <p
            className="
              mt-4
              font-black
              text-[#064b42]
            "
          >
            Ouverture de la conversation...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERREUR
  ========================================================= */

  if (
    errorMessage ||
    !conversation
  ) {
    return (
      <main
        className="
          flex
          min-h-[100dvh]
          items-center
          justify-center
          bg-[#f4eee3]
          px-5
        "
      >
        <div
          className="
            w-full
            max-w-md
            rounded-[30px]
            bg-white
            p-8
            text-center
            shadow-xl
          "
        >
          <div className="text-5xl">
            🐾
          </div>

          <h1
            className="
              mt-4
              text-2xl
              font-black
              text-[#064b42]
            "
          >
            Conversation indisponible
          </h1>

          <p
            className="
              mt-3
              text-gray-600
            "
          >
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="
              mt-6
              rounded-full
              bg-[#064b42]
              px-6
              py-3
              font-black
              text-white
            "
          >
            Retour aux animaux
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     DONNEES CHAT
  ========================================================= */

  const animalPhoto =
    getAnimalPhoto();

  const otherName =
    getOtherParticipantName();

  const isAdminViewer =
    currentUserRole ===
      "admin" &&
    currentUserId !==
      conversation
        .requester_id &&
    currentUserId !==
      conversation.owner_id;

  /* =========================================================
     CHAT
  ========================================================= */

  return (
    <main
      className="
        flex
        h-[100dvh]
        flex-col
        overflow-hidden
        bg-[#f4eee3]
        text-[#3f3934]
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header
        className="
          relative
          z-30
          shrink-0
          border-b
          border-[#eadfd8]
          bg-[#fffaf7]/95
          px-4
          py-3
          shadow-sm
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-3xl
            items-center
            gap-3
          "
        >
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#f3ebe5]
              text-xl
              font-bold
              text-[#064b42]
            "
          >
            ←
          </button>

          {/* =================================================
              ANIMAL
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              router.push(
                `/animal/${conversation.animal_id}`
              )
            }
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-3
              text-left
            "
          >
            {animalPhoto ? (
              <img
                src={
                  animalPhoto
                }
                alt={
                  animal
                    ?.animal_name ||
                  "Animal"
                }
                className="
                  h-12
                  w-12
                  shrink-0
                  rounded-full
                  border-2
                  border-white
                  object-cover
                  shadow
                "
              />
            ) : (
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#efd5d7]
                  text-xl
                "
              >
                🐾
              </div>
            )}

            <div className="min-w-0">
              <h1
                className="
                  truncate
                  text-lg
                  font-black
                  text-[#064b42]
                "
              >
                {animal
                  ?.animal_name ||
                  "Adoption"}
              </h1>

              <p
                className="
                  truncate
                  text-xs
                  font-semibold
                  text-[#7a746d]
                "
              >
                {isAdminViewer
                  ? "Consultation administrateur"
                  : `Conversation avec ${otherName}`}
              </p>
            </div>
          </button>

          {/* =================================================
              PROFIL AUTRE PARTICIPANT
          ================================================== */}

          {otherProfile
            ?.avatar_url ? (
            <img
              src={
                otherProfile
                  .avatar_url
              }
              alt={
                otherName
              }
              title={
                otherName
              }
              className="
                h-11
                w-11
                shrink-0
                rounded-full
                border-2
                border-white
                object-cover
                shadow
              "
            />
          ) : (
            <div
              title={
                otherName
              }
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                border-2
                border-white
                bg-[#fff3dc]
                shadow
              "
            >
              🐾
            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          ADMIN
      ====================================================== */}

      {isAdminViewer && (
        <div
          className="
            shrink-0
            bg-[#fff0d5]
            px-4
            py-2
            text-center
            text-xs
            font-bold
            text-[#80663f]
          "
        >
          Mode administrateur : vous consultez cet échange sans y participer.
        </div>
      )}

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      <section
        className="
          min-h-0
          flex-1
          overflow-y-auto
          px-4
          py-5
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-3xl
            flex-col
            gap-3
          "
        >
          {/* =================================================
              INTRO
          ================================================== */}

          <div
            className="
              mx-auto
              mb-3
              max-w-sm
              rounded-[20px]
              bg-white/75
              px-5
              py-4
              text-center
              text-xs
              leading-relaxed
              text-[#706a64]
              shadow-sm
            "
          >
            Cette conversation concerne la demande d&apos;adoption de{" "}
            <strong>
              {animal
                ?.animal_name ||
                "cet animal"}
            </strong>
            .
          </div>

          {messages.length ===
            0 && (
            <div
              className="
                py-12
                text-center
                text-sm
                text-[#8a837b]
              "
            >
              Aucun message pour le moment.
            </div>
          )}

          {messages.map(
            (message) => {
              const mine =
                message.sender_id ===
                currentUserId;

              return (
                <div
                  key={
                    message.id
                  }
                  className={`
                    flex
                    ${
                      mine
                        ? "justify-end"
                        : "justify-start"
                    }
                  `}
                >
                  <div
                    className={`
                      max-w-[82%]
                      rounded-[22px]
                      px-4
                      py-3
                      shadow-sm
                      ${
                        mine
                          ? "rounded-br-[6px] bg-[#ef8196] text-white"
                          : "rounded-bl-[6px] bg-white text-[#45403b]"
                      }
                    `}
                  >
                    <p
                      className="
                        whitespace-pre-wrap
                        break-words
                        text-[14px]
                        leading-relaxed
                      "
                    >
                      {
                        message.message
                      }
                    </p>

                    <div
                      className={`
                        mt-1.5
                        flex
                        items-center
                        justify-end
                        gap-1
                        text-[9px]
                        ${
                          mine
                            ? "text-white/75"
                            : "text-[#999087]"
                        }
                      `}
                    >
                      <span>
                        {formatTime(
                          message.created_at
                        )}
                      </span>

                      {mine && (
                        <span>
                          {message
                            .read_at
                            ? "✓✓"
                            : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )}

          <div
            ref={
              bottomRef
            }
          />
        </div>
      </section>

      {/* =====================================================
          SAISIE
      ====================================================== */}

      {!isAdminViewer && (
        <footer
          className="
            shrink-0
            border-t
            border-[#eadfd8]
            bg-[#fffaf7]/97
            px-3
            pb-[max(10px,env(safe-area-inset-bottom))]
            pt-3
            backdrop-blur-xl
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-3xl
              items-end
              gap-2
            "
          >
            <textarea
              value={
                newMessage
              }
              onChange={(
                event
              ) =>
                setNewMessage(
                  event.target
                    .value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={
                sending
              }
              rows={1}
              placeholder="Écrire un message..."
              className="
                max-h-32
                min-h-[48px]
                flex-1
                resize-none
                rounded-[22px]
                border
                border-[#e4d8cf]
                bg-white
                px-4
                py-3
                text-[14px]
                outline-none
                transition
                placeholder:text-[#a29b94]
                focus:border-[#ef8196]
                focus:ring-2
                focus:ring-[#ef8196]/15
              "
            />

            <button
              type="button"
              onClick={
                sendMessage
              }
              disabled={
                sending ||
                !newMessage.trim()
              }
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#064b42]
                text-xl
                font-black
                text-white
                shadow-lg
                transition
                active:scale-95
                disabled:opacity-40
              "
            >
              {sending
                ? "…"
                : "➤"}
            </button>
          </div>

          <p
            className="
              mt-2
              text-center
              text-[9px]
              text-[#999087]
            "
          >
            Entrée pour envoyer · Maj + Entrée pour revenir à la ligne
          </p>
        </footer>
      )}
    </main>
  );
}

/* =========================================================
   HEURE
========================================================= */

function formatTime(
  date: string
) {
  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(date)
    );
  } catch {
    return "";
  }
}