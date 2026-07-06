"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Plus, Home, Users } from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { profileService } from "../../services/profile.service";
import { animalService } from "../../services/animal.service";

export default function RefugeDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [animals, setAnimals] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const p = await profileService.getCurrentProfile();

      if (!p || p.role !== "refuge") {
        router.replace("/");
        return;
      }

      setProfile(p);

      const list = await animalService.getAllWithPhotos();
      setAnimals(list);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center font-black text-[#064b42]">
        Chargement...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-[#064b42]">
              Dashboard Refuge
            </h1>

            <p className="mt-2 text-gray-500">
              Bonjour {profile.full_name}
            </p>
          </div>

          <Button onClick={() => router.push("/association/add-animal")}>
            <Plus size={20} />
            <span className="ml-2">Ajouter un animal</span>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="text-center">
            <PawPrint className="mx-auto text-[#064b42]" size={42} />
            <h2 className="mt-3 text-4xl font-black">{animals.length}</h2>
            <p className="text-gray-500">Animaux suivis</p>
          </Card>

          <Card className="text-center">
            <Home className="mx-auto text-green-600" size={42} />
            <h2 className="mt-3 text-4xl font-black">0</h2>
            <p className="text-gray-500">Places disponibles</p>
          </Card>

          <Card className="text-center">
            <Users className="mx-auto text-blue-600" size={42} />
            <h2 className="mt-3 text-4xl font-black">0</h2>
            <p className="text-gray-500">Demandes reçues</p>
          </Card>
        </div>

        <Card className="mt-10">
          <h2 className="text-3xl font-black text-[#064b42]">
            Gestion du refuge
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Button onClick={() => router.push("/association/add-animal")}>
              Ajouter un animal
            </Button>

            <Button
              variant="secondary"
              onClick={() => router.push("/association/animals")}
            >
              Voir les animaux
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}