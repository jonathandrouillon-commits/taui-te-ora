"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AlertTriangle,
  Clock,
  MapPin,
  PawPrint,
  Search,
  X,
} from "lucide-react";

import {
  supabase,
} from "../lib/supabase";

type AnimalAlertData = {
  signalement_id: string;
  created_at?: string | null;

  type_signalement?: string | null;

  animal_name?: string | null;
  animal_type?: string | null;
  sex?: string | null;
  age_label?: string | null;
  color?: string | null;
  breed?: string | null;

  island?: string | null;
  city?: string | null;
  address?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  disappearance_at?: string | null;
  found_at?: string | null;

  situation?: string | null;
  description?: string | null;

  status?: string | null;

  photo_url?: string | null;
};

export default function LostAnimalAlert() {
  const router =
    useRouter();

  const [
    alert,
    setAlert,
  ] =
    useState<AnimalAlertData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const loadAlert =
    useCallback(async () => {
      try {
        setLoading(true);

        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          setAlert(null);
          return;
        }

        const {
          data,
          error,
        } =
          await supabase.rpc(
            "get_unseen_animal_alert"
          );

        if (error) {
          console.error(
            "Erreur chargement alerte animale :",
            error
          );

          return;
        }

        const firstAlert =
          Array.isArray(data)
            ? data[0]
            : null;

        setAlert(
          (firstAlert as AnimalAlertData) ||
            null
        );
      } catch (error) {
        console.error(
          "Erreur alerte animale :",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    queueMicrotask(
      () => void loadAlert()
    );
  }, [loadAlert]);

  async function markAsSeen() {
    if (!alert) {
      return;
    }

    const {
      error,
    } =
      await supabase.rpc(
        "mark_lost_animal_alert_seen",
        {
          p_signalement_id:
            alert.signalement_id,
        }
      );

    if (error) {
      console.error(
        "Impossible de marquer l'alerte comme vue :",
        error
      );
    }
  }

  async function closeAlert() {
    if (!alert) {
      return;
    }

    await markAsSeen();

    setAlert(null);
  }

  async function openSignalement() {
    if (!alert) {
      return;
    }

    const signalementId =
      alert.signalement_id;

    await markAsSeen();

    setAlert(null);

    router.push(
      `/signalement/${signalementId}`
    );
  }

  if (
    loading ||
    !alert
  ) {
    return null;
  }

  const normalizedType =
    String(
      alert.type_signalement || ""
    )
      .trim()
      .toLowerCase();

  const isFound =
    normalizedType ===
    "animal trouvé";

  const animalName =
    alert.animal_name?.trim() ||
    "Animal";

  const location =
    [
      alert.city,
      alert.island,
    ]
      .filter(Boolean)
      .join(" · ");

  const eventDate =
    isFound
      ? alert.found_at
      : alert.disappearance_at;

  const eventDateLabel =
    eventDate
      ? new Date(
          eventDate
        ).toLocaleString(
          "fr-FR",
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        )
      : null;

  const title =
    isFound
      ? "Animal trouvé"
      : "Alerte disparition";

  const subtitle =
    isFound
      ? "Aidez-nous à retrouver sa famille"
      : "Aidez-nous à le retrouver";

  const locationLabel =
    isFound
      ? "Lieu de découverte"
      : "Dernier lieu connu";

  const dateLabel =
    isFound
      ? "Découvert le"
      : "Disparu le";

  const imageAlt =
    isFound
      ? `Animal trouvé : ${animalName}`
      : `Animal disparu : ${animalName}`;

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-black/60
        p-3
        backdrop-blur-sm
        sm:p-6
      "
    >
      <div
        className="
          relative
          max-h-[94dvh]
          w-full
          max-w-xl
          overflow-y-auto
          rounded-[34px]
          bg-[#f8f4ec]
          shadow-2xl
        "
      >
        <button
          type="button"
          onClick={
            () =>
              void closeAlert()
          }
          aria-label="Fermer l'alerte"
          className="
            absolute
            right-4
            top-4
            z-20
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            bg-white/95
            text-[#064b42]
            shadow-lg
            transition
            hover:scale-105
          "
        >
          <X size={22} />
        </button>

        <div className="relative">
          {alert.photo_url ? (
            <img
              src={alert.photo_url}
              alt={imageAlt}
              className="
                h-[310px]
                w-full
                object-cover
                sm:h-[380px]
              "
            />
          ) : (
            <div
              className="
                flex
                h-[300px]
                items-center
                justify-center
                bg-[#f1dfc7]
              "
            >
              <PawPrint
                size={90}
                className="text-[#b58b5b]"
              />
            </div>
          )}

          <div
            className="
              absolute
              inset-x-0
              bottom-0
              bg-gradient-to-t
              from-black/80
              via-black/30
              to-transparent
              px-6
              pb-6
              pt-20
              text-white
            "
          >
            <div
              className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                px-4
                py-2
                text-xs
                font-black
                uppercase
                tracking-wider
                text-white
                shadow-lg
                ${
                  isFound
                    ? "bg-[#064b42]"
                    : "bg-red-600"
                }
              `}
            >
              {isFound ? (
                <Search
                  size={17}
                />
              ) : (
                <AlertTriangle
                  size={17}
                />
              )}

              {title}
            </div>

            <h2
              className="
                mt-3
                text-4xl
                font-black
                leading-none
              "
            >
              {animalName}
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <p
            className="
              text-center
              text-xl
              font-black
              text-[#064b42]
            "
          >
            {subtitle}
          </p>

          {location && (
            <div
              className="
                mt-5
                rounded-[22px]
                bg-white
                p-4
                shadow-sm
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <MapPin
                  size={21}
                  className="
                    mt-0.5
                    shrink-0
                    text-[#b58b5b]
                  "
                />

                <div>
                  <p
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-wide
                      text-[#b58b5b]
                    "
                  >
                    {locationLabel}
                  </p>

                  <p
                    className="
                      mt-1
                      font-black
                      text-[#064b42]
                    "
                  >
                    {location}
                  </p>

                  {alert.address && (
                    <p
                      className="
                        mt-1
                        text-sm
                        text-[#6f5a47]
                      "
                    >
                      {alert.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {eventDateLabel && (
            <div
              className="
                mt-3
                rounded-[22px]
                bg-white
                p-4
                shadow-sm
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <Clock
                  size={21}
                  className="
                    shrink-0
                    text-[#b58b5b]
                  "
                />

                <div>
                  <p
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-wide
                      text-[#b58b5b]
                    "
                  >
                    {dateLabel}
                  </p>

                  <p
                    className="
                      mt-1
                      font-black
                      text-[#064b42]
                    "
                  >
                    {eventDateLabel}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div
            className="
              mt-5
              flex
              flex-wrap
              justify-center
              gap-2
            "
          >
            {alert.animal_type && (
              <InfoBadge>
                {alert.animal_type}
              </InfoBadge>
            )}

            {alert.sex && (
              <InfoBadge>
                {alert.sex}
              </InfoBadge>
            )}

            {alert.age_label && (
              <InfoBadge>
                {alert.age_label}
              </InfoBadge>
            )}

            {alert.breed && (
              <InfoBadge>
                {alert.breed}
              </InfoBadge>
            )}

            {alert.color && (
              <InfoBadge>
                {alert.color}
              </InfoBadge>
            )}
          </div>

          {alert.description && (
            <p
              className="
                mt-5
                line-clamp-4
                whitespace-pre-line
                text-center
                leading-relaxed
                text-[#6f5a47]
              "
            >
              {alert.description}
            </p>
          )}

          {typeof alert.latitude ===
            "number" &&
            typeof alert.longitude ===
              "number" && (
              <a
                href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="
                  mt-5
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  border-2
                  border-[#064b42]
                  bg-white
                  px-6
                  py-3
                  font-black
                  text-[#064b42]
                  transition
                  hover:bg-[#eef5f2]
                "
              >
                <MapPin
                  size={19}
                />

                Voir le lieu sur la carte
              </a>
            )}

          <button
            type="button"
            onClick={
              () =>
                void openSignalement()
            }
            className="
              mt-5
              w-full
              rounded-full
              bg-[#064b42]
              px-6
              py-4
              text-lg
              font-black
              text-white
              shadow-lg
              transition
              hover:bg-[#08695d]
              active:scale-[0.98]
            "
          >
            Voir le signalement
          </button>

          <button
            type="button"
            onClick={
              () =>
                void closeAlert()
            }
            className="
              mt-3
              w-full
              rounded-full
              px-6
              py-3
              font-bold
              text-[#6f5a47]
              transition
              hover:bg-white
            "
          >
            J&apos;ai vu l&apos;alerte
          </button>

          <p
            className="
              mt-4
              text-center
              text-xs
              leading-relaxed
              text-gray-500
            "
          >
            Chaque regard compte.
            Ensemble, nous pouvons
            aider cet animal à
            retrouver sa famille.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      className="
        rounded-full
        bg-white
        px-4
        py-2
        text-sm
        font-black
        text-[#064b42]
        shadow-sm
      "
    >
      {children}
    </span>
  );
}