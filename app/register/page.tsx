"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState("adoptant");
  const [loading, setLoading] = useState(false);

  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [island, setIsland] = useState("");
  const [city, setCity] = useState("");

  async function uploadProfileImage(userId: string) {
    if (!profileImage) return "";

    const safeName = profileImage.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("profiles")
      .upload(path, profileImage, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("profiles").getPublicUrl(path);

    return data.publicUrl;
  }

  async function register() {
    try {
      setLoading(true);

      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const avatarUrl = await uploadProfileImage(data.user.id);

        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          organization_name: organizationName,
          role,
          phone,
          island,
          city,
          avatar_url: avatarUrl,
          approval_status: "pending",
          is_verified: false,
          is_active: true,
        });
      }

      alert("Compte créé. Il est en attente de validation.");
      router.push("/pending-approval");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const isOrganization = role === "association" || role === "refuge";

  return (
    <main className="min-h-screen bg-[#f5ead8] p-6 text-[#3b2417]">
      <section className="mx-auto max-w-4xl rounded-[36px] border-4 border-[#d9bf92] bg-[#fff3dc] p-8 shadow-2xl">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="TAUI TE ORA"
            className="mx-auto h-28 w-28 object-contain"
          />

          <h1 className="mt-4 text-5xl font-black text-[#064b42]">
            Créer un compte
          </h1>

          <p className="mt-2 text-gray-600">
            Votre compte devra être validé par l’administration.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="adoptant">Adoptant</option>
            <option value="association">Association</option>
            <option value="refuge">Refuge</option>
            <option value="admin">Administration</option>
          </select>

          <div className="rounded-[28px] bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-black text-[#064b42]">
              {isOrganization ? "Logo de la structure" : "Photo de profil"}
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
              className="w-full rounded-2xl bg-[#f8f4ec] p-5"
            />

            {profileImage && (
              <img
                src={URL.createObjectURL(profileImage)}
                alt="Aperçu"
                className="mt-5 h-40 w-40 rounded-full object-cover shadow-xl"
              />
            )}
          </div>

          <input
            className="input"
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          {isOrganization && (
            <input
              className="input"
              placeholder="Nom de l'association / refuge"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          )}

          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="input"
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="input"
            placeholder="Île"
            value={island}
            onChange={(e) => setIsland(e.target.value)}
          />

          <input
            className="input"
            placeholder="Commune"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <button
            onClick={register}
            disabled={loading}
            className="w-full rounded-full bg-[#064b42] py-4 text-xl font-black text-white shadow-xl disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </div>
      </section>
    </main>
  );
}