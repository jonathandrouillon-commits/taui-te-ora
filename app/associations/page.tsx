"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Search,
} from "lucide-react";

import TauiPageBackground from "../components/ui/TauiPageBackground";
import { supabase } from "../lib/supabase";

type AnimalAssociation = {
  id: string;
  archipel: string | null;
  island: string;
  city: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
};

export default function AssociationsPage() {
  const [
    associations,
    setAssociations,
  ] = useState<
    AnimalAssociation[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    selectedArchipel,
    setSelectedArchipel,
  ] = useState("");

  const loadAssociations = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "animal_associations"
          )
          .select(
            `
              id,
              archipel,
              island,
              city,
              name,
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
            "archipel",
            {
              ascending:
                true,
            }
          )
          .order(
            "island",
            {
              ascending:
                true,
            }
          )
          .order(
            "name",
            {
              ascending:
                true,
            }
          );

      if (
        error
      ) {
        throw error;
      }

      setAssociations(
        (data || []) as AnimalAssociation[]
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur chargement associations :",
        error
      );

      alert(
        error?.message ||
          "Impossible de charger les associations."
      );
    } finally {
      setLoading(
        false
      );
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadAssociations());
  }, [loadAssociations]);

  const archipels =
    useMemo(() => {
      return Array.from(
        new Set(
          associations
            .map(
              (
                association
              ) =>
                association.archipel
            )
            .filter(
              Boolean
            )
        )
      ).sort() as string[];
    }, [
      associations,
    ]);

  const filteredAssociations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return associations.filter(
        (
          association
        ) => {
          if (
            selectedArchipel &&
            association.archipel !==
              selectedArchipel
          ) {
            return false;
          }

          if (
            !query
          ) {
            return true;
          }

          const searchable =
            [
              association.archipel,
              association.island,
              association.city,
              association.name,
              association.phone,
              association.email,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      associations,
      search,
      selectedArchipel,
    ]);

  const groupedAssociations =
    useMemo(() => {
      const groups =
        new Map<
          string,
          AnimalAssociation[]
        >();

      for (
        const association of
        filteredAssociations
      ) {
        const archipel =
          association.archipel ||
          "Autres";

        if (
          !groups.has(
            archipel
          )
        ) {
          groups.set(
            archipel,
            []
          );
        }

        groups
          .get(
            archipel
          )!
          .push(
            association
          );
      }

      return Array.from(
        groups.entries()
      );
    }, [
      filteredAssociations,
    ]);

  function cleanPhone(
    phone: string
  ) {
    return phone.replace(
      /[^0-9+]/g,
      ""
    );
  }

  return (
    <TauiPageBackground>
      <main
        className="
          mx-auto
          max-w-7xl
          px-4
          pb-32
          pt-20
          sm:px-6
        "
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <section
          className="
            text-center
          "
        >
          <div
            className="
              mx-auto
              flex
              h-24
              w-24
              items-center
              justify-center
              rounded-full
              bg-white/90
              shadow-xl
            "
          >
            <PawPrint
              size={44}
              className="
                text-[#df8995]
              "
            />
          </div>

          <p
            className="
              mt-5
              text-xs
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
            Associations
          </h1>

          <p
            className="
              mx-auto
              mt-4
              max-w-2xl
              text-base
              leading-7
              text-[#6f665f]
            "
          >
            Retrouvez les associations engagées
            dans la protection animale en Polynésie
            française.
          </p>
        </section>

        {/* =====================================================
            FILTRES
        ====================================================== */}

        <section
          className="
            mt-10
            rounded-[28px]
            bg-white/90
            p-5
            shadow-lg
            backdrop-blur
          "
        >
          <div
            className="
              grid
              gap-4
              md:grid-cols-[1fr_280px]
            "
          >
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
                placeholder="Rechercher une association, une île, une commune..."
                className="
                  w-full
                  rounded-[18px]
                  border
                  border-[#eadfd8]
                  bg-[#fffaf7]
                  py-3
                  pl-11
                  pr-4
                  outline-none
                  focus:border-[#064b42]
                "
              />
            </div>

            <select
              value={
                selectedArchipel
              }
              onChange={(
                event
              ) =>
                setSelectedArchipel(
                  event.target.value
                )
              }
              className="
                w-full
                rounded-[18px]
                border
                border-[#eadfd8]
                bg-[#fffaf7]
                px-4
                py-3
                font-bold
                text-[#064b42]
                outline-none
              "
            >
              <option
                value=""
              >
                Tous les archipels
              </option>

              {archipels.map(
                (
                  archipel
                ) => (
                  <option
                    key={
                      archipel
                    }
                    value={
                      archipel
                    }
                  >
                    {
                      archipel
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        {/* =====================================================
            CHARGEMENT
        ====================================================== */}

        {loading && (
          <section
            className="
              mt-10
              rounded-[30px]
              bg-white/90
              p-10
              text-center
              shadow-lg
            "
          >
            <div
              className="
                mx-auto
                h-12
                w-12
                animate-spin
                rounded-full
                border-4
                border-[#eadfd8]
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
              Chargement des associations...
            </p>
          </section>
        )}

        {/* =====================================================
            AUCUN RESULTAT
        ====================================================== */}

        {!loading &&
          filteredAssociations.length ===
            0 && (
            <section
              className="
                mt-10
                rounded-[30px]
                bg-white/90
                p-10
                text-center
                shadow-lg
              "
            >
              <div
                className="
                  text-5xl
                "
              >
                🐾
              </div>

              <h2
                className="
                  mt-4
                  text-2xl
                  font-black
                  text-[#064b42]
                "
              >
                Aucune association trouvée
              </h2>

              <p
                className="
                  mt-2
                  text-gray-500
                "
              >
                Modifiez votre recherche ou
                sélectionnez un autre archipel.
              </p>
            </section>
          )}

        {/* =====================================================
            LISTE PAR ARCHIPEL
        ====================================================== */}

        {!loading &&
          groupedAssociations.map(
            ([
              archipel,
              items,
            ]) => (
              <section
                key={
                  archipel
                }
                className="
                  mt-10
                "
              >
                <div
                  className="
                    mb-5
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-full
                      bg-[#e8f4f1]
                      text-xl
                    "
                  >
                    🏝️
                  </div>

                  <div>
                    <p
                      className="
                        text-xs
                        font-black
                        uppercase
                        tracking-[0.18em]
                        text-[#b58b5b]
                      "
                    >
                      Archipel
                    </p>

                    <h2
                      className="
                        text-2xl
                        font-black
                        text-[#064b42]
                      "
                    >
                      {
                        archipel
                      }
                    </h2>
                  </div>
                </div>

                <div
                  className="
                    grid
                    gap-5
                    md:grid-cols-2
                    xl:grid-cols-3
                  "
                >
                  {items.map(
                    (
                      association
                    ) => (
                      <article
                        key={
                          association.id
                        }
                        className="
                          flex
                          h-full
                          flex-col
                          rounded-[28px]
                          border
                          border-white/80
                          bg-white/90
                          p-6
                          shadow-lg
                          backdrop-blur
                          transition
                          hover:-translate-y-1
                          hover:shadow-xl
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
                          <div
                            className="
                              min-w-0
                            "
                          >
                            <span
                              className="
                                inline-flex
                                rounded-full
                                bg-[#e8f4f1]
                                px-3
                                py-1
                                text-[10px]
                                font-black
                                uppercase
                                tracking-wide
                                text-[#064b42]
                              "
                            >
                              {
                                association.island
                              }
                            </span>

                            <h3
                              className="
                                mt-4
                                text-xl
                                font-black
                                leading-tight
                                text-[#064b42]
                              "
                            >
                              {
                                association.name
                              }
                            </h3>
                          </div>

                          <div
                            className="
                              flex
                              h-12
                              w-12
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-[#f8f4ec]
                            "
                          >
                            <PawPrint
                              size={
                                22
                              }
                              className="
                                text-[#df8995]
                              "
                            />
                          </div>
                        </div>

                        <div
                          className="
                            mt-5
                            space-y-3
                            text-sm
                            text-[#665e58]
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
                              size={
                                17
                              }
                              className="
                                mt-0.5
                                shrink-0
                                text-[#b58b5b]
                              "
                            />

                            <div>
                              <p
                                className="
                                  font-black
                                  text-[#064b42]
                                "
                              >
                                Zone
                              </p>

                              <p>
                                {
                                  association.city ||
                                  association.island
                                }
                              </p>
                            </div>
                          </div>

                          {association.phone && (
                            <div
                              className="
                                flex
                                items-start
                                gap-3
                              "
                            >
                              <Phone
                                size={
                                  17
                                }
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-[#b58b5b]
                                "
                              />

                              <div>
                                <p
                                  className="
                                    font-black
                                    text-[#064b42]
                                  "
                                >
                                  Téléphone
                                </p>

                                <p>
                                  {
                                    association.phone
                                  }
                                </p>
                              </div>
                            </div>
                          )}

                          {association.email && (
                            <div
                              className="
                                flex
                                items-start
                                gap-3
                              "
                            >
                              <Mail
                                size={
                                  17
                                }
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-[#b58b5b]
                                "
                              />

                              <div
                                className="
                                  min-w-0
                                "
                              >
                                <p
                                  className="
                                    font-black
                                    text-[#064b42]
                                  "
                                >
                                  E-mail
                                </p>

                                <p
                                  className="
                                    break-all
                                  "
                                >
                                  {
                                    association.email
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div
                          className="
                            mt-auto
                            grid
                            gap-2
                            pt-6
                            sm:grid-cols-2
                          "
                        >
                          {association.phone ? (
                            <a
                              href={`tel:${cleanPhone(
                                association.phone.split(
                                  "/"
                                )[0]
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
                                text-sm
                                font-black
                                text-white
                                transition
                                hover:bg-[#08695d]
                              "
                            >
                              <Phone
                                size={
                                  16
                                }
                              />

                              Appeler
                            </a>
                          ) : (
                            <div
                              className="
                                flex
                                items-center
                                justify-center
                                rounded-full
                                bg-gray-100
                                px-5
                                py-3
                                text-sm
                                font-bold
                                text-gray-400
                              "
                            >
                              Téléphone non renseigné
                            </div>
                          )}

                          {association.email ? (
                            <a
                              href={`mailto:${association.email}`}
                              className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-full
                                bg-[#df8995]
                                px-5
                                py-3
                                text-sm
                                font-black
                                text-white
                                transition
                                hover:bg-[#d77586]
                              "
                            >
                              <Mail
                                size={
                                  16
                                }
                              />

                              E-mail
                            </a>
                          ) : (
                            <div
                              className="
                                flex
                                items-center
                                justify-center
                                rounded-full
                                bg-gray-100
                                px-5
                                py-3
                                text-sm
                                font-bold
                                text-gray-400
                              "
                            >
                              E-mail non renseigné
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              </section>
            )
          )}

        {/* =====================================================
            INFORMATION
        ====================================================== */}

        {!loading && (
          <section
            className="
              mt-10
              rounded-[28px]
              border
              border-[#e8d9c3]
              bg-[#fffaf1]/90
              p-6
              text-center
              shadow-lg
              backdrop-blur
            "
          >
            <p
              className="
                font-bold
                leading-7
                text-[#6f5b40]
              "
            >
              Les coordonnées peuvent évoluer.
              Si vous constatez une erreur ou une
              information manquante, vous pouvez
              la signaler à Taui Te Ora.
            </p>
          </section>
        )}
      </main>
    </TauiPageBackground>
  );
}