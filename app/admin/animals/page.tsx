"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  Heart,
  RotateCcw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type AnimalPhoto = {
  id: string;
  photo_url: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

type Animal = {
  id: string;
  animal_name: string | null;
  animal_type: string | null;
  age_label: string | null;
  sex: string | null;
  breed: string | null;
  association_name: string | null;
  island: string | null;
  city: string | null;
  status: string | null;
  is_published: boolean | null;
  is_adopted: boolean | null;
  owner_id: string | null;
  created_at: string | null;
  sterilized: boolean | null;
  animal_photos?: AnimalPhoto[] | null;
  favorite_count?: number;
};

type Filter =
  | "all"
  | "published"
  | "draft"
  | "adopted"
  | "archived";

export default function AdminAnimalsPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [animals, setAnimals] =
    useState<Animal[]>([]);

  const [filter, setFilter] =
    useState<Filter>("all");

  const [search, setSearch] =
    useState("");

  const [sexFilter, setSexFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [sterilizedFilter, setSterilizedFilter] = useState("");
  const [structureFilter, setStructureFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [islandFilter, setIslandFilter] = useState("");

  const loadAnimals =
    useCallback(async () => {
      const { data, error } =
        await supabase
          .from("animals")
          .select(`
            id,
            animal_name,
            animal_type,
            age_label,
            sex,
            breed,
            association_name,
            island,
            city,
            status,
            is_published,
            is_adopted,
            owner_id,
            created_at,
            sterilized,
            animal_photos (
              id,
              photo_url,
              is_cover,
              sort_order
            )
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

      const rows = (data || []) as Animal[];
      const animalIds = rows.map((animal) => animal.id);
      const counts = new Map<string, number>();

      if (animalIds.length > 0) {
        const { data: favoriteRows, error: favoriteError } = await supabase
          .from("favorites")
          .select("animal_id")
          .in("animal_id", animalIds);

        if (favoriteError) throw favoriteError;

        for (const favorite of favoriteRows || []) {
          const animalId = String(favorite.animal_id || "");
          if (!animalId) continue;
          counts.set(animalId, (counts.get(animalId) || 0) + 1);
        }
      }

      setAnimals(
        rows.map((animal) => ({
          ...animal,
          favorite_count: counts.get(animal.id) || 0,
        }))
      );
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
            "/login?redirect=/admin/animals"
          );
          return;
        }

        const {
          data: profile,
          error: profileError,
        } =
          await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (
          String(
            profile?.role || ""
          )
            .trim()
            .toLowerCase() !==
          "admin"
        ) {
          router.replace("/");
          return;
        }

        await loadAnimals();
      } catch (error: unknown) {
        console.error(
          "Erreur chargement admin animaux :",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Impossible de charger les animaux."
        );
      } finally {
        setLoading(false);
      }
    }, [loadAnimals, router]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void initialize();
        },
        0
      );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialize]);

  const publishedCount =
    useMemo(
      () =>
        animals.filter(
          (animal) =>
            animal.is_published &&
            !animal.is_adopted &&
            animal.status !==
              "archive"
        ).length,
      [animals]
    );

  const draftCount =
    useMemo(
      () =>
        animals.filter(
          (animal) =>
            !animal.is_published &&
            !animal.is_adopted &&
            animal.status !==
              "archive"
        ).length,
      [animals]
    );

  const adoptedCount =
    useMemo(
      () =>
        animals.filter(
          (animal) =>
            animal.is_adopted ||
            animal.status ===
              "adopted"
        ).length,
      [animals]
    );

  const archivedCount =
    useMemo(
      () =>
        animals.filter(
          (animal) =>
            animal.status ===
              "archive"
        ).length,
      [animals]
    );

  const sexOptions = useMemo(() => uniqueValues(animals.map((a) => a.sex)), [animals]);
  const ageOptions = useMemo(() => uniqueValues(animals.map((a) => a.age_label)), [animals]);
  const structureOptions = useMemo(() => uniqueValues(animals.map((a) => a.association_name)), [animals]);
  const typeOptions = useMemo(() => uniqueValues(animals.map((a) => a.animal_type)), [animals]);
  const islandOptions = useMemo(() => uniqueValues(animals.map((a) => a.island)), [animals]);

  const filteredAnimals =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return animals.filter(
        (animal) => {
          if (
            filter ===
              "published" &&
            (!animal.is_published ||
              animal.is_adopted ||
              animal.status ===
                "archive")
          ) {
            return false;
          }

          if (
            filter === "draft" &&
            (animal.is_published ||
              animal.is_adopted ||
              animal.status ===
                "archive")
          ) {
            return false;
          }

          if (
            filter ===
              "adopted" &&
            !animal.is_adopted &&
            animal.status !==
              "adopted"
          ) {
            return false;
          }

          if (
            filter ===
              "archived" &&
            animal.status !==
              "archive"
          ) {
            return false;
          }

          if (sexFilter && normalize(animal.sex) !== normalize(sexFilter)) return false;
          if (ageFilter && normalize(animal.age_label) !== normalize(ageFilter)) return false;
          if (structureFilter && normalize(animal.association_name) !== normalize(structureFilter)) return false;
          if (typeFilter && normalize(animal.animal_type) !== normalize(typeFilter)) return false;
          if (islandFilter && normalize(animal.island) !== normalize(islandFilter)) return false;
          if (sterilizedFilter === "yes" && animal.sterilized !== true) return false;
          if (sterilizedFilter === "no" && animal.sterilized !== false) return false;

          if (!query) {
            return true;
          }

          const haystack = [
            animal.animal_name,
            animal.animal_type,
            animal.breed,
            animal.association_name,
            animal.city,
            animal.island,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            query
          );
        }
      );
    }, [
      animals,
      filter,
      search,
      sexFilter,
      ageFilter,
      sterilizedFilter,
      structureFilter,
      typeFilter,
      islandFilter,
    ]);

  async function updateAnimal(
    animalId: string,
    values: Partial<Animal>
  ) {
    try {
      setActionId(animalId);

      const { error } =
        await supabase
          .from("animals")
          .update({
            ...values,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", animalId);

      if (error) {
        throw error;
      }

      await loadAnimals();
    } catch (error: unknown) {
      console.error(
        "Erreur modification animal :",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Impossible de modifier cet animal."
      );
    } finally {
      setActionId(null);
    }
  }

  async function publishAnimal(
    animal: Animal
  ) {
    if (animal.is_adopted) {
      alert(
        "Un animal adopté ne peut pas être publié."
      );
      return;
    }

    if (
      animal.status === "archive"
    ) {
      alert(
        "Réactivez d'abord l'animal archivé."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Publier ${
          animal.animal_name ||
          "cet animal"
        } ?`
      );

    if (!confirmed) return;

    await updateAnimal(
      animal.id,
      {
        is_published: true,
      }
    );
  }

  async function unpublishAnimal(
    animal: Animal
  ) {
    const confirmed =
      window.confirm(
        `Dépublier ${
          animal.animal_name ||
          "cet animal"
        } ?`
      );

    if (!confirmed) return;

    await updateAnimal(
      animal.id,
      {
        is_published: false,
      }
    );
  }

  async function archiveAnimal(
    animal: Animal
  ) {
    if (animal.is_adopted) {
      alert(
        "Cet animal est déjà enregistré comme adopté."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Archiver ${
          animal.animal_name ||
          "cet animal"
        } ? Il ne sera plus visible publiquement.`
      );

    if (!confirmed) return;

    await updateAnimal(
      animal.id,
      {
        is_published: false,
        status: "archive",
      }
    );
  }

  async function deleteAnimal(
    animal: Animal
  ) {
    const firstConfirmation =
      window.confirm(
        `Supprimer définitivement ${
          animal.animal_name ||
          "cet animal"
        } ?`
      );

    if (!firstConfirmation) return;

    const secondConfirmation =
      window.confirm(
        "ATTENTION : cette suppression est définitive. Confirmer une seconde fois ?"
      );

    if (!secondConfirmation) return;

    try {
      setActionId(animal.id);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw (
          userError ||
          new Error(
            "Utilisateur non connecté."
          )
        );
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

      if (
        String(profile?.role || "")
          .trim()
          .toLowerCase() !== "admin"
      ) {
        throw new Error(
          "Seul un administrateur peut supprimer définitivement un animal."
        );
      }

      const { error } = await supabase
        .from("animals")
        .delete()
        .eq("id", animal.id);

      if (error) {
        throw error;
      }

      await loadAnimals();
    } catch (error: unknown) {
      console.error(
        "Erreur suppression animal :",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer cet animal."
      );
    } finally {
      setActionId(null);
    }
  }

  async function restoreAnimal(
    animal: Animal
  ) {
    const confirmed =
      window.confirm(
        `Réactiver ${
          animal.animal_name ||
          "cet animal"
        } ? Il restera non publié jusqu'à validation de sa publication.`
      );

    if (!confirmed) return;

    await updateAnimal(
      animal.id,
      {
        is_published: false,
        is_adopted: false,
        status: "available",
      }
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
        <p className="font-bold text-[#064b42]">
          Chargement des animaux...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 pb-16 pt-24 text-[#064b42] sm:px-8">
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b68b2f]">
              Administration
            </p>

            <h1 className="mt-1 text-4xl font-black sm:text-5xl">
              Animaux
            </h1>

            <p className="mt-2 text-[#6f5a47]">
              Gestion des publications,
              adoptions et archives.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/association/add-animal"
                )
              }
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-5 py-4 font-black text-white shadow"
            >
              <Plus size={19} />
              Créer un animal
            </button>

            <div className="relative w-full lg:w-96">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Rechercher un animal..."
              className="w-full rounded-2xl border border-[#eadfce] bg-white py-4 pl-12 pr-4 font-bold outline-none"
            />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat
            label="Total"
            value={animals.length}
            active={
              filter === "all"
            }
            onClick={() =>
              setFilter("all")
            }
          />

          <Stat
            label="Publiés"
            value={publishedCount}
            active={
              filter ===
              "published"
            }
            onClick={() =>
              setFilter(
                "published"
              )
            }
          />

          <Stat
            label="Brouillons"
            value={draftCount}
            active={
              filter === "draft"
            }
            onClick={() =>
              setFilter("draft")
            }
          />

          <Stat
            label="Adoptés"
            value={adoptedCount}
            active={
              filter ===
              "adopted"
            }
            onClick={() =>
              setFilter(
                "adopted"
              )
            }
          />

          <Stat
            label="Archivés"
            value={archivedCount}
            active={
              filter ===
              "archived"
            }
            onClick={() =>
              setFilter(
                "archived"
              )
            }
          />
        </div>

        <div className="mt-6 rounded-3xl border border-[#eadfce] bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <FilterSelect label="Sexe" value={sexFilter} onChange={setSexFilter} options={sexOptions} />
            <FilterSelect label="Âge" value={ageFilter} onChange={setAgeFilter} options={ageOptions} />
            <FilterSelect label="Stérilisé / Castré" value={sterilizedFilter} onChange={setSterilizedFilter} options={["yes", "no"]} optionLabels={{ yes: "Oui", no: "Non" }} />
            <FilterSelect label="Association / Refuge" value={structureFilter} onChange={setStructureFilter} options={structureOptions} />
            <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
            <FilterSelect label="Île" value={islandFilter} onChange={setIslandFilter} options={islandOptions} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#6f5a47]">
              {filteredAnimals.length} animal{filteredAnimals.length > 1 ? "x" : ""} affiché{filteredAnimals.length > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSexFilter("");
                setAgeFilter("");
                setSterilizedFilter("");
                setStructureFilter("");
                setTypeFilter("");
                setIslandFilter("");
              }}
              className="flex items-center gap-2 rounded-2xl bg-[#f8f4ec] px-4 py-3 text-sm font-black"
            >
              <RotateCcw size={16} /> Réinitialiser les filtres
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {filteredAnimals.length ===
          0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow">
              <h2 className="text-2xl font-black">
                Aucun animal
              </h2>

              <p className="mt-2 text-gray-500">
                Aucun résultat ne
                correspond aux critères.
              </p>
            </div>
          ) : (
            filteredAnimals.map(
              (animal) => {
                const processing =
                  actionId ===
                  animal.id;

                const archived =
                  animal.status ===
                  "archive";

                const adopted =
                  !!animal.is_adopted ||
                  animal.status ===
                    "adopted";

                return (
                  <article
                    key={animal.id}
                    className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <AnimalThumbnail animal={animal} />
                        <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-black text-[#2f241c]">
                            {animal.animal_name ||
                              "Animal sans nom"}
                          </h2>

                          {adopted ? (
                            <Badge>
                              Adopté
                            </Badge>
                          ) : archived ? (
                            <Badge>
                              Archivé
                            </Badge>
                          ) : animal.is_published ? (
                            <Badge>
                              Publié
                            </Badge>
                          ) : (
                            <Badge>
                              Brouillon
                            </Badge>
                          )}
                        </div>

                        <p className="mt-2 text-[#6f5a47]">
                          {animal.animal_type ||
                            "Type non renseigné"}
                          {" • "}
                          {animal.age_label ||
                            "âge non renseigné"}
                          {" • "}
                          {animal.sex ||
                            "Sexe non renseigné"}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {animal.breed ||
                            "Race non renseignée"}
                          {" • "}
                          {animal.city ||
                            "Commune non renseignée"}
                          {" • "}
                          {animal.island ||
                            "île non renseignée"}
                        </p>

                        <p className="mt-2 text-sm font-bold text-[#9c7b54]">
                          {animal.association_name ||
                            "Structure non renseignée"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-sm font-black text-rose-700">
                            <Heart size={15} fill="currentColor" /> {animal.favorite_count || 0} coup{(animal.favorite_count || 0) > 1 ? "s" : ""} de cœur
                          </span>
                          <span className="rounded-full bg-[#f8f4ec] px-3 py-1 text-sm font-bold text-[#064b42]">
                            {animal.sterilized ? (isMale(animal.sex) ? "Castré" : "Stérilisé") : (isMale(animal.sex) ? "Non castré" : "Non stérilisé")}
                          </span>
                        </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/animal/${animal.id}`
                            )
                          }
                          className="flex items-center gap-2 rounded-2xl bg-[#f8f4ec] px-4 py-3 font-black"
                        >
                          <Eye size={17} />
                          Voir
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/animals/${animal.id}/edit`
                            )
                          }
                          className="flex items-center gap-2 rounded-2xl bg-[#9c7b54] px-4 py-3 font-black text-white"
                        >
                          <Pencil
                            size={17}
                          />
                          Modifier
                        </button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() =>
                            deleteAnimal(animal)
                          }
                          className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                          Supprimer
                        </button>

                        {!adopted &&
                          !archived &&
                          !animal.is_published && (
                            <button
                              type="button"
                              disabled={
                                processing
                              }
                              onClick={() =>
                                publishAnimal(
                                  animal
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-4 py-3 font-black text-white disabled:opacity-50"
                            >
                              <Eye
                                size={17}
                              />
                              Publier
                            </button>
                          )}

                        {!adopted &&
                          !archived &&
                          animal.is_published && (
                            <button
                              type="button"
                              disabled={
                                processing
                              }
                              onClick={() =>
                                unpublishAnimal(
                                  animal
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-800 disabled:opacity-50"
                            >
                              <EyeOff
                                size={17}
                              />
                              Dépublier
                            </button>
                          )}

                        {!adopted &&
                          !archived && (
                            <button
                              type="button"
                              disabled={
                                processing
                              }
                              onClick={() =>
                                archiveAnimal(
                                  animal
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 font-black text-gray-700 disabled:opacity-50"
                            >
                              <Archive
                                size={17}
                              />
                              Archiver
                            </button>
                          )}

                        {archived && (
                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              restoreAnimal(
                                animal
                              )
                            }
                            className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-4 py-3 font-black text-white disabled:opacity-50"
                          >
                            <CheckCircle2
                              size={17}
                            />
                            Réactiver
                          </button>
                        )}
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

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"));
}

function isMale(sex: string | null | undefined) {
  return ["male", "mâle", "masculin", "m"].includes(normalize(sex));
}

function getCoverPhoto(animal: Animal) {
  const photos = Array.isArray(animal.animal_photos) ? animal.animal_photos : [];
  const cover = photos.find((photo) => photo.is_cover) || [...photos].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
  return cover?.photo_url || "";
}

function AnimalThumbnail({ animal }: { animal: Animal }) {
  const photo = getCoverPhoto(animal);
  return photo ? (
    <img src={photo} alt={animal.animal_name || "Animal"} className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28" />
  ) : (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#f8f4ec] text-center text-xs font-black text-[#9c7b54] sm:h-28 sm:w-28">Pas de photo</div>
  );
}

function FilterSelect({ label, value, onChange, options, optionLabels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; optionLabels?: Record<string, string>; }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-[#9c7b54]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-[#eadfce] bg-[#fdfbf7] px-3 py-3 font-bold text-[#064b42] outline-none">
        <option value="">Tous</option>
        {options.map((option) => <option key={option} value={option}>{optionLabels[option] || option}</option>)}
      </select>
    </label>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-[#f8f4ec] px-3 py-1 text-xs font-black text-[#064b42]">
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left shadow-sm transition ${
        active
          ? "border-[#064b42] bg-[#064b42] text-white"
          : "border-[#eadfce] bg-white text-[#064b42]"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.15em]">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black">
        {value}
      </p>
    </button>
  );
}
