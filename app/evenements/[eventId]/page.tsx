"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Share2,
  UserRound,
} from "lucide-react";

import {
  eventService,
  type EventItem,
} from "../../services/event.service";

export default function PublicEventPage() {
  const router = useRouter();
  const params = useParams();

  const eventId =
    String(
      params?.eventId || ""
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    event,
    setEvent,
  ] = useState<EventItem | null>(
    null
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvent() {
      if (!eventId) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data =
          await eventService.getById(
            eventId
          );

        if (!active) {
          return;
        }

        setEvent(data);
      } catch (error: unknown) {
        console.error(
          "Erreur chargement événement public :",
          error
        );

        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger cet événement."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadEvent();

    return () => {
      active = false;
    };
  }, [eventId]);

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

  function openFacebookShare() {
    if (!event) {
      return;
    }

    const shareUrl =
      eventService.getFacebookShareUrl(
        event.id
      );

    window.open(
      shareUrl,
      "_blank",
      "noopener,noreferrer"
    );
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
          Chargement de l&apos;événement...
        </p>
      </main>
    );
  }

  if (
    errorMessage ||
    !event
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-[#fbf7ef]
          px-4
          pb-24
          pt-24
          sm:px-8
        "
      >
        <section
          className="
            mx-auto
            max-w-3xl
          "
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/evenements"
              )
            }
            className="
              flex
              items-center
              gap-2
              font-black
              text-[#064b42]
            "
          >
            <ArrowLeft
              size={20}
            />

            Retour aux événements
          </button>

          <div
            className="
              mt-8
              rounded-[28px]
              border
              border-red-200
              bg-red-50
              p-8
            "
          >
            <h1
              className="
                text-2xl
                font-black
                text-red-800
              "
            >
              Événement indisponible
            </h1>

            <p
              className="
                mt-2
                text-red-700
              "
            >
              {errorMessage ||
                "Cet événement n'est pas disponible."}
            </p>
          </div>
        </section>
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
      <article
        className="
          mx-auto
          max-w-5xl
        "
      >
        <button
          type="button"
          onClick={() =>
            router.push(
              "/evenements"
            )
          }
          className="
            mb-6
            flex
            items-center
            gap-2
            font-black
          "
        >
          <ArrowLeft
            size={20}
          />

          Retour aux événements
        </button>

        {/* VISUEL */}

        <section
          className="
            overflow-hidden
            rounded-[32px]
            border
            border-[#eadfd8]
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              relative
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
                  max-h-[700px]
                  w-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  flex
                  min-h-[360px]
                  flex-col
                  items-center
                  justify-center
                  p-8
                  text-center
                "
              >
                <div
                  className="
                    text-8xl
                  "
                >
                  {eventService.getTypeIcon(
                    event.event_type
                  )}
                </div>

                <p
                  className="
                    mt-4
                    text-lg
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

          {/* CONTENU */}

          <div
            className="
              p-6
              sm:p-8
            "
          >
            <span
              className="
                inline-flex
                rounded-full
                bg-[#fff0f3]
                px-4
                py-2
                text-xs
                font-black
                uppercase
                tracking-[0.08em]
                text-[#c85f72]
              "
            >
              {eventService.getTypeLabel(
                event.event_type
              )}
            </span>

            <h1
              className="
                mt-4
                text-4xl
                font-black
                leading-tight
                text-[#2f241c]
                sm:text-5xl
              "
            >
              {event.title}
            </h1>

            {/* INFOS PRINCIPALES */}

            <div
              className="
                mt-7
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <InfoCard
                icon={
                  <CalendarDays
                    size={22}
                  />
                }
                label="Date"
                value={
                  event.end_date &&
                  event.end_date !==
                    event.start_date
                    ? `${formatDate(
                        event.start_date
                      )} au ${formatDate(
                        event.end_date
                      )}`
                    : formatDate(
                        event.start_date
                      )
                }
              />

              {(event.start_time ||
                event.end_time) && (
                <InfoCard
                  icon={
                    <Clock3
                      size={22}
                    />
                  }
                  label="Horaire"
                  value={[
                    event.start_time
                      ? event.start_time.slice(
                          0,
                          5
                        )
                      : null,
                    event.end_time
                      ? event.end_time.slice(
                          0,
                          5
                        )
                      : null,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(" - ")}
                />
              )}

              {(event.location_name ||
                event.city ||
                event.island ||
                event.address) && (
                <InfoCard
                  icon={
                    <MapPin
                      size={22}
                    />
                  }
                  label="Lieu"
                  value={[
                    event.location_name,
                    event.address,
                    event.city,
                    event.island,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(" · ")}
                />
              )}

              {event.organizer_name && (
                <InfoCard
                  icon={
                    <UserRound
                      size={22}
                    />
                  }
                  label="Organisateur"
                  value={
                    event.organizer_name
                  }
                />
              )}
            </div>

            {/* DESCRIPTION */}

            {event.description && (
              <section
                className="
                  mt-8
                  rounded-[24px]
                  bg-[#fffaf5]
                  p-5
                  sm:p-6
                "
              >
                <h2
                  className="
                    text-xl
                    font-black
                  "
                >
                  À propos de l&apos;événement
                </h2>

                <p
                  className="
                    mt-3
                    whitespace-pre-line
                    text-base
                    leading-7
                    text-[#5f5751]
                  "
                >
                  {event.description}
                </p>
              </section>
            )}

            {/* TARIF */}

            <section
              className="
                mt-6
                rounded-[24px]
                border
                border-[#eadfd8]
                bg-white
                p-5
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-[#9c7b54]
                "
              >
                Participation
              </p>

              <p
                className="
                  mt-1
                  text-xl
                  font-black
                  text-[#2f241c]
                "
              >
                {event.is_free
                  ? "Gratuit"
                  : event.price_label ||
                    "Tarif à consulter"}
              </p>
            </section>

            {/* CONTACT */}

            {(event.contact_name ||
              event.contact_phone ||
              event.contact_email ||
              event.external_url) && (
              <section
                className="
                  mt-6
                  rounded-[24px]
                  border
                  border-[#eadfd8]
                  bg-white
                  p-5
                  sm:p-6
                "
              >
                <h2
                  className="
                    text-xl
                    font-black
                  "
                >
                  Contact
                </h2>

                <div
                  className="
                    mt-4
                    space-y-3
                  "
                >
                  {event.contact_name && (
                    <p
                      className="
                        font-bold
                        text-[#5f5751]
                      "
                    >
                      {
                        event.contact_name
                      }
                    </p>
                  )}

                  {event.contact_phone && (
                    <a
                      href={`tel:${event.contact_phone}`}
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        bg-[#f8f4ec]
                        px-4
                        py-3
                        font-black
                        text-[#064b42]
                      "
                    >
                      <Phone
                        size={18}
                      />

                      {
                        event.contact_phone
                      }
                    </a>
                  )}

                  {event.contact_email && (
                    <a
                      href={`mailto:${event.contact_email}`}
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        bg-[#f8f4ec]
                        px-4
                        py-3
                        font-black
                        text-[#064b42]
                      "
                    >
                      <Mail
                        size={18}
                      />

                      {
                        event.contact_email
                      }
                    </a>
                  )}

                  {event.external_url && (
                    <a
                      href={
                        event.external_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        bg-[#f8f4ec]
                        px-4
                        py-3
                        font-black
                        text-[#064b42]
                      "
                    >
                      <ExternalLink
                        size={18}
                      />

                      Plus d&apos;informations
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* PARTAGE */}

            {event.facebook_share_enabled && (
              <section
                className="
                  mt-7
                "
              >
                <button
                  type="button"
                  onClick={
                    openFacebookShare
                  }
                  className="
                    flex
                    min-h-[52px]
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-2xl
                    bg-[#1877F2]
                    px-6
                    py-4
                    font-black
                    text-white
                    transition
                    hover:opacity-90
                    sm:w-auto
                  "
                >
                  <Share2
                    size={20}
                  />

                  Partager sur Facebook
                </button>
              </section>
            )}
          </div>
        </section>
      </article>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-[22px]
        bg-[#f8f4ec]
        p-5
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <div
          className="
            mt-0.5
            text-[#df8995]
          "
        >
          {icon}
        </div>

        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              text-xs
              font-black
              uppercase
              tracking-[0.12em]
              text-[#9c7b54]
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              font-black
              leading-6
              text-[#2f241c]
            "
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}