"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Users, ArrowLeft } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { profileService } from "../../services/profile.service";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const currentProfile = await profileService.getCurrentProfile();

      if (!currentProfile || currentProfile.role !== "admin") {
        router.replace("/");
        return;
      }

      const data = await profileService.getAllProfiles();
      setUsers(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveUser(id: string) {
    await profileService.approveProfile(id);
    await loadUsers();
  }

  async function rejectUser(id: string) {
    await profileService.rejectProfile(id);
    await loadUsers();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] font-black text-[#064b42]">
        Chargement...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-7xl">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mb-6 flex items-center gap-2 font-black"
        >
          <ArrowLeft size={20} />
          Retour dashboard
        </button>

        <div className="flex items-center gap-4">
          <Users size={42} />
          <h1 className="text-5xl font-black">Utilisateurs</h1>
        </div>

        <div className="mt-8 space-y-5">
          {users.map((user) => (
            <Card
              key={user.id}
              className="flex flex-col justify-between gap-6 md:flex-row md:items-center"
            >
              <div>
                <h2 className="text-2xl font-black">
                  {profileService.getDisplayName(user) || "Sans nom"}
                </h2>

                <p className="text-gray-500">{user.email}</p>

                <p className="mt-2 font-bold">
                  Rôle : {user.role || "adoptant"} — Statut :{" "}
                  {user.approval_status || "pending"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Actif : {user.is_active ? "Oui" : "Non"} — Vérifié :{" "}
                  {user.is_verified ? "Oui" : "Non"}
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => approveUser(user.id)}>
                  <Check size={18} />
                  <span className="ml-2">Valider</span>
                </Button>

                <Button variant="danger" onClick={() => rejectUser(user.id)}>
                  <X size={18} />
                  <span className="ml-2">Refuser</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}