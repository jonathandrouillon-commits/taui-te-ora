"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, PawPrint } from "lucide-react";
import { animalService } from "../../services/animal.service";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function AnimalsPage() {
  const router = useRouter();

  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAnimals();
  }, []);

  async function loadAnimals() {
    try {
      setLoading(true);
      const data = await animalService.getAllWithPhotos();
      setAnimals(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnimal(id: string) {
    const ok = window.confirm("Supprimer définitivement cet animal ?");
    if (!ok) return;

    try {
      await animalService.delete(id);
      await loadAnimals();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function togglePublished(id: string, currentStatus: boolean) {
    try {
      await animalService.togglePublished(id, !currentStatus);
      await loadAnimals();
    } catch (error: any) {
      alert(error.message);
    }
  }

  const filtered = animals.filter((animal) =>
    animal.animal_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#f8f4ec] p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-[#064b42]">Mes animaux</h1>
            <p className="mt-2 text-gray-500">
              Gérez les fiches animaux de votre association.
            </p>
          </div>

          <Button onClick={() => router.push("/association/add-animal")}>
            <Plus size={20} />
            <span className="ml-2">Ajouter un animal</span>
          </Button>
        </div>

        <div className="mb-8 flex items-center rounded-2xl bg-white px-5 py-4 shadow">
          <Search size={22} className="mr-3 text-gray-400" />
          <input
            placeholder="Rechercher un animal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none"
          />
        </div>

        {loading ? (
          <Card>Chargement...</Card>
        ) : filtered.length === 0 ? (
          <Card className="py-20 text-center">
            <PawPrint size={80} className="mx-auto text-[#064b42]" />
            <h2 className="mt-6 text-3xl font-black">Aucun animal</h2>
            <p className="mt-3 text-gray-500">
              Commencez par créer votre première fiche.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {filtered.map((animal) => (
              <Card key={animal.id} className="space-y-5">
                <div className="h-60 overflow-hidden rounded-2xl bg-gray-100">
                  <img
                    src={
                      animal.photo_url ||
                      "https://placehold.co/600x600?text=Pas+de+photo"
                    }
                    alt={animal.animal_name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <h2 className="text-3xl font-black text-[#064b42]">
                    {animal.animal_name}
                  </h2>

                  <p className="mt-1 text-gray-500">
                    {animal.breed || animal.animal_type}
                  </p>

                  <button
                    onClick={() =>
                      togglePublished(animal.id, animal.is_published)
                    }
                    className={`mt-3 rounded-full px-4 py-2 text-sm font-black ${
                      animal.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {animal.is_published ? "Publié" : "Brouillon"}
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      router.push(`/association/edit-animal/${animal.id}`)
                    }
                  >
                    <Pencil size={18} />
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => deleteAnimal(animal.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}