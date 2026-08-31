"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Heart,
  MapPin,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
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
import StructureAdoptionConditions from "../../components/structure/StructureAdoptionConditions";

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
  is_verified?: boolean | null;
  approval_status?: string | null;
  is_active?: boolean | null;
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
  age?: string | number | null;
  sex?: string | null;
  sexe?: string | null;
  breed?: string | null;
  race?: string | null;
  size_label?: string | null;
  taille?: string | null;
  city?: string | null;
  commune?: string | null;
  island?: string | null;
  ile?: string | null;
  status?: string | null;
  photo_url?: string | null;
  is_published?: boolean | null;
  is_adopted?: boolean | null;
  adopted?: boolean | null;
  created_at?: string | null;
  animal_photos?: StructureAnimalPhoto[] | null;
};

function normalizeRole(
  value: string | null | undefined
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function roleLabel(
  value: string | null | undefined
) {
  const role = normalizeRole(value);

  if (role === "association") {
    return "Association";
  }

  if (role === "refuge") {
    return "Refuge / SIGFA";
  }

  if (role === "fourriere") {
    return "Fourrière";
  }

  if (role === "benevole") {
    return "Bénévole indépendant";
  }

  if (
    role === "admin" ||
    role === "administrateur"
  ) {
    return "Administration";
  }

  return "Acteur animalier";
}

function getAnimalName(
  animal: StructureAnimal
) {
  return (
    animal.animal_name ||
    animal.nom ||
    "Animal"
  );
}

function getAnimalType(
  animal: StructureAnimal
) {
  return (
    animal.animal_type ||
    animal.type ||
    "Animal"
  );
}

function getAnimalSex(
  animal: StructureAnimal
) {
  return (
    animal.sex ||
    animal.sexe ||
    "Sexe non renseigné"
  );
}

function getAnimalBreed(
  animal: StructureAnimal
) {
  return (
    animal.breed ||
    animal.race ||
    "Race non renseignée"
  );
}

function getAnimalAge(
  animal: StructureAnimal
) {
  if (animal.age_label) {
    return animal.age_label;
  }

  if (
    animal.age === null ||
    animal.age === undefined ||
    animal.age === ""
  ) {
    return "Âge non renseigné";
  }

  return String(animal.age);
}

function getAnimalLocation(
  animal: StructureAnimal
) {
  const city =
    animal.city ||
    animal.commune ||
    "";

  const island =
    animal.island ||
    animal.ile ||
    "";

  return (
    [city, island]
      .filter(Boolean)
      .join(" · ") ||
    "Localisation non renseignée"
  );
}

function isAnimalPublished(
  animal: StructureAnimal
) {
  return animal.is_published !== false;
}

function isAnimalAdopted(
  animal: StructureAnimal
) {
  if (
    animal.is_adopted === true ||
    animal.adopted === true
  ) {
    return true;
  }

  const status = String(
    animal.status || ""
  )
    .trim()
    .toLowerCase();

  return (
    status === "adopte" ||
    status === "adopté" ||
    status === "adoptee" ||
    status === "adoptée"
  );
}

function getAnimalCover(
  animal: StructureAnimal
) {
  const photos =
    Array.isArray(animal.animal_photos)
      ? [...animal.animal_photos]
      : [];

  const cover = photos.find(
    (photo) =>
      photo.is_cover &&
      photo.photo_url
  );

  if (cover?.photo_url) {
    return cover.photo_url;
  }

  photos.sort(
    (a, b) =>
      (a.sort_order ?? 9999) -
      (b.sort_order ?? 9999)
  );

  const firstPhoto = photos.find(
    (photo) =>
      Boolean(photo.photo_url)
  );

  return (
    firstPhoto?.photo_url ||
    animal.photo_url ||
    ""
  );
}

export default function StructurePage() {
  const params = useParams();
  const router = useRouter();

  const structureId = Array.isArray(
    params.id
  )
    ? params.id[0]
    : String(params.id || "");

  const [loading, setLoading] =
    useState(true);

  const [profile, setProfile] =
    useState<StructureProfile | null>(
      null
    );

  const [animals, setAnimals] =
    useState<StructureAnimal[]>([]);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadStructure =
    useCallback(async () => {
      if (!structureId) {
        setErrorMessage(
          "Structure introuvable."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("public_structure_profiles")
          .select("*")
          .eq("id", structureId)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          setProfile(null);
          setAnimals([]);

          setErrorMessage(
            "Cette structure est introuvable."
          );

          return;
        }

        const nextProfile =
          profileData as StructureProfile;

        // public_structure_profiles ne renvoie que les structures
        // destinées à être visibles publiquement. On ne refait donc
        // pas ici un contrôle sur approval_status/is_active, champs
        // qui ne sont pas exposés par cette vue publique.
        setProfile(nextProfile);

        const {
          data: animalsData,
          error: animalsError,
        } = await supabase
          .from("animals")
          .select(
            "*, animal_photos(*)"
          )
          .eq(
            "owner_id",
            structureId
          )
          .eq("is_published", true)
          .order("created_at", {
            ascending: false,
          });

        if (animalsError) {
          throw animalsError;
        }

        setAnimals(
          (animalsData ||
            []) as StructureAnimal[]
        );
      } catch (error: unknown) {
        console.error(
          "Erreur chargement structure publique :",
          error
        );

        const message =
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (
            error as {
              message?: unknown;
            }
          ).message === "string"
            ? String(
                (
                  error as {
                    message: string;
                  }
                ).message
              )
            : "Impossible de charger cette structure.";

        setErrorMessage(message);
        setProfile(null);
        setAnimals([]);
      } finally {
        setLoading(false);
      }
    }, [structureId]);

  useEffect(() => {
    queueMicrotask(
      () => void loadStructure()
    );
  }, [loadStructure]);

  const publishedAnimals =
    useMemo(
      () =>
        animals.filter(
          isAnimalPublished
        ),
      [animals]
    );

  const availableAnimals =
    useMemo(
      () =>
        publishedAnimals.filter(
          (animal) =>
            !isAnimalAdopted(animal)
        ),
      [publishedAnimals]
    );

  const adoptedAnimals =
    useMemo(
      () =>
        publishedAnimals.filter(
          isAnimalAdopted
        ),
      [publishedAnimals]
    );

  const structureName = useMemo(
    () => {
      if (!profile) {
        return "Structure";
      }

      const fullName = [
        profile.first_name,
        profile.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      return (
        profile.organization_name ||
        fullName ||
        roleLabel(profile.role)
      );
    },
    [profile]
  );

  const city =
    profile?.city ||
    profile?.commune ||
    "";

  const island =
    profile?.island ||
    profile?.ile ||
    "";

  const location = [
    city,
    island,
  ]
    .filter(Boolean)
    .join(" · ");

  const description =
    profile?.description ||
    profile?.bio ||
    profile?.about ||
    "";

  /*
   * is_verified reste ici
   * uniquement pour le badge
   * "Profil vérifié".
   *
   * La permission d'être visible
   * publiquement est gérée plus haut
   * par approval_status.
   */
  const verified =
    profile?.is_verified === true;

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f8f4ec] px-5">
        <div className="rounded-[30px] bg-white px-8 py-8 text-center shadow-xl">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#eadfd8] border-t-[#064b42]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement de la structure...
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-[100dvh] bg-[#f8f4ec] px-5 py-10 text-[#064b42]">
        <section className="mx-auto max-w-xl rounded-[32px] bg-white p-8 text-center shadow-xl">
          <Building2
            className="mx-auto text-[#df8995]"
            size={46}
          />

          <h1 className="mt-5 text-3xl font-black">
            Structure non disponible
          </h1>

          <p className="mt-3 leading-7 text-[#6f665f]">
            {errorMessage ||
              "Cette page n'est pas disponible."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#064b42] px-6 py-3.5 font-black text-white"
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] pb-28 text-[#064b42]">
      <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-black shadow-sm transition hover:-translate-y-0.5"
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="overflow-hidden rounded-[36px] bg-white shadow-xl">
          <div className="bg-gradient-to-br from-[#f7dfe3] via-[#f7eee7] to-[#e3efe8] px-6 py-9 sm:px-9 sm:py-11">
            <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-32 sm:w-32">
                  {profile.avatar_url ? (
                    <img
                      src={
                        profile.avatar_url
                      }
                      alt={
                        structureName
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2
                      size={48}
                      className="text-[#c9a89a]"
                    />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#c76d7b] shadow-sm">
                      {roleLabel(
                        profile.role
                      )}
                    </span>

                    {verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#064b42] px-3 py-1.5 text-xs font-black text-white shadow-sm">
                        <ShieldCheck
                          size={15}
                        />
                        Profil vérifié
                      </span>
                    )}
                  </div>

                  <h1 className="mt-3 text-4xl font-black leading-tight text-[#064b42] sm:text-5xl">
                    {structureName}
                  </h1>

                  {location && (
                    <p className="mt-3 flex items-center gap-2 font-bold text-[#6f665f]">
                      <MapPin
                        size={18}
                        className="text-[#df8995]"
                      />

                      {location}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:min-w-[340px]">
                <StatCard
                  value={
                    availableAnimals.length
                  }
                  label="À l'adoption"
                  icon={
                    <PawPrint
                      size={20}
                    />
                  }
                />

                <StatCard
                  value={
                    adoptedAnimals.length
                  }
                  label="Adoptés"
                  icon={
                    <Heart
                      size={20}
                    />
                  }
                />

                <StatCard
                  value={
                    publishedAnimals.length
                  }
                  label="Animaux"
                  icon={
                    <CheckCircle2
                      size={20}
                    />
                  }
                />
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-9">
            {description && (
              <section className="rounded-[28px] border border-[#eee2da] bg-[#fffaf7] p-6 sm:p-7">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
                  À propos
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#064b42]">
                  {structureName}
                </h2>

                <p className="mt-4 whitespace-pre-wrap leading-7 text-[#5f5750]">
                  {description}
                </p>
              </section>
            )}

            <StructureAdoptionConditions
              profileId={profile.id}
            />

            <section className="mt-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
                    Adoption
                  </p>

                  <h2 className="mt-1 text-3xl font-black text-[#064b42]">
                    Animaux à l&apos;adoption
                  </h2>

                  <p className="mt-2 text-[#6f665f]">
                    Découvrez les animaux actuellement proposés par{" "}
                    {structureName}.
                  </p>
                </div>

                <span className="rounded-full bg-[#edf6f2] px-4 py-2 text-sm font-black text-[#064b42]">
                  {
                    availableAnimals.length
                  }{" "}
                  disponible
                  {availableAnimals.length >
                  1
                    ? "s"
                    : ""}
                </span>
              </div>

              {availableAnimals.length ===
              0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-[#ddcfc4] bg-[#fffaf7] p-8 text-center">
                  <PawPrint
                    className="mx-auto text-[#df8995]"
                    size={38}
                  />

                  <h3 className="mt-4 text-xl font-black text-[#064b42]">
                    Aucun animal publié actuellement
                  </h3>

                  <p className="mt-2 text-[#6f665f]">
                    Revenez bientôt pour
                    découvrir de nouveaux
                    profils.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {availableAnimals.map(
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

            {adoptedAnimals.length >
              0 && (
              <section className="mt-12 border-t border-[#eee2da] pt-10">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
                    Belles histoires
                  </p>

                  <h2 className="mt-1 text-3xl font-black text-[#064b42]">
                    Ils ont trouvé leur
                    famille
                  </h2>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {adoptedAnimals.map(
                    (animal) => (
                      <AnimalCard
                        key={
                          animal.id
                        }
                        animal={
                          animal
                        }
                        adopted
                      />
                    )
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] bg-white/85 p-4 text-center shadow-sm backdrop-blur">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#edf6f2] text-[#064b42]">
        {icon}
      </div>

      <p className="mt-2 text-2xl font-black text-[#064b42]">
        {value}
      </p>

      <p className="mt-1 text-xs font-black uppercase tracking-wide text-[#8c776b]">
        {label}
      </p>
    </div>
  );
}

function AnimalCard({
  animal,
  adopted = false,
}: {
  animal: StructureAnimal;
  adopted?: boolean;
}) {
  const cover =
    getAnimalCover(animal);

  const name =
    getAnimalName(animal);

  const type =
    getAnimalType(animal);

  const sex =
    getAnimalSex(animal);

  const age =
    getAnimalAge(animal);

  const breed =
    getAnimalBreed(animal);

  const location =
    getAnimalLocation(animal);

  return (
    <Link
      href={`/animal/${encodeURIComponent(
        animal.id
      )}`}
      className="group overflow-hidden rounded-[28px] border border-[#eee2da] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f2e9e1]">
        {cover ? (
          <img
            src={cover}
            alt={name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawPrint
              size={50}
              className="text-[#cfb9ab]"
            />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#064b42] shadow">
            {type}
          </span>

          {adopted && (
            <span className="rounded-full bg-[#df8995] px-3 py-1.5 text-xs font-black text-white shadow">
              Adopté
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black text-[#064b42]">
              {name}
            </h3>

            <p className="mt-1 text-sm font-bold text-[#8b7568]">
              {breed}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0f3] text-[#df8995]">
            <Heart size={19} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SmallBadge
            label={sex}
          />

          <SmallBadge
            label={age}
          />

          {animal.size_label ||
          animal.taille ? (
            <SmallBadge
              label={
                animal.size_label ||
                animal.taille ||
                ""
              }
            />
          ) : null}
        </div>

        <p className="mt-4 flex items-start gap-2 text-sm font-bold text-[#6f665f]">
          <MapPin
            size={16}
            className="mt-0.5 shrink-0 text-[#df8995]"
          />

          {location}
        </p>

        <div className="mt-5 rounded-full bg-[#064b42] px-5 py-3 text-center text-sm font-black text-white transition group-hover:bg-[#0a5f53]">
          Voir sa fiche
        </div>
      </div>
    </Link>
  );
}

function SmallBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span className="rounded-full bg-[#f8f4ec] px-3 py-1.5 text-xs font-black text-[#6f5a47]">
      {label}
    </span>
  );
}