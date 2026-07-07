"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Users, ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  role: string | null;
  phone: string | null;
  island: string | null;
  city: string | null;
  approval_status: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  created_at?: string | null;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: currentProfile, error: currentError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (currentError) throw currentError;

      if (currentProfile?.role !== "admin") {
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  }

  async function approveUser(id: string) {
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        is_verified: true,
        is_active: true,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadUsers();
  }

  async function rejectUser(id: string) {
    const reason = prompt("Motif du refus ?", "Profil incomplet");

    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: "rejected",
        is_verified: false,
        is_active: false,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert(reason ? `Compte refusé : ${reason}` : "Compte refusé.");
    await loadUsers();
  }

  const filteredUsers = useMemo(() => {
    if (filter === "all") return users;
    return users.filter((user) => (user.approval_status || "pending") === filter);
  }, [users, filter]);

  function getDisplayName(user: Profile) {
    if (user.organization_name) return user.organization_name;

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return fullName || user.email || "Sans nom";
  }

  function getStatusLabel(status?: string | null) {
    if (status === "approved") return "Validé";
    if (status === "rejected") return "Refusé";
    return "En attente";
  }

  function getRoleLabel(role?: string | null) {
    if (role === "association") return "Association";
    if (role === "refuge") return "Refuge";
    if (role === "admin") return "Administrateur";
    return "Adoptant";
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
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="mb-6 flex items-center gap-2 font-black"
        >
          <ArrowLeft size={20} />
          Retour dashboard
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Users size={42} />
            <h1 className="text-5xl font-black">Utilisateurs</h1>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-2xl bg-white px-5 py-4 font-bold shadow outline-none"
          >
            <option value="pending">En attente</option>
            <option value="approved">Validés</option>
            <option value="rejected">Refusés</option>
            <option value="all">Tous</option>
          </select>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat label="Total" value={users.length} />
          <Stat
            label="En attente"
            value={
              users.filter((user) => (user.approval_status || "pending") === "pending")
                .length
            }
          />
          <Stat
            label="Validés"
            value={users.filter((user) => user.approval_status === "approved").length}
          />
          <Stat
            label="Refusés"
            value={users.filter((user) => user.approval_status === "rejected").length}
          />
        </div>

        <div className="mt-8 space-y-5">
          {filteredUsers.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow">
              <ShieldCheck className="mx-auto text-[#064b42]" size={52} />
              <h2 className="mt-4 text-2xl font-black">
                Aucun utilisateur dans cette catégorie
              </h2>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <article
                key={user.id}
                className="flex flex-col justify-between gap-6 rounded-3xl bg-white p-6 shadow md:flex-row md:items-center"
              >
                <div>
                  <h2 className="text-2xl font-black">{getDisplayName(user)}</h2>

                  <p className="text-gray-500">{user.email}</p>

                  <p className="mt-2 font-bold">
                    Rôle : {getRoleLabel(user.role)} — Statut :{" "}
                    {getStatusLabel(user.approval_status)}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {user.phone || "Téléphone non renseigné"} —{" "}
                    {user.city || "Commune non renseignée"} —{" "}
                    {user.island || "Île non renseignée"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Actif : {user.is_active ? "Oui" : "Non"} — Vérifié :{" "}
                    {user.is_verified ? "Oui" : "Non"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => approveUser(user.id)}
                    className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white"
                  >
                    <Check size={18} />
                    Valider
                  </button>

                  <button
                    type="button"
                    onClick={() => rejectUser(user.id)}
                    className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white"
                  >
                    <X size={18} />
                    Refuser
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b68b2f]">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black text-[#064b42]">{value}</p>
    </div>
  );
}