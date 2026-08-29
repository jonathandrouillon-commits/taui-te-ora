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
} from "lucide-react";

import { supabase } from "../../lib/supabase";

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
            created_at
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

      setAnimals(
        (data || []) as Animal[]
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

                      <div>
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
