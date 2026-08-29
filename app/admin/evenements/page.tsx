"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  CalendarDays,
  MapPin,
  Clock3,
} from "lucide-react";

import {
  eventService,
  type EventItem,
} from "../services/event.service";

export default function EventsPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    events,
    setEvents,
  ] = useState<EventItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        setLoading(true);

        const data =
          await eventService.getPublished();

        if (!active) {
          return;
        }

        setEvents(
          data
        );
      } catch (error) {
        console.error(
          "Erreur chargement événements :",
          error
        );
      } finally {
        if (active) {
          setLoading(
            false
          );
        }
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  const upcoming =
    useMemo(
      () =>
        events.filter(
          (event) =>
            event.start_date >=
            today
        ),
      [
        events,
        today,
      ]
    );

  const past =
    useMemo(
      () =>
        events
          .filter(
            (event) =>
              event.start_date <
              today
          )
          .sort(
            (
              a,
              b
            ) =>
              b.start_date.localeCompare(
                a.start_date
              )
          ),
      [
        events,
        today,
      ]
    );

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
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#fbf7ef]
        "
      >
        <p
          className="
            font-black
            text-[#064b42]
          "
        >
          Chargement des événements...
        </p>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#fbf7ef]
        px-4
        pb-24
        pt-24
        text-[#064b42]
        sm:px-8
      "
    >
      <section
        className="
          mx-auto
          max-w-7xl
        "
      >
        <div
          className="
            max-w-3xl
          "
        >
          <p
            className="
              text-xs
              font-black
              uppercase
              tracking-[0.22em]
              text-[#df8995]
            "
          >
            TAUI TE ORA
          </p>

          <h1
            className="
              mt-1
              text-4xl
              font-black
              sm:text-5xl
            "
          >
            Événements
          </h1>

          <p
            className="
              mt-3
              text-base
              leading-7
              text-[#756d67]
            "
          >
            Retrouvez les journées
            animales, collectes de
            croquettes, tombolas,
            journées adoption et
            autres événements en
            faveur des animaux.
          </p>
        </div>

        <EventSection
          title="Événements à venir"
          events={
            upcoming
          }
          emptyText="Aucun événement à venir pour le moment."
          formatDate={
            formatDate
          }
        />

        {past.length >
          0 && (
          <EventSection
            title="Événements passés"
            events={
              past
            }
            emptyText=""
            formatDate={
              formatDate
            }
            past
          />
        )}
      </section>
    </main>
  );
}

function EventSection({
  title,
  events,
  emptyText,
  formatDate,
  past = false,
}: {
  title: string;
  events: EventItem[];
  emptyText: string;
  formatDate:
    (value: string) =>
      string;
  past?: boolean;
}) {
  return (
    <section
      className="
        mt-12
      "
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <CalendarDays
          size={28}
          className="
            text-[#df8995]
          "
        />

        <h2
          className="
            text-3xl
            font-black
          "
        >
          {title}
        </h2>
      </div>

      {events.length ===
      0 ? (
        <div
          className="
            mt-6
            rounded-[28px]
            border
            border-[#eadfd8]
            bg-white
            p-8
          "
        >
          <p
            className="
              text-[#756d67]
            "
          >
            {emptyText}
          </p>
        </div>
      ) : (
        <div
          className="
            mt-6
            grid
            gap-6
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          {events.map(
            (event) => (
              <EventCard
                key={
                  event.id
                }
                event={
                  event
                }
                formatDate={
                  formatDate
                }
                past={
                  past
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function EventCard({
  event,
  formatDate,
  past,
}: {
  event: EventItem;
  formatDate:
    (value: string) =>
      string;
  past: boolean;
}) {
  return (
    <article
      className={`
        overflow-hidden
        rounded-[28px]
        border
        border-[#eadfd8]
        bg-white
        shadow-sm
        ${
          past
            ? "opacity-80"
            : ""
        }
      `}
    >
      <div
        className="
          aspect-[4/3]
          overflow-hidden
          bg-[#f4eee5]
        "
      >
        {event.image_url ? (
          <img
            src={
              event.image_url
            }
            alt={
              event.title
            }
            className="
              h-full
              w-full
              object-cover
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <div
              className="
                text-6xl
              "
            >
              {eventService.getTypeIcon(
                event.event_type
              )}
            </div>

            <p
              className="
                mt-3
                font-black
                text-[#756d67]
              "
            >
              {eventService.getTypeLabel(
                event.event_type
              )}
            </p>
          </div>
        )}
      </div>

      <div
        className="
          p-6
        "
      >
        <span
          className="
            inline-flex
            rounded-full
            bg-[#fff0f3]
            px-3
            py-1
            text-xs
            font-black
            text-[#c85f72]
          "
        >
          {eventService.getTypeLabel(
            event.event_type
          )}
        </span>

        <h3
          className="
            mt-3
            text-2xl
            font-black
            text-[#2f241c]
          "
        >
          {event.title}
        </h3>

        <div
          className="
            mt-4
            space-y-2
            text-sm
            font-semibold
            text-[#756d67]
          "
        >
          <div
            className="
              flex
              items-start
              gap-2
            "
          >
            <CalendarDays
              size={18}
              className="
                mt-0.5
                shrink-0
              "
            />

            <span>
              {formatDate(
                event.start_date
              )}

              {event.end_date &&
              event.end_date !==
                event.start_date
                ? ` au ${formatDate(
                    event.end_date
                  )}`
                : ""}
            </span>
          </div>

          {event.start_time && (
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <Clock3
                size={18}
              />

              <span>
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
              </span>
            </div>
          )}

          {(event.city ||
            event.island ||
            event.location_name) && (
            <div
              className="
                flex
                items-start
                gap-2
              "
            >
              <MapPin
                size={18}
                className="
                  mt-0.5
                  shrink-0
                "
              />

              <span>
                {[
                  event.location_name,
                  event.city,
                  event.island,
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " · "
                  )}
              </span>
            </div>
          )}
        </div>

        {event.description && (
          <p
            className="
              mt-4
              line-clamp-4
              text-sm
              leading-6
              text-gray-500
            "
          >
            {event.description}
          </p>
        )}

        <Link
          href={`/evenements/${event.id}`}
          className="
            mt-6
            flex
            min-h-[48px]
            items-center
            justify-center
            rounded-2xl
            bg-[#064b42]
            px-5
            py-3
            font-black
            text-white
            transition
            hover:bg-[#08695d]
          "
        >
          Voir l&apos;événement
        </Link>
      </div>
    </article>
  );
}