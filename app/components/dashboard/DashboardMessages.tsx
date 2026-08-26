"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

type ConversationRow = {
  id: string;
  animal_id: string | null;
  adoption_request_id: string | null;
  requester_id: string;
  owner_id: string;
  created_at: string | null;
  updated_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
  deleted_at: string | null;
};

type AnimalRow = {
  id: string;
  animal_name: string | null;
  animal_photos?: {
    photo_url: string;
    is_cover?: boolean | null;
  }[] | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

type PreferenceRow = {
  conversation_id: string;
  is_archived: boolean;
};

type ConversationItem = {
  conversation: ConversationRow;
  animal: AnimalRow | null;
  participantLabel: string;
  participantAvatar: string;
  lastMessage: MessageRow | null;
  unreadCount: number;
  isArchived: boolean;
};

type DashboardMessagesProps = {
  fullPage?: boolean;
};

export default function DashboardMessages({
  fullPage = false,
}: DashboardMessagesProps) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setItems([]);
        return;
      }

      setCurrentUserId(user.id);

      const { data: currentProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const role = String(
        currentProfile?.role || user.user_metadata?.role || ""
      )
        .trim()
        .toLowerCase();

      let conversationQuery = supabase
        .from("conversations")
        .select(
          "id, animal_id, adoption_request_id, requester_id, owner_id, created_at, updated_at"
        )
        .order("updated_at", {
          ascending: false,
        })
        .limit(200);

      if (role !== "admin") {
        conversationQuery = conversationQuery.or(
          `requester_id.eq.${user.id},owner_id.eq.${user.id}`
        );
      }

      const { data: conversationData, error: conversationError } =
        await conversationQuery;

      if (conversationError) {
        throw conversationError;
      }

      const conversations =
        (conversationData || []) as ConversationRow[];

      if (conversations.length === 0) {
        setItems([]);
        return;
      }

      const conversationIds = conversations.map(
        (conversation) => conversation.id
      );

      const animalIds = Array.from(
        new Set(
          conversations
            .map((conversation) => conversation.animal_id)
            .filter(Boolean)
        )
      ) as string[];

      const profileIds = Array.from(
        new Set(
          conversations.flatMap((conversation) => [
            conversation.requester_id,
            conversation.owner_id,
          ])
        )
      );

      const [messagesResult, preferencesResult, animalsResult, profilesResult] =
        await Promise.all([
          supabase
            .from("conversation_messages")
            .select(
              "id, conversation_id, sender_id, message, created_at, read_at, deleted_at"
            )
            .in("conversation_id", conversationIds)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("conversation_preferences")
            .select("conversation_id, is_archived")
            .eq("user_id", user.id)
            .in("conversation_id", conversationIds),

          animalIds.length > 0
            ? supabase
                .from("animals")
                .select(
                  `
                    id,
                    animal_name,
                    animal_photos (
                      photo_url,
                      is_cover
                    )
                  `
                )
                .in("id", animalIds)
            : Promise.resolve({
                data: [] as AnimalRow[],
                error: null,
              }),

          profileIds.length > 0
            ? supabase
                .from("profiles")
                .select(
                  "id, first_name, last_name, organization_name, avatar_url, role"
                )
                .in("id", profileIds)
            : Promise.resolve({
                data: [] as ProfileRow[],
                error: null,
              }),
        ]);

      if (messagesResult.error) {
        throw messagesResult.error;
      }

      if (preferencesResult.error) {
        throw preferencesResult.error;
      }

      if (animalsResult.error) {
        throw animalsResult.error;
      }

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      const messages = (messagesResult.data || []) as MessageRow[];
      const preferences =
        (preferencesResult.data || []) as PreferenceRow[];
      const animals = (animalsResult.data || []) as unknown as AnimalRow[];
      const profiles = (profilesResult.data || []) as ProfileRow[];

      const animalsById = new Map(
        animals.map((animal) => [animal.id, animal])
      );

      const profilesById = new Map(
        profiles.map((profile) => [profile.id, profile])
      );

      const preferencesByConversation = new Map(
        preferences.map((preference) => [
          preference.conversation_id,
          preference,
        ])
      );

      const lastMessageByConversation = new Map<string, MessageRow>();
      const unreadByConversation = new Map<string, number>();

      messages.forEach((message) => {
        if (!lastMessageByConversation.has(message.conversation_id)) {
          lastMessageByConversation.set(
            message.conversation_id,
            message
          );
        }

        if (
          message.sender_id !== user.id &&
          !message.read_at &&
          !message.deleted_at
        ) {
          unreadByConversation.set(
            message.conversation_id,
            (unreadByConversation.get(message.conversation_id) || 0) + 1
          );
        }
      });

      const conversationItems = conversations.map((conversation) => {
        const requester = profilesById.get(conversation.requester_id) || null;
        const owner = profilesById.get(conversation.owner_id) || null;

        let participantLabel = "Conversation d’adoption";
        let participantAvatar = "";

        if (user.id === conversation.requester_id) {
          participantLabel = getProfileName(owner);
          participantAvatar = owner?.avatar_url || "";
        } else if (user.id === conversation.owner_id) {
          participantLabel = getProfileName(requester);
          participantAvatar = requester?.avatar_url || "";
        } else {
          participantLabel = `${getProfileName(requester)} ↔ ${getProfileName(
            owner
          )}`;
        }

        return {
          conversation,
          animal: conversation.animal_id
            ? animalsById.get(conversation.animal_id) || null
            : null,
          participantLabel,
          participantAvatar,
          lastMessage:
            lastMessageByConversation.get(conversation.id) || null,
          unreadCount: unreadByConversation.get(conversation.id) || 0,
          isArchived:
            preferencesByConversation.get(conversation.id)?.is_archived ||
            false,
        };
      });

      setItems(conversationItems);
    } catch (error: unknown) {
      console.error("Erreur chargement messagerie :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les conversations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadConversations();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadConversations]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const channel = supabase
      .channel(`dashboard-messages-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_messages",
        },
        () => {
          void loadConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        () => {
          void loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadConversations]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => item.isArchived === showArchived),
    [items, showArchived]
  );

  const displayedItems = fullPage
    ? filteredItems
    : filteredItems.slice(0, 6);

  const unreadCount = items
    .filter((item) => !item.isArchived)
    .reduce((total, item) => total + item.unreadCount, 0);

  async function setConversationArchived(
    conversationId: string,
    isArchived: boolean
  ) {
    if (!currentUserId || actionId) {
      return;
    }

    try {
      setActionId(conversationId);

      const now = new Date().toISOString();

      const { error } = await supabase
        .from("conversation_preferences")
        .upsert(
          {
            conversation_id: conversationId,
            user_id: currentUserId,
            is_archived: isArchived,
            archived_at: isArchived ? now : null,
            updated_at: now,
          },
          {
            onConflict: "conversation_id,user_id",
          }
        );

      if (error) {
        throw error;
      }

      setItems((previousItems) =>
        previousItems.map((item) =>
          item.conversation.id === conversationId
            ? {
                ...item,
                isArchived,
              }
            : item
        )
      );
    } catch (error: unknown) {
      console.error("Erreur archivage conversation :", error);
      alert(
        error instanceof Error
          ? error.message
          : "Impossible de modifier cette conversation."
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="rounded-[30px] bg-white p-5 shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#df8995]">
            Messagerie
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#064b42]">
            {fullPage ? "Toutes mes conversations" : "Mes messages"}
          </h2>

          <p className="mt-1 text-sm text-[#6f5a47]">
            Vos échanges concernant les demandes d’adoption.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#fde7e9] px-4 py-2 text-sm font-black text-[#9d4354]">
            💬 {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
          </span>

          {fullPage ? (
            <button
              type="button"
              onClick={() => setShowArchived((previous) => !previous)}
              className="rounded-full border border-[#d9cec7] bg-white px-4 py-2 text-sm font-black text-[#064b42]"
            >
              {showArchived ? "Conversations actives" : "Conversations archivées"}
            </button>
          ) : (
            <Link
              href="/messages"
              className="rounded-full bg-[#064b42] px-4 py-2 text-sm font-black text-white"
            >
              Voir tout
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-3xl bg-[#f8f4ec] p-6 text-center text-[#6f5a47]">
          Chargement des conversations...
        </div>
      ) : errorMessage ? (
        <div className="mt-5 rounded-3xl bg-red-50 p-6 text-center text-red-700">
          {errorMessage}
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-[#f8f4ec] p-8 text-center text-[#6f5a47]">
          {showArchived
            ? "Aucune conversation archivée."
            : "Aucune conversation pour le moment."}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {displayedItems.map((item) => {
            const photo = getAnimalPhoto(item.animal);
            const lastMessageText = item.lastMessage?.deleted_at
              ? "Ce message a été supprimé."
              : item.lastMessage?.message || "Nouvelle conversation";

            return (
              <article
                key={item.conversation.id}
                className={`flex items-center gap-3 rounded-3xl border p-3 transition ${
                  item.unreadCount > 0
                    ? "border-[#ef8196] bg-[#fff3f5]"
                    : "border-[#eadfd8] bg-[#f8f4ec]"
                }`}
              >
                <Link
                  href={`/messages/${item.conversation.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={item.animal?.animal_name || "Animal"}
                      className="h-14 w-14 shrink-0 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#efd5d7] text-2xl">
                      🐾
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-black text-[#064b42]">
                        {item.animal?.animal_name || "Demande d’adoption"}
                      </h3>

                      {item.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-[#ef8196] px-2 py-0.5 text-[10px] font-black text-white">
                          {item.unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="truncate text-xs font-semibold text-[#8b6a52]">
                      {item.participantLabel}
                    </p>

                    <p className="mt-1 truncate text-sm text-[#6f5a47]">
                      {lastMessageText}
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-right text-[10px] text-[#91877f] sm:block">
                    {formatConversationDate(
                      item.lastMessage?.created_at ||
                        item.conversation.updated_at ||
                        item.conversation.created_at
                    )}
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    void setConversationArchived(
                      item.conversation.id,
                      !item.isArchived
                    )
                  }
                  disabled={actionId === item.conversation.id}
                  title={item.isArchived ? "Restaurer" : "Archiver"}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm disabled:opacity-50"
                >
                  {actionId === item.conversation.id
                    ? "…"
                    : item.isArchived
                      ? "↩️"
                      : "📥"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getProfileName(profile: ProfileRow | null) {
  if (!profile) {
    return "Utilisateur";
  }

  return (
    profile.organization_name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    "Utilisateur"
  );
}

function getAnimalPhoto(animal: AnimalRow | null) {
  if (!animal?.animal_photos?.length) {
    return "";
  }

  const cover = animal.animal_photos.find((photo) => photo.is_cover);
  return cover?.photo_url || animal.animal_photos[0]?.photo_url || "";
}

function formatConversationDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
