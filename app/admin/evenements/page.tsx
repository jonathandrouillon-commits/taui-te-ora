"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  eventService,
  type EventItem,
} from "../../services/event.service";

import { supabase } from "../../lib/supabase";

export default function AdminEventsPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [events, setEvents] =
    useState<EventItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [actionId, setActionId] =
    useState<string | null>(null);

  const loadEvents =
    useCallback(async () => {
      const data =
        await eventService.getAllAdmin();

      setEvents(data);
    }, []);

  const initialize =
    useCallback(async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace(
            "/login?redirect=/admin/evenements"
          );

          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const role =
          String(
            profile?.role || ""
          )
            .trim()
            .toLowerCase();

        if (
          ![
            "admin",
            "administrateur",
          ].includes(role)
        ) {
          router.replace("/");
          return;
        }

        await loadEvents();
      } catch (error: unknown) {
        console.error(
          "Erreur administration événements :",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Impossible de charger les événements."
        );
      } finally {
        setLoading(false);
      }
    }, [
      router,
      loadEvents,
    ]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const filteredEvents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return events;
      }

      return events.filter(
        (event) => {
          const text = [
            event.title,
            event.event_type,
            event.organizer_name,
            event.location_name,
            event.city,
            event.island,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(
            query
          );
        }
      );
    }, [
      events,
      search,
    ]);

  const publishedCount =
    events.filter(
      (item) =>
        item.is_published
    ).length;

  const draftCount =
    events.length -
    publishedCount;

  async function togglePublished(
    event: EventItem
  ) {
    try {
      setActionId(event.id);

      await eventService.setPublished(
        event.id,
        !event.is_published
      );

      await loadEvents();
    } catch (error: unknown) {
      alert(
        error instanceof Error
          ? error.message
          : "Impossible de modifier la publication."
      );
    } finally {
      setActionId(null);
    }
  }

  async function deleteEvent(
    event: EventItem
  ) {
    const first =
      window.confirm(
        `Supprimer l'événement "${event.title}" ?`
      );

    if (!first) {
      return;
    }

    const second =
      window.confirm(
        "Cette suppression est définitive. Confirmer ?"
      );

    if (!second) {
      return;
    }

    try {
      setActionId(event.id);

      await eventService.delete(
        event.id
      );

      setEvents(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              event.id
          )
      );
    } catch (error: unknown) {
      alert(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer l'événement."
      );
    } finally {
      setActionId(null);
    }
  }

  function formatDate(
    value: string
  ) {
    try {
      return new Intl.DateTimeFormat(
        "fr-FR",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      ).format(
        new Date(
          `${value}T12:00:00`
        )
      );
    } catch {
      return value;
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef]">
        <p className="font-black text-[#064b42]">
          Chargement des événements...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-4 pb-24 pt-24 text-[#064b42] sm:px-8">
      <section className="mx-auto max-w-7xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/dashboard"
            )
          }
          className="mb-6 flex items-center gap-2 font-black"
        >
          <ArrowLeft size={20} />
          Retour dashboard
        </button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
              Administration
            </p>

            <h1 className="mt-1 text-4xl font-black sm:text-5xl">
              Événements
            </h1>

            <p className="mt-2 max-w-2xl text-[#756d67]">
              Créez, modifiez,
              publiez ou supprimez
              les événements de
              TAUI TE ORA.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/evenements/nouveau"
              )
            }
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-6 py-3 font-black text-white shadow-md"
          >
            <Plus size={20} />
            Créer un événement
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total"
            value={events.length}
          />

          <StatCard
            label="Publiés"
            value={publishedCount}
          />

          <StatCard
            label="Brouillons"
            value={draftCount}
          />
        </div>

        <div className="relative mt-8 max-w-xl">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher un événement..."
            className="w-full rounded-2xl border border-[#eadfd8] bg-white py-4 pl-12 pr-4 font-semibold outline-none"
          />
        </div>

        <div className="mt-8 space-y-5">

          {filteredEvents.length ===
          0 ? (
            <div className="rounded-[28px] border border-[#eadfd8] bg-white p-10 text-center">

              <CalendarDays
                size={44}
                className="mx-auto text-[#df8995]"
              />

              <h2 className="mt-4 text-2xl font-black">
                Aucun événement
              </h2>

              <p className="mt-2 text-gray-500">
                Créez votre premier
                événement.
              </p>

            </div>
          ) : (
            filteredEvents.map(
              (event) => {
                const busy =
                  actionId ===
                  event.id;

                return (
                  <article
                    key={event.id}
                    className="overflow-hidden rounded-[28px] border border-[#eadfd8] bg-white shadow-sm"
                  >
                    <div className="grid lg:grid-cols-[230px_1fr]">

                      <div className="flex min-h-[190px] items-center justify-center overflow-hidden bg-[#f4eee5]">

                        {event.image_url ? (
                          <img
                            src={
                              event.image_url
                            }
                            alt={
                              event.title
                            }
                            className="h-full min-h-[190px] w-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-5xl">
                              {eventService.getTypeIcon(
                                event.event_type
                              )}
                            </div>

                            <p className="mt-2 text-sm font-bold text-[#756d67]">
                              Aucun visuel
                            </p>
                          </div>
                        )}

                      </div>

                      <div className="p-6">

                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="rounded-full bg-[#fff0f3] px-3 py-1 text-xs font-black text-[#c85f72]">
                                {eventService.getTypeLabel(
                                  event.event_type
                                )}
                              </span>

                              <span
                                className={
                                  event.is_published
                                    ? "rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700"
                                    : "rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600"
                                }
                              >
                                {event.is_published
                                  ? "Publié"
                                  : "Brouillon"}
                              </span>

                            </div>

                            <h2 className="mt-3 text-2xl font-black text-[#2f241c]">
                              {event.title}
                            </h2>

                            <div className="mt-3 space-y-1 text-sm font-semibold text-[#756d67]">

                              <p>
                                📅{" "}
                                {formatDate(
                                  event.start_date
                                )}
                              </p>

                              {event.start_time && (
                                <p>
                                  🕒{" "}
                                  {event.start_time.slice(
                                    0,
                                    5
                                  )}
                                  {event.end_time
                                    ? ` - ${event.end_time.slice(
                                        0,
                                        5
                                      )}`
                                    : ""}
                                </p>
                              )}

                              {(event.location_name ||
                                event.city ||
                                event.island) && (
                                <p>
                                  📍{" "}
                                  {[
                                    event.location_name,
                                    event.city,
                                    event.island,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}

                              {event.organizer_name && (
                                <p>
                                  🤝{" "}
                                  {
                                    event.organizer_name
                                  }
                                </p>
                              )}

                            </div>

                            {event.description && (
                              <p className="mt-4 line-clamp-3 max-w-3xl text-sm leading-6 text-gray-500">
                                {
                                  event.description
                                }
                              </p>
                            )}

                          </div>

                          <div className="flex flex-wrap gap-2 xl:max-w-[450px] xl:justify-end">

                            {event.is_published && (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/evenements/${event.id}`
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl bg-[#f3ecdf] px-4 py-3 font-black text-[#8b653c]"
                              >
                                <Eye size={17} />
                                Voir
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/admin/evenements/${event.id}/edit`
                                )
                              }
                              className="flex items-center gap-2 rounded-xl bg-[#064b42] px-4 py-3 font-black text-white"
                            >
                              <Pencil size={17} />
                              Modifier
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void togglePublished(
                                  event
                                )
                              }
                              className={
                                event.is_published
                                  ? "flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-3 font-black text-amber-800 disabled:opacity-50"
                                  : "flex items-center gap-2 rounded-xl bg-green-100 px-4 py-3 font-black text-green-700 disabled:opacity-50"
                              }
                            >
                              {event.is_published ? (
                                <>
                                  <EyeOff
                                    size={17}
                                  />
                                  Masquer
                                </>
                              ) : (
                                <>
                                  <Eye
                                    size={17}
                                  />
                                  Publier
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void deleteEvent(
                                  event
                                )
                              }
                              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-black text-red-700 disabled:opacity-50"
                            >
                              <Trash2
                                size={17}
                              />
                              Supprimer
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>
                  </article>
                );
              }
            )
          )}

        </div>

      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[24px] border border-[#eadfd8] bg-white p-5 shadow-sm">

      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9c7b54]">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black text-[#064b42]">
        {value}
      </p>

    </div>
  );
}