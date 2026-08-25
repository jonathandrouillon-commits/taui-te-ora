"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Mail,
  MapPin,
  Phone,
  Search,
  Stethoscope,
} from "lucide-react";

import TauiPageBackground from "../components/ui/TauiPageBackground";

import {
  supabase,
} from "../lib/supabase";

type Veterinaire = {
  id: string;

  island: string | null;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;

  is_active?: boolean | null;
};

export default function VeterinairesPage() {
  const [
    veterinaires,
    setVeterinaires,
  ] =
    useState<Veterinaire[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    islandFilter,
    setIslandFilter,
  ] =
    useState("");

  useEffect(() => {
    void loadVeterinaires();
  }, []);

  async function loadVeterinaires() {
    try {
      setLoading(true);
      setError("");

      const {
        data,
        error:
          loadError,
      } =
        await supabase
          .from(
            "veterinaires"
          )
          .select(
            `
              id,
              island,
              name,
              city,
              address,
              phone,
              email,
              is_active
            `
          )
          .eq(
            "is_active",
            true
          )
          .order(
            "island",
            {
              ascending: true,
            }
          )
          .order(
            "city",
            {
              ascending: true,
            }
          )
          .order(
            "name",
            {
              ascending: true,
            }
          );

      if (
        loadError
      ) {
        throw loadError;
      }

      setVeterinaires(
        (
          data || []
        ) as Veterinaire[]
      );
    } catch (
      err: any
    ) {
      console.error(
        "Erreur chargement vétérinaires :",
        err
      );

      setError(
        err?.message ||
          "Impossible de charger l'annuaire des vétérinaires."
      );

      setVeterinaires(
        []
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const islands =
    useMemo(() => {
      return Array.from(
        new Set(
          veterinaires
            .map(
              (
                item
              ) =>
                item.island
                  ?.trim()
            )
            .filter(
              Boolean
            ) as string[]
        )
      ).sort(
        (
          a,
          b
        ) =>
          a.localeCompare(
            b,
            "fr"
          )
      );
    }, [
      veterinaires,
    ]);

  const filteredVeterinaires =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return veterinaires.filter(
        (
          item
        ) => {
          if (
            islandFilter &&
            item.island !==
              islandFilter
          ) {
            return false;
          }

          if (
            !query
          ) {
            return true;
          }

          const searchableText =
            [
              item.name,
              item.city,
              item.island,
              item.address,
              item.phone,
              item.email,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();

          return searchableText.includes(
            query
          );
        }
      );
    }, [
      veterinaires,
      search,
      islandFilter,
    ]);

  return (
    <TauiPageBackground>
      <section
        className="
          mx-auto
          max-w-6xl
          px-4
          py-10
          pb-28
        "
      >
        {/* HEADER */}

        <div
          className="
            text-center
          "
        >
          <div
            className="
              mx-auto
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              bg-white/90
              text-[#064b42]
              shadow-xl
            "
          >
            <Stethoscope
              size={38}
            />
          </div>

          <p
            className="
              mt-5
              text-sm
              font-black
              uppercase
              tracking-[0.3em]
              text-[#b58b5b]
            "
          >
            Annuaire
          </p>

          <h1
            className="
              mt-2
              text-4xl
              font-black
              text-[#064b42]
              md:text-6xl
            "
          >
            Vétérinaires
          </h1>

          <p
            className="
              mx-auto
              mt-4
              max-w-2xl
              text-gray-700
            "
          >
            Retrouvez les coordonnées
            des vétérinaires disponibles
            en Polynésie française.
          </p>
        </div>

        {/* FILTRES */}

        <div
          className="
            mt-8
            grid
            gap-3
            rounded-[26px]
            bg-white/90
            p-4
            shadow-lg
            backdrop-blur
            md:grid-cols-2
          "
        >
          <label>
            <span
              className="
                mb-2
                block
                text-sm
                font-black
                text-[#064b42]
              "
            >
              Rechercher
            </span>

            <div
              className="
                relative
              "
            >
              <Search
                size={18}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Nom, ville, adresse..."
                className="
                  w-full
                  rounded-[18px]
                  border
                  border-[#e5d9cf]
                  bg-[#fffaf7]
                  py-3
                  pl-11
                  pr-4
                  outline-none
                  focus:border-[#064b42]
                "
              />
            </div>
          </label>

          <label>
            <span
              className="
                mb-2
                block
                text-sm
                font-black
                text-[#064b42]
              "
            >
              Île
            </span>

            <select
              value={
                islandFilter
              }
              onChange={(
                event
              ) =>
                setIslandFilter(
                  event.target.value
                )
              }
              className="
                w-full
                rounded-[18px]
                border
                border-[#e5d9cf]
                bg-[#fffaf7]
                px-4
                py-3
                outline-none
              "
            >
              <option
                value=""
              >
                Toutes les îles
              </option>

              {islands.map(
                (
                  island
                ) => (
                  <option
                    key={
                      island
                    }
                    value={
                      island
                    }
                  >
                    {
                      island
                    }
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        {/* LOADING */}

        {loading && (
          <div
            className="
              mt-10
              rounded-[28px]
              bg-white/90
              p-10
              text-center
              shadow-lg
            "
          >
            <div
              className="
                mx-auto
                h-10
                w-10
                animate-spin
                rounded-full
                border-4
                border-[#e6ddd4]
                border-t-[#064b42]
              "
            />

            <p
              className="
                mt-4
                font-black
                text-[#064b42]
              "
            >
              Chargement des vétérinaires...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading &&
          error && (
            <div
              className="
                mt-10
                rounded-[28px]
                bg-red-50
                p-6
                text-center
                font-bold
                text-red-600
                shadow
              "
            >
              {error}
            </div>
          )}

        {/* LISTE */}

        {!loading &&
          !error && (
            <>
              <div
                className="
                  mt-6
                  text-sm
                  font-black
                  text-[#064b42]
                "
              >
                {
                  filteredVeterinaires.length
                }{" "}
                vétérinaire
                {filteredVeterinaires.length >
                1
                  ? "s"
                  : ""}
              </div>

              {filteredVeterinaires.length ===
              0 ? (
                <div
                  className="
                    mt-6
                    rounded-[28px]
                    bg-white/90
                    p-10
                    text-center
                    shadow-lg
                  "
                >
                  <Stethoscope
                    size={42}
                    className="
                      mx-auto
                      text-[#a89e96]
                    "
                  />

                  <p
                    className="
                      mt-4
                      font-black
                      text-[#064b42]
                    "
                  >
                    Aucun vétérinaire trouvé.
                  </p>
                </div>
              ) : (
                <div
                  className="
                    mt-6
                    grid
                    gap-5
                    md:grid-cols-2
                    lg:grid-cols-3
                  "
                >
                  {filteredVeterinaires.map(
                    (
                      veterinaire
                    ) => (
                      <article
                        key={
                          veterinaire.id
                        }
                        className="
                          rounded-[28px]
                          border
                          border-white/80
                          bg-white/90
                          p-6
                          shadow-xl
                          backdrop-blur-md
                          transition
                          hover:-translate-y-1
                          hover:shadow-2xl
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-4
                          "
                        >
                          <div>
                            {veterinaire.island && (
                              <span
                                className="
                                  rounded-full
                                  bg-[#e8f4f1]
                                  px-3
                                  py-1
                                  text-xs
                                  font-black
                                  uppercase
                                  tracking-wide
                                  text-[#064b42]
                                "
                              >
                                {
                                  veterinaire.island
                                }
                              </span>
                            )}

                            <h2
                              className="
                                mt-4
                                text-xl
                                font-black
                                text-[#064b42]
                              "
                            >
                              {
                                veterinaire.name
                              }
                            </h2>
                          </div>

                          <Stethoscope
                            size={28}
                            className="
                              shrink-0
                              text-[#df8995]
                            "
                          />
                        </div>

                        <div
                          className="
                            mt-5
                            space-y-3
                            text-sm
                            text-gray-700
                          "
                        >
                          {veterinaire.city && (
                            <p
                              className="
                                flex
                                items-start
                                gap-2
                              "
                            >
                              <MapPin
                                size={16}
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-[#064b42]
                                "
                              />

                              <span>
                                <strong>
                                  Ville :
                                </strong>{" "}
                                {
                                  veterinaire.city
                                }
                              </span>
                            </p>
                          )}

                          {veterinaire.address && (
                            <p
                              className="
                                flex
                                items-start
                                gap-2
                              "
                            >
                              <MapPin
                                size={16}
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-[#b58b5b]
                                "
                              />

                              <span>
                                <strong>
                                  Adresse :
                                </strong>{" "}
                                {
                                  veterinaire.address
                                }
                              </span>
                            </p>
                          )}

                          {veterinaire.phone && (
                            <p
                              className="
                                flex
                                items-start
                                gap-2
                              "
                            >
                              <Phone
                                size={16}
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-[#064b42]
                                "
                              />

                              <span>
                                <strong>
                                  Téléphone :
                                </strong>{" "}
                                {
                                  veterinaire.phone
                                }
                              </span>
                            </p>
                          )}

                          {veterinaire.email && (
                            <p
                              className="
                                flex
                                items-start
                                gap-2
                                break-all
                              "
                            >
                              <Mail
                                size={16}
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-[#064b42]
                                "
                              />

                              <span>
                                <strong>
                                  Mail :
                                </strong>{" "}
                                {
                                  veterinaire.email
                                }
                              </span>
                            </p>
                          )}
                        </div>

                        <div
                          className="
                            mt-6
                            grid
                            gap-2
                          "
                        >
                          {veterinaire.phone && (
                            <a
                              href={`tel:${veterinaire.phone
                                .split("/")[0]
                                .replace(
                                  /[^\d+]/g,
                                  ""
                                )}`}
                              className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-full
                                bg-[#064b42]
                                px-5
                                py-3
                                text-center
                                font-black
                                text-white
                                transition
                                hover:bg-[#08695d]
                              "
                            >
                              <Phone
                                size={17}
                              />

                              Appeler
                            </a>
                          )}

                          {veterinaire.email && (
                            <a
                              href={`mailto:${veterinaire.email}`}
                              className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-full
                                bg-[#f5e7ea]
                                px-5
                                py-3
                                text-center
                                font-black
                                text-[#c76d7b]
                              "
                            >
                              <Mail
                                size={17}
                              />

                              Envoyer un mail
                            </a>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </>
          )}

        <div
          className="
            mt-8
            rounded-[28px]
            border
            border-[#e8d9c3]
            bg-[#fffaf1]/90
            p-6
            text-center
            shadow-lg
            backdrop-blur-md
          "
        >
          <p
            className="
              font-bold
              text-[#6f5b40]
            "
          >
            En cas d'urgence vitale,
            contactez directement le vétérinaire
            le plus proche.
          </p>
        </div>
      </section>
    </TauiPageBackground>
  );
}