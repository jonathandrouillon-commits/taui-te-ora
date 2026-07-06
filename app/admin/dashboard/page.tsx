"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, PawPrint, ShieldCheck } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { profileService } from "../../services/profile.service";
import { animalService } from "../../services/animal.service";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const currentProfile = await profileService.getCurrentProfile();

      if (!currentProfile || currentProfile.role !== "admin") {
        router.replace("/");
        return;
      }

      setProfile(currentProfile);
      setUsers(await profileService.getAllProfiles());
      setAnimals(await animalService.getAllWithPhotos());
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] font-black text-[#064b42]">
        Chargement...
      </main>
    );
  }

  const pendingUsers = users.filter(
    (user) => (user.approval_status || "pending") === "pending"
  );

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black">Administration</h1>
            <p className="mt-2 text-gray-500">
              Bonjour {profileService.getDisplayName(profile)}
            </p>
          </div>

          <Button onClick={() => router.push("/admin/users")}>
            Gérer les utilisateurs
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="text-center">
            <Users className="mx-auto text-blue-600" size={42} />
            <h2 className="mt-3 text-4xl font-black">{users.length}</h2>
            <p className="text-gray-500">Utilisateurs</p>
          </Card>

          <Card className="text-center">
            <ShieldCheck className="mx-auto text-orange-500" size={42} />
            <h2 className="mt-3 text-4xl font-black">{pendingUsers.length}</h2>
            <p className="text-gray-500">En attente</p>
          </Card>

          <Card className="text-center">
            <PawPrint className="mx-auto text-green-600" size={42} />
            <h2 className="mt-3 text-4xl font-black">{animals.length}</h2>
            <p className="text-gray-500">Animaux</p>
          </Card>
        </div>

        <Card className="mt-10">
          <h2 className="text-3xl font-black">Actions rapides</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Button onClick={() => router.push("/admin/users")}>
              Valider les comptes
            </Button>

            <Button
              variant="secondary"
              onClick={() => router.push("/association/animals")}
            >
              Voir les animaux
            </Button>

            <Button variant="secondary" onClick={() => router.push("/")}>
              Retour au site
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}