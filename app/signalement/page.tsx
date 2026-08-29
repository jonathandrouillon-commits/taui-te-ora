"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  CalendarDays,
  MapPin,
  Search,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type SignalementStatus =
  | "nouveau"
  | "en_cours"
  | "animal_retrouve"
  | "cloture";

type Signalement = {
  id: string;

  created_at: string;

  type_signalement: string | null;

  animal_type: string | null;

  animal_name: string | null;

  island: string | null;

  city: string | null;

  address: string | null;

  situation: string | null;

  description: string | null;

  status: string | null;

  photo_url?: string | null;

  image_url?: string | null;

  is_verified?: boolean | null;

  resolution_note?: string | null;

  resolved_at?: string | null;
};

const TYPE_FILTERS = [
  {
    value: "all",
    label: "Tout confondu",
  },
  {
    value: "perdu",
    label: "Perdus",
  },
  {
    value: "trouve",
    label: "Trouvés",
  },
  {
    value: "errant",
    label: "Errants",
  },
  {
    value: "blesse",
    label: "Blessés",
  },
  {
    value: "maltraitance",
    label: "Maltraitance",
  },
  {
    value: "abandon",
    label: "Abandons",
  },
  {
    value: "autre",
    label: "Autres",
  },
];

const STATUS_FILTERS = [
  {
    value: "all",
    label: "Tous les états",
  },
  {
    value: "nouveau",
    label: "Nouveau",
  },
  {
    value: "en_cours",
    label: "En cours",
  },
  {
    value: "animal_retrouve",
    label: "Animal retrouvé",
  },
  {
    value: "cloture",
    label: "Clôturé",
  },
];

export default function SignalementsPublicPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    signalements,
    setSignalements,
  ] = useState<Signalement[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadSignalements() {
      try {
        setLoading(true);

        const {
          data,
          error,
        } = await supabase
          .from("signalements")
          .select(`
            id,
            created_at,
            type_signalement,
            animal_type,
            animal_name,
            island,
            city,
            address,
            situation,
            description,
            status,
            photo_url,
            image_url,
            is_verified,
            resolution_note,
            resolved_at
          `)
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        setSignalements(
          (data || []) as Signalement[]
        );
      } catch (error) {
        console.error(
          "Erreur chargement signalements publics :",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSignalements();

    return () => {
      active = false;
    };
  }, []);

  const filteredSignalements =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return signalements.filter(
        (item) => {
          const normalizedType =
            normalizeSignalementType(
              item.type_signalement
            );

          const normalizedStatus =
            normalizeStatus(
              item.status
            );

          const matchesType =
            typeFilter === "all" ||
            normalizedType ===
              typeFilter;

          const matchesStatus =
            statusFilter === "all" ||
            normalizedStatus ===
              statusFilter;

          const haystack = [
            item.animal_name,
            item.animal_type,
            item.city,
            item.island,
            item.address,
            item.situation,
            item.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            haystack.includes(
              query
            );

          return (
            matchesType &&
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      signalements,
      typeFilter,
      statusFilter,
      search,
    ]);

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
          Chargement des signalements...
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
            Signalements
          </h1>

          <p
            className="
              mt-3
              text-base
              leading-7
              text-[#756d67]
            "
          >
            Consultez les signalements
            d&apos;animaux perdus,
            trouvés, errants,
            blessés ou en danger,
            ainsi que leur état
            d&apos;avancement.
          </p>
        </div>

        {/* FILTRES */}

        <section
          className="
            mt-8
            rounded-[28px]
            border
            border-[#eadfd8]
            bg-white
            p-5
            shadow-sm
          "
        >
          <div
            className="
              grid
              gap-4
              lg:grid-cols-[1fr_220px_220px]
            "
          >
            <div
              className="
                relative
              "
            >
              <Search
                size={19}
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
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Rechercher un animal, une commune..."
                className="
                  min-h-[48px]
                  w-full
                  rounded-2xl
                  border
                  border-[#eadfd8]
                  bg-white
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
                typeFilter
              }
              onChange={(
                event
              ) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="
                min-h-[48px]
                rounded-2xl
                border
                border-[#eadfd8]
                bg-white
                px-4
                font-bold
                outline-none
                focus:border-[#064b42]
              "
            >
              {TYPE_FILTERS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="
                min-h-[48px]
                rounded-2xl
                border
                border-[#eadfd8]
                bg-white
                px-4
                font-bold
                outline-none
                focus:border-[#064b42]
              "
            >
              {STATUS_FILTERS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <p
            className="
              mt-4
              text-sm
              font-bold
              text-[#756d67]
            "
          >
            {
              filteredSignalements.length
            }{" "}
            signalement
            {
              filteredSignalements.length ===
              1
                ? ""
                : "s"
            }
          </p>
        </section>

        {/* LISTE */}

        {filteredSignalements.length ===
        0 ? (
          <div
            className="
              mt-8
              rounded-[28px]
              border
              border-[#eadfd8]
              bg-white
              p-10
              text-center
            "
          >
            <AlertTriangle
              size={44}
              className="
                mx-auto
                text-[#df8995]
              "
            />

            <h2
              className="
                mt-4
                text-2xl
                font-black
              "
            >
              Aucun signalement
            </h2>

            <p
              className="
                mt-2
                text-gray-500
              "
            >
              Aucun résultat
              ne correspond
              à vos filtres.
            </p>
          </div>
        ) : (
          <div
            className="
              mt-8
              grid
              gap-6
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {filteredSignalements.map(
              (
                item
              ) => (
                <SignalementCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function SignalementCard({
  item,
}: {
  item: Signalement;
}) {
  const status =
    normalizeStatus(
      item.status
    );

  const type =
    normalizeSignalementType(
      item.type_signalement
    );

  const imageUrl =
    item.photo_url ||
    item.image_url ||
    "";

  return (
    <Link
      href={`/signalement/${item.id}`}
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-[#eadfd8]
        bg-white
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >
      <div
        className="
          aspect-[4/3]
          overflow-hidden
          bg-[#f4eee5]
        "
      >
        {imageUrl ? (
          <img
            src={
              imageUrl
            }
            alt={
              item.animal_name ||
              "Signalement animal"
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
              items-center
              justify-center
              text-6xl
            "
          >
            {
              getSignalementIcon(
                type
              )
            }
          </div>
        )}
      </div>

      <div
        className="
          p-5
        "
      >
        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >
          <span
            className="
              rounded-full
              bg-[#fff0f3]
              px-3
              py-1
              text-xs
              font-black
              text-[#c85f72]
            "
          >
            {
              getSignalementTypeLabel(
                type
              )
            }
          </span>

          <span
            className={`
              rounded-full
              border
              px-3
              py-1
              text-xs
              font-black
              ${getStatusClasses(
                status
              )}
            `}
          >
            {
              getStatusLabel(
                status
              )
            }
          </span>
        </div>

        <h2
          className="
            mt-3
            text-2xl
            font-black
            text-[#2f241c]
          "
        >
          {item.animal_name ||
            item.animal_type ||
            "Animal signalé"}
        </h2>

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
              items-center
              gap-2
            "
          >
            <CalendarDays
              size={17}
            />

            <span>
              {formatDate(
                item.created_at
              )}
            </span>
          </div>

          {(item.city ||
            item.island) && (
            <div
              className="
                flex
                items-start
                gap-2
              "
            >
              <MapPin
                size={17}
                className="
                  mt-0.5
                  shrink-0
                "
              />

              <span>
                {[
                  item.city,
                  item.island,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          )}
        </div>

        {(item.situation ||
          item.description) && (
          <p
            className="
              mt-4
              line-clamp-3
              text-sm
              leading-6
              text-gray-500
            "
          >
            {item.situation ||
              item.description}
          </p>
        )}

        <div
          className="
            mt-5
            rounded-2xl
            bg-[#064b42]
            px-4
            py-3
            text-center
            font-black
            text-white
          "
        >
          Voir le signalement
        </div>
      </div>
    </Link>
  );
}

function normalizeStatus(
  status:
    | string
    | null
    | undefined
): SignalementStatus {
  const value =
    String(
      status || ""
    )
      .trim()
      .toLowerCase();

  if (
    value === "en_cours" ||
    value ===
      "pris_en_charge" ||
    value ===
      "en_intervention"
  ) {
    return "en_cours";
  }

  if (
    value ===
      "animal_retrouve" ||
    value ===
      "retrouve"
  ) {
    return "animal_retrouve";
  }

  if (
    value ===
      "cloture" ||
    value ===
      "resolu" ||
    value ===
      "regle"
  ) {
    return "cloture";
  }

  return "nouveau";
}

function getStatusLabel(
  status: SignalementStatus
) {
  switch (status) {
    case "en_cours":
      return "🟠 En cours";

    case "animal_retrouve":
      return "🟢 Animal retrouvé";

    case "cloture":
      return "✅ Clôturé";

    default:
      return "🟡 Nouveau";
  }
}

function getStatusClasses(
  status: SignalementStatus
) {
  switch (status) {
    case "en_cours":
      return "border-orange-200 bg-orange-100 text-orange-800";

    case "animal_retrouve":
      return "border-green-200 bg-green-100 text-green-800";

    case "cloture":
      return "border-[#064b42] bg-[#064b42] text-white";

    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function normalizeSignalementType(
  value:
    | string
    | null
    | undefined
) {
  const type =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (
    type.includes("perdu") ||
    type.includes("disparu")
  ) {
    return "perdu";
  }

  if (
    type.includes("trouv")
  ) {
    return "trouve";
  }

  if (
    type.includes("errant")
  ) {
    return "errant";
  }

  if (
    type.includes("bless")
  ) {
    return "blesse";
  }

  if (
    type.includes("maltrait")
  ) {
    return "maltraitance";
  }

  if (
    type.includes("abandon")
  ) {
    return "abandon";
  }

  return "autre";
}

function getSignalementTypeLabel(
  type: string
) {
  switch (type) {
    case "perdu":
      return "Animal perdu";

    case "trouve":
      return "Animal trouvé";

    case "errant":
      return "Animal errant";

    case "blesse":
      return "Animal blessé";

    case "maltraitance":
      return "Maltraitance";

    case "abandon":
      return "Abandon";

    default:
      return "Autre signalement";
  }
}

function getSignalementIcon(
  type: string
) {
  switch (type) {
    case "perdu":
      return "🔎";

    case "trouve":
      return "🐾";

    case "errant":
      return "🐕";

    case "blesse":
      return "🩹";

    case "maltraitance":
      return "⚠️";

    case "abandon":
      return "💔";

    default:
      return "🚨";
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
      new Date(value)
    );
  } catch {
    return value;
  }
}