"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  animalService,
  type Animal,
} from "../../services/animal.service";

type FilterValue =
  | "all"
  | "published"
  | "draft";

function getAnimalPhoto(
  animal: Animal
): string {
  const photos =
    animal.animal_photos;

  if (
    Array.isArray(photos) &&
    photos.length > 0
  ) {
    const cover =
      photos.find(
        (
          photo
        ) =>
          typeof photo === "object" &&
          photo !== null &&
          "is_cover" in photo &&
          photo.is_cover === true
      );

    if (
      cover &&
      typeof cover === "object" &&
      "photo_url" in cover &&
      typeof cover.photo_url === "string"
    ) {
      return cover.photo_url;
    }

    const first =
      photos[0];

    if (
      typeof first === "object" &&
      first !== null &&
      "photo_url" in first &&
      typeof first.photo_url === "string"
    ) {
      return first.photo_url;
    }
  }

  if (
    typeof animal.photo_url ===
      "string" &&
    animal.photo_url
  ) {
    return animal.photo_url;
  }

  return "";
}

function textValue(
  value:
    | string
    | null
    | undefined,
  fallback = "—"
): string {
  const clean =
    String(
      value ?? ""
    ).trim();

  return clean || fallback;
}

function statusLabel(
  animal: Animal
): string {
  return animal.is_published
    ? "Publié"
    : "Brouillon";
}

export default function AssociationAnimalsPage() {
  const router =
    useRouter();

  const [
    animals,
    setAnimals,
  ] =
    useState<Animal[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<FilterValue>(
      "all"
    );

async function loadAnimals() {
    try {
      setLoading(true);

      const data =
        await animalService.getMyAnimals();

      setAnimals(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur chargement animaux :",
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
  }

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void loadAnimals();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, []);

  async function deleteAnimal(
    animal: Animal
  ) {
    const animalName =
      textValue(
        animal.animal_name,
        "cet animal"
      );

    const confirmed =
      window.confirm(
        `Supprimer définitivement ${animalName} ?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        animal.id
      );

      await animalService.delete(
        animal.id
      );

      setAnimals(
        (
          current
        ) =>
          current.filter(
            (
              item
            ) =>
              item.id !==
              animal.id
          )
      );
    } catch (
      error: unknown
    ) {
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
      setDeletingId(
        null
      );
    }
  }

  const filteredAnimals =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return animals.filter(
          (
            animal
          ) => {
            if (
              filter ===
                "published" &&
              !animal.is_published
            ) {
              return false;
            }

            if (
              filter ===
                "draft" &&
              animal.is_published
            ) {
              return false;
            }

            if (!query) {
              return true;
            }

            const searchable =
              [
                animal.animal_name,
                animal.breed,
                animal.animal_type,
                animal.sex,
                animal.island,
                animal.city,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(
              query
            );
          }
        );
      },
      [
        animals,
        filter,
        search,
      ]
    );

  return (
    <main className="min-h-screen bg-[#f8f3e8] px-4 pb-16 pt-8 text-[#064b42] sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#b68b2f] sm:text-base">
            Association
          </p>

          <h1 className="mt-3 text-4xl font-black leading-none sm:text-5xl lg:text-6xl">
            Mes animaux
          </h1>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/association/add-animal"
              )
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[24px] bg-[#064b42] px-6 py-4 text-lg font-black text-white shadow-sm transition hover:opacity-90 sm:w-auto sm:text-xl"
          >
            <Plus
              size={24}
            />

            Ajouter un animal
          </button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_260px]">
          <label className="relative block">
            <Search
              size={24}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Rechercher par nom ou race..."
              className="w-full rounded-[22px] border border-[#ded7cc] bg-white py-4 pl-14 pr-5 text-base text-[#2f2a26] shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#064b42] sm:text-lg"
            />
          </label>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target
                  .value as FilterValue
              )
            }
            className="w-full rounded-[22px] border border-[#ded7cc] bg-white px-5 py-4 text-base text-[#2f2a26] shadow-sm outline-none focus:border-[#064b42] sm:text-lg"
          >
            <option value="all">
              Tous
            </option>

            <option value="published">
              Publiés
            </option>

            <option value="draft">
              Brouillons
            </option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
            <p className="font-bold text-[#746c64]">
              Chargement des animaux...
            </p>
          </div>
        ) : filteredAnimals.length ===
          0 ? (
          <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-black text-[#064b42]">
              Aucun animal
            </p>

            <p className="mt-2 text-sm text-[#746c64]">
              Aucun animal ne correspond
              à votre recherche.
            </p>
          </div>
        ) : (
          <>
            {/* =========================
                MOBILE
            ========================== */}

            <div className="grid gap-4 md:hidden">
              {filteredAnimals.map(
                (
                  animal
                ) => {
                  const photo =
                    getAnimalPhoto(
                      animal
                    );

                  return (
                    <article
                      key={
                        animal.id
                      }
                      className="overflow-hidden rounded-[26px] bg-white shadow-sm"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-[#eee7dc]">
                          {photo ? (
                            <img
                              src={
                                photo
                              }
                              alt={
                                textValue(
                                  animal.animal_name,
                                  "Animal"
                                )
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-3xl">
                              🐾
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h2 className="truncate text-2xl font-black text-[#064b42]">
                                {textValue(
                                  animal.animal_name,
                                  "Sans nom"
                                )}
                              </h2>

                              <span
                                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                                  animal.is_published
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {statusLabel(
                                  animal
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                Type
                              </p>

                              <p className="font-bold text-[#2f2a26]">
                                {textValue(
                                  animal.animal_type
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                Sexe
                              </p>

                              <p className="font-bold text-[#2f2a26]">
                                {textValue(
                                  animal.sex
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                Île
                              </p>

                              <p className="font-bold text-[#2f2a26]">
                                {textValue(
                                  animal.island
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                Race
                              </p>

                              <p className="truncate font-bold text-[#2f2a26]">
                                {textValue(
                                  animal.breed
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 border-t border-[#eee7dc]">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/association/edit-animal/${animal.id}`
                            )
                          }
                          className="flex items-center justify-center gap-2 px-4 py-4 font-black text-[#064b42]"
                        >
                          <Pencil
                            size={18}
                          />

                          Modifier
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            animal.id
                          }
                          onClick={() =>
                            void deleteAnimal(
                              animal
                            )
                          }
                          className="flex items-center justify-center gap-2 border-l border-[#eee7dc] px-4 py-4 font-black text-red-600 disabled:opacity-50"
                        >
                          <Trash2
                            size={18}
                          />

                          {deletingId ===
                          animal.id
                            ? "Suppression..."
                            : "Supprimer"}
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            {/* =========================
                TABLETTE / PC
            ========================== */}

            <div className="hidden overflow-hidden rounded-[28px] bg-white shadow-sm md:block">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_160px] bg-[#064b42] px-6 py-5 font-black text-white">
                <div>
                  Animal
                </div>

                <div>
                  Type
                </div>

                <div>
                  Sexe
                </div>

                <div>
                  Île
                </div>

                <div className="text-right">
                  Actions
                </div>
              </div>

              {filteredAnimals.map(
                (
                  animal
                ) => {
                  const photo =
                    getAnimalPhoto(
                      animal
                    );

                  return (
                    <div
                      key={
                        animal.id
                      }
                      className="grid min-h-[120px] grid-cols-[2fr_1fr_1fr_1fr_160px] items-center border-b border-[#eee7dc] px-6 py-5 last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-[#eee7dc]">
                          {photo ? (
                            <img
                              src={
                                photo
                              }
                              alt={
                                textValue(
                                  animal.animal_name,
                                  "Animal"
                                )
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              🐾
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xl font-black text-[#064b42]">
                            {textValue(
                              animal.animal_name,
                              "Sans nom"
                            )}
                          </p>

                          <p className="mt-1 truncate text-sm text-gray-500">
                            {textValue(
                              animal.breed,
                              "Race non renseignée"
                            )}
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                              animal.is_published
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {statusLabel(
                              animal
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="font-semibold text-[#2f2a26]">
                        {textValue(
                          animal.animal_type
                        )}
                      </div>

                      <div className="font-semibold text-[#2f2a26]">
                        {textValue(
                          animal.sex
                        )}
                      </div>

                      <div className="font-semibold text-[#2f2a26]">
                        {textValue(
                          animal.island
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/association/edit-animal/${animal.id}`
                            )
                          }
                          className="rounded-xl bg-[#f3eee5] p-3 text-[#064b42] transition hover:bg-[#e8dfd1]"
                          title="Modifier"
                        >
                          <Pencil
                            size={18}
                          />
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            animal.id
                          }
                          onClick={() =>
                            void deleteAnimal(
                              animal
                            )
                          }
                          className="rounded-xl bg-red-50 p-3 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2
                            size={18}
                          />
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}