"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Eye, Trash2, PawPrint } from "lucide-react";
import { supabase } from "../../lib/supabase";
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
    const { data } = await supabase
      .from("animals")
      .select("*")
      .order("created_at", { ascending: false });

    setAnimals(data || []);
    setLoading(false);
  }

  const filtered = animals.filter((animal) =>
    animal.animal_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#f8f4ec] p-8">

      <div className="mx-auto max-w-7xl">

        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="text-5xl font-black text-[#064b42]">
              Mes animaux
            </h1>

            <p className="text-gray-500 mt-2">
              Gérez les animaux publiés par votre association.
            </p>

          </div>

          <Button
            onClick={() => router.push("/association/add-animal")}
          >
            <Plus size={20} />
            <span className="ml-2">
              Ajouter un animal
            </span>
          </Button>

        </div>

        <div className="mb-8">

          <div className="bg-white rounded-2xl shadow px-5 py-4 flex items-center">

            <Search size={22} className="text-gray-400 mr-3" />

            <input
              placeholder="Rechercher un animal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none"
            />

          </div>

        </div>

        {loading ? (

          <Card>

            Chargement...

          </Card>

        ) : filtered.length === 0 ? (

          <Card className="text-center py-20">

            <PawPrint
              size={80}
              className="mx-auto text-[#064b42]"
            />

            <h2 className="text-3xl font-black mt-6">

              Aucun animal

            </h2>

            <p className="text-gray-500 mt-3">

              Commencez par créer votre première fiche.

            </p>

            <Button
              className="mt-8"
              onClick={() => router.push("/association/add-animal")}
            >

              Ajouter un animal

            </Button>

          </Card>

        ) : (

          <div className="grid md:grid-cols-3 gap-6">

            {filtered.map((animal) => (

              <Card
                key={animal.id}
                className="space-y-5"
              >

                <div className="h-60 rounded-2xl bg-gray-100 overflow-hidden">

                  <img
                    src="/placeholder-dog.jpg"
                    className="w-full h-full object-cover"
                  />

                </div>

                <h2 className="text-3xl font-black">

                  {animal.animal_name}

                </h2>

                <p className="text-gray-500">

                  {animal.breed}

                </p>

                <div className="flex gap-2">

                  <Button variant="secondary">

                    <Eye size={18} />

                  </Button>

                  <Button variant="secondary">

                    <Pencil size={18} />

                  </Button>

                  <Button variant="danger">

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