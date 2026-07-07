"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error: any) {
      alert(error.message || "Erreur lors du chargement du profil.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: any) {
    setProfile((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function uploadLogo(userId: string) {
    if (!logoFile) return profile.avatar_url || "";

    const safeName = logoFile.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const path = `profiles/${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("profiles")
      .upload(path, logoFile, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("profiles").getPublicUrl(path);

    return data.publicUrl;
  }

  async function saveProfile() {
    try {
      setSaving(true);

      const avatarUrl = await uploadLogo(profile.id);

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          organization_name: profile.organization_name || "",
          phone: profile.phone || "",
          island: profile.island || "",
          city: profile.city || "",
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (error) throw error;

      alert("Profil mis à jour.");
      await loadProfile();
      setLogoFile(null);
    } catch (error: any) {
      alert(error.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
        <p className="text-xl font-black">Chargement du profil...</p>
      </main>
    );
  }

  const isOrganization =
    profile.role === "association" || profile.role === "refuge";

  return (
    <main className="min-h-screen bg-[#f4eee3] p-6 text-[#064b42]">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-4xl font-black">Modifier mon profil</h1>

        <p className="mt-2 text-gray-500">
          Rôle : {profile.role || "adoptant"}
        </p>

        <div className="mt-8 space-y-5">
          <Input
            label="Prénom"
            value={profile.first_name || ""}
            onChange={(v) => updateField("first_name", v)}
          />

          <Input
            label="Nom"
            value={profile.last_name || ""}
            onChange={(v) => updateField("last_name", v)}
          />

          {isOrganization && (
            <Input
              label="Nom de l'association / refuge"
              value={profile.organization_name || ""}
              onChange={(v) => updateField("organization_name", v)}
            />
          )}

          <Input
            label="Téléphone"
            value={profile.phone || ""}
            onChange={(v) => updateField("phone", v)}
          />

          <Input
            label="Île"
            value={profile.island || ""}
            onChange={(v) => updateField("island", v)}
          />

          <Input
            label="Commune"
            value={profile.city || ""}
            onChange={(v) => updateField("city", v)}
          />

          <div className="rounded-3xl bg-[#f8f4ec] p-6">
            <h2 className="mb-4 text-2xl font-black">
              {isOrganization ? "Logo" : "Photo de profil"}
            </h2>

            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt="Profil"
                className="mb-5 h-32 w-32 rounded-full object-cover shadow"
              />
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full rounded-2xl bg-white p-4"
            />

            {logoFile && (
              <img
                src={URL.createObjectURL(logoFile)}
                alt="Aperçu"
                className="mt-5 h-32 w-32 rounded-full object-cover shadow"
              />
            )}
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="w-full rounded-2xl bg-[#064b42] py-4 text-xl font-black text-white disabled:opacity-60"
          >
            {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}