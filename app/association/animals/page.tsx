"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { animalService, Animal } from "../../services/animal.service";

export default function AssociationAnimalsPage() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAnimals();
  }, []);

  async function loadAnimals() {
    try {
      setLoading(true);
      const data = await animalService.getMyAnimals();
      setAnimals(data || []);
    } catch (error) {
      console.error(error);
      alert("Impossible de charger les animaux.");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublished(id: string, current: boolean) {
    try {
      await animalService.togglePublished(id, !current);
      await loadAnimals();
    } catch (error: any) {
      alert(error.message || "Impossible de modifier la publication.");
    }
  }

  async function deleteAnimal(id: string) {
    if (!confirm("Supprimer définitivement cet animal ?")) return;

    try {
      await animalService.delete(id);
      await loadAnimals();
    } catch (error: any) {
      alert(error.message || "Impossible de supprimer cet animal.");
    }
  }

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const name = animal.animal_name || animal.nom || "";
      const breed = animal.breed || animal.race || "";

      const matchSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        breed.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filter === "published") return animal.is_published === true;
      if (filter === "draft") return animal.is_published === false;

      return true;
    });
  }, [animals, search, filter]);

  function getMainPhoto(animal: any) {
    return (
      animal.animal_photos?.find((photo: any) => photo.is_cover)?.photo_url ||
      animal.animal_photos?.[0]?.photo_url ||
      animal.photo_url ||
      "/placeholder-animal.png"
    );
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-black uppercase tracking-[0.3em] text-[#b68b2f]">
              Association
            </p>

            <h1 className="mt-2 text-4xl font-black text-[#064b42]">
              Mes animaux
            </h1>
          </div>

          <Link
            href="/association/add-animal"
            className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white"
          >
            + Ajouter un animal
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <input
            placeholder="Rechercher par nom ou race..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-2xl bg-white p-4 shadow outline-none"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-2xl bg-white p-4 shadow outline-none"
          >
            <option value="all">Tous</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center font-bold shadow">
            Chargement...
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <div className="text-6xl">🐾</div>
            <h2 className="mt-4 text-2xl font-black text-[#064b42]">
              Aucun animal trouvé
            </h2>
            <p className="mt-2 text-gray-500">
              Ajoutez votre premier animal pour commencer les tests.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow">
            <table className="w-full">
              <thead className="bg-[#064b42] text-white">
                <tr>
                  <th className="p-4 text-left">Animal</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Sexe</th>
                  <th className="p-4 text-left">Île</th>
                  <th className="p-4 text-left">Publication</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAnimals.map((animal) => {
                  const name = animal.animal_name || animal.nom || "Sans nom";
                  const type = animal.animal_type || animal.type || "-";
                  const breed = animal.breed || animal.race || "";
                  const sex = animal.sex || animal.sexe || "-";
                  const island = animal.island || animal.ile || "-";

                  return (
                    <tr key={animal.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getMainPhoto(animal)}
                            alt={name}
                            className="h-16 w-16 rounded-xl object-cover"
                          />

                          <div>
                            <p className="font-black text-[#064b42]">{name}</p>
                            <p className="text-sm text-gray-500">
                              {breed || "Race non renseignée"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-bold">{type}</td>
                      <td className="p-4">{sex}</td>
                      <td className="p-4">{island}</td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() =>
                            togglePublished(
                              animal.id,
                              animal.is_published || false
                            )
                          }
                          className={`rounded-xl px-4 py-2 font-bold ${
                            animal.is_published
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {animal.is_published ? "Publié" : "Brouillon"}
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/animal/${animal.id}`}
                            className="rounded-xl bg-gray-100 px-3 py-2 font-bold"
                          >
                            Voir
                          </Link>

                          <Link
                            href={`/association/edit-animal/${animal.id}`}
                            className="rounded-xl bg-blue-100 px-3 py-2 font-bold text-blue-700"
                          >
                            Modifier
                          </Link>

                          <button
                            type="button"
                            onClick={() => deleteAnimal(animal.id)}
                            className="rounded-xl bg-red-100 px-3 py-2 font-bold text-red-700"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}