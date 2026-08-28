"use client";

type StructureProfile = {
  id: string;
  role?: string | null;
  organization_name?: string | null;
  avatar_url?: string | null;

  island?: string | null;
  ile?: string | null;

  city?: string | null;
  commune?: string | null;

  first_name?: string | null;
  last_name?: string | null;

  description?: string | null;
  bio?: string | null;
  about?: string | null;
};
type StructureAnimalPhoto = {
  id?: string;
  photo_url?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
};

type StructureAnimal = {
  id: string;

  animal_name?: string | null;
  nom?: string | null;

  animal_type?: string | null;
  type?: string | null;

  age_label?: string | null;
  age?: string | null;

  sex?: string | null;
  sexe?: string | null;

  breed?: string | null;
  size_label?: string | null;

  city?: string | null;
  island?: string | null;

  status?: string | null;
  photo_url?: string | null;

  is_published?: boolean | null;
  is_adopted?: boolean | null;

  animal_photos?: StructureAnimalPhoto[] | null;
};

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "../../lib/supabase";

export default function StructurePage() {
  const params = useParams();
  const router = useRouter();

  const structureId =
    String(params.id || "");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    profile,
    setProfile,
  ] = useState<StructureProfile | null>(null);

  const [
    animals,
    setAnimals,
  ] = useState<StructureAnimal[]>([]);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadStructure = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: profileData,
        error: profileError,
      } =
        await supabase
          .from("public_structure_profiles")
          .select(
            "id, role, organization_name, avatar_url, island, city, first_name, last_name"
          )
          .eq(
            "id",
            structureId
          )
          .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(
        profileData
      );

      const {
        data: animalsData,
        error: animalsError,
      } =
        await supabase
          .from("animals")
          .select(
            "*, animal_photos (*)"
          )
          .eq(
            "owner_id",
            structureId
          )
          .eq(
            "is_published",
            true
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (animalsError) {
        throw animalsError;
      }

      setAnimals(
        animalsData || []
      );
    } catch (error: unknown) {
      console.error(
        "Erreur structure :",
        error
      );

      setErrorMessage(
        "Impossible de charger cette structure."
      );
    } finally {
      setLoading(false);
    }
  }, [structureId]);

  const structureName =
    profile?.organization_name ||
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Structure animale";

  const roleLabel =
    formatRole(
      profile?.role ?? undefined
    );

  const city =
    profile?.city ||
    profile?.commune ||
    "";

  const island =
    profile?.island ||
    profile?.ile ||
    "";

  const description =
    profile?.description ||
    profile?.bio ||
    profile?.about ||
    "";

  const logo =
    profile?.avatar_url ||
    "";

  const dogCount =
    useMemo(
      () =>
        animals.filter(
          (animal) =>
            isDog(
              animal
            )
        ).length,
      [animals]
    );

  const catCount =
    useMemo(
      () =>
        animals.filter(
          (animal) =>
            isCat(
              animal
            )
        ).length,
      [animals]
    );

  const horseCount =
    useMemo(
      () =>
        animals.filter(
          (animal) =>
            isHorse(
              animal
            )
        ).length,
      [animals]
    );

  useEffect(() => {
    if (structureId) {
      queueMicrotask(() => void loadStructure());
    }
  }, [structureId, loadStructure]);

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-[100dvh]
          items-center
          justify-center
          bg-[#f8f3ed]
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
          <div
            className="
              mx-auto
              h-10
              w-10
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
              font-bold
              text-[#667568]
            "
          >
            Chargement de la structure...
          </p>
        </div>
      </main>
    );
  }

  if (
    errorMessage ||
    !profile
  ) {
    return (
      <main
        className="
          flex
          min-h-[100dvh]
          items-center
          justify-center
          bg-[#f8f3ed]
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
            Structure introuvable
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-[#756d67]
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
              bg-[#ef8196]
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

  return (
    <main
      className="
        min-h-[100dvh]
        bg-[#f8f3ed]
        pb-12
        text-[#443c37]
      "
    >
      {/* HEADER */}

      <div
        className="
          sticky
          top-0
          z-50
          border-b
          border-[#eadfd8]
          bg-[#fffaf7]/90
          px-4
          py-3
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-5xl
            items-center
            justify-between
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
              items-center
              justify-center
              rounded-full
              bg-white
              text-xl
              shadow-sm
            "
          >
            ‹
          </button>

          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="
              h-12
              w-12
              object-contain
            "
          />

          <Link
            href="/"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-white
              text-lg
              shadow-sm
            "
          >
            🏠
          </Link>
        </div>
      </div>

      <div
        className="
          mx-auto
          max-w-5xl
          px-4
          pt-6
        "
      >
        {/* PRESENTATION */}

        <section
          className="
            overflow-hidden
            rounded-[32px]
            bg-white
            shadow-[0_16px_45px_rgba(70,55,45,.10)]
          "
        >
          <div
            className="
              bg-gradient-to-br
              from-[#f8d8dc]
              via-[#fff4ef]
              to-[#d9efea]
              px-6
              pb-7
              pt-8
              text-center
            "
          >
            {logo ? (
              <div
                className="
                  mx-auto
                  h-28
                  w-28
                  overflow-hidden
                  rounded-full
                  border-4
                  border-white
                  bg-white
                  shadow-xl
                "
              >
                <img
                  src={logo}
                  alt={
                    structureName
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              </div>
            ) : (
              <div
                className="
                  mx-auto
                  flex
                  h-28
                  w-28
                  items-center
                  justify-center
                  rounded-full
                  border-4
                  border-white
                  bg-[#ef8196]
                  text-5xl
                  text-white
                  shadow-xl
                "
              >
                🐾
              </div>
            )}

            <h1
              className="
                mt-4
                text-3xl
                font-black
                text-[#064b42]
              "
            >
              {structureName}
            </h1>

            {roleLabel && (
              <div
                className="
                  mt-2
                  inline-flex
                  rounded-full
                  bg-white/80
                  px-4
                  py-2
                  text-xs
                  font-black
                  text-[#df7989]
                  shadow-sm
                "
              >
                {roleLabel}
              </div>
            )}

            {(city ||
              island) && (
                <p
                  className="
                    mt-3
                    text-sm
                    font-semibold
                    text-[#6d655f]
                  "
                >
                  📍{" "}
                  {[
                    city,
                    island,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
          </div>

          {description && (
            <div
              className="
                px-6
                py-6
              "
            >
              <h2
                className="
                  text-lg
                  font-black
                  text-[#064b42]
                "
              >
                À propos
              </h2>

              <p
                className="
                  mt-2
                  whitespace-pre-line
                  text-sm
                  leading-relaxed
                  text-[#756d67]
                "
              >
                {description}
              </p>
            </div>
          )}
        </section>

        {/* STATISTIQUES */}

        <section
          className="
            mt-5
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-4
          "
        >
          <StatCard
            value={
              animals.length
            }
            label="À l'adoption"
            icon="🐾"
          />

          <StatCard
            value={dogCount}
            label="Chiens"
            icon="🐶"
          />

          <StatCard
            value={catCount}
            label="Chats"
            icon="🐱"
          />

          <StatCard
            value={horseCount}
            label="Chevaux"
            icon="🐴"
          />
        </section>

        {/* ANIMAUX */}

        <section className="mt-8">
          <div
            className="
              flex
              items-end
              justify-between
              gap-3
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-[#df8995]
                "
              >
                Ils attendent leur famille
              </p>

              <h2
                className="
                  mt-1
                  text-2xl
                  font-black
                  text-[#064b42]
                "
              >
                Animaux à l&apos;adoption
              </h2>
            </div>

            <span
              className="
                rounded-full
                bg-white
                px-3
                py-1.5
                text-xs
                font-black
                text-[#6d655f]
                shadow-sm
              "
            >
              {animals.length}
            </span>
          </div>

          {animals.length ===
          0 ? (
            <div
              className="
                mt-5
                rounded-[28px]
                bg-white
                p-8
                text-center
                shadow-sm
              "
            >
              <div className="text-5xl">
                🐾
              </div>

              <p
                className="
                  mt-3
                  font-bold
                  text-[#6f6862]
                "
              >
                Aucun animal publié actuellement.
              </p>
            </div>
          ) : (
            <div
              className="
                mt-5
                grid
                grid-cols-2
                gap-4
                sm:grid-cols-3
                lg:grid-cols-4
              "
            >
              {animals.map(
                (animal) => (
                  <AnimalCard
                    key={
                      animal.id
                    }
                    animal={
                      animal
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   STAT
========================================================= */

function StatCard({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: string;
}) {
  return (
    <div
      className="
        rounded-[22px]
        bg-white
        p-4
        text-center
        shadow-sm
      "
    >
      <div className="text-2xl">
        {icon}
      </div>

      <div
        className="
          mt-1
          text-2xl
          font-black
          text-[#064b42]
        "
      >
        {value}
      </div>

      <div
        className="
          mt-0.5
          text-[10px]
          font-bold
          text-[#8b817a]
        "
      >
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   ANIMAL CARD
========================================================= */

function AnimalCard({
  animal,
}: {
  animal: StructureAnimal;
}) {
  const photo =
    getAnimalPhoto(
      animal
    );

  const name =
    animal?.animal_name ||
    animal?.nom ||
    "Animal";

  const age =
    animal?.age_label ||
    animal?.age ||
    "";

  const sex =
    animal?.sex ||
    animal?.sexe ||
    "";

  return (
    <Link
      href={`/animal/${animal.id}`}
      className="
        group
        overflow-hidden
        rounded-[24px]
        bg-white
        shadow-sm
        transition
        active:scale-[.98]
      "
    >
      <div
        className="
          relative
          aspect-[4/5]
          overflow-hidden
          bg-[#e8e2dc]
        "
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="
              h-full
              w-full
              object-cover
              transition
              duration-300
              group-hover:scale-105
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              items-center
              justify-center
              text-5xl
            "
          >
            🐾
          </div>
        )}

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            h-1/2
            bg-gradient-to-t
            from-black/70
            to-transparent
          "
        />

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            p-3
            text-white
          "
        >
          <h3
            className="
              truncate
              text-lg
              font-black
            "
          >
            {name}
          </h3>

          {(age ||
            sex) && (
              <p
                className="
                  mt-0.5
                  truncate
                  text-[10px]
                  font-semibold
                  text-white/90
                "
              >
                {[age, sex]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getAnimalPhoto(
  animal: StructureAnimal
) {
  const photos =
    Array.isArray(
      animal?.animal_photos
    )
      ? animal.animal_photos
      : [];

  const cover =
    photos.find(
      (photo: StructureAnimalPhoto) =>
        photo?.is_cover
    );

  return (
    cover?.photo_url ||
    photos[0]?.photo_url ||
    animal?.photo_url ||
    ""
  );
}

function getAnimalType(
  animal: StructureAnimal
) {
  return String(
    animal?.animal_type ||
      animal?.type ||
      ""
  )
    .trim()
    .toLowerCase();
}

function isDog(
  animal: StructureAnimal
) {
  const type =
    getAnimalType(
      animal
    );

  return (
    type.includes(
      "chien"
    ) ||
    type.includes(
      "dog"
    )
  );
}

function isCat(
  animal: StructureAnimal
) {
  const type =
    getAnimalType(
      animal
    );

  return (
    type.includes(
      "chat"
    ) ||
    type.includes(
      "cat"
    )
  );
}

function isHorse(
  animal: StructureAnimal
) {
  const type =
    getAnimalType(
      animal
    );

  return (
    type.includes(
      "cheval"
    ) ||
    type.includes(
      "horse"
    )
  );
}

function formatRole(
  role?: string
) {
  const value =
    String(role || "")
      .trim()
      .toLowerCase();

  if (
    value ===
    "association"
  ) {
    return "Association";
  }

  if (
    value ===
      "refuge"
  ) {
    return "Refuge / SIGFA";
  }

  if (
    value ===
      "fourriere" ||
    value ===
      "fourrière"
  ) {
    return "Fourrière";
  }

  if (
    value ===
      "benevole" ||
    value ===
      "bénévole"
  ) {
    return "Bénévole indépendant";
  }

  return role || "";
}
