"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState("adoptant");
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [island, setIsland] = useState("");
  const [city, setCity] = useState("");

  const isOrganization = role === "association" || role === "refuge";

  async function uploadLogo() {
    if (!logoFile || !isOrganization) return "";

    const safeName = logoFile.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const path = `association-logos/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("profiles")
      .upload(path, logoFile, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("profiles").getPublicUrl(path);
    return data.publicUrl;
  }

  async function notifyAdmin({
    firstName,
    lastName,
    avatarUrl,
  }: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
  }) {
    try {
      await fetch("/api/send-new-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName,
          last_name: lastName,
          role,
          organization_name: isOrganization ? organizationName.trim() : "",
          phone: phone.trim(),
          island: island.trim(),
          city: city.trim(),
          avatar_url: avatarUrl,
        }),
      });
    } catch (error) {
      console.error("ERREUR EMAIL ADMIN:", error);
    }
  }

  async function register() {
    try {
      setLoading(true);

      if (!email.trim() || !password.trim() || !fullName.trim()) {
        alert("Merci de remplir le nom complet, l'email et le mot de passe.");
        return;
      }

      if (isOrganization && !organizationName.trim()) {
        alert("Merci d’indiquer le nom de l'association ou du refuge.");
        return;
      }

      if (password.length < 6) {
        alert("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }

      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const avatarUrl = await uploadLogo();

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            organization_name: isOrganization ? organizationName.trim() : "",
            role,
            phone: phone.trim(),
            island: island.trim(),
            city: city.trim(),
            avatar_url: avatarUrl,

            approval_status: "approved",
            is_active: true,
            is_verified: true,
            approved_at: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      await notifyAdmin({
        firstName,
        lastName,
        avatarUrl,
      });

      alert("Votre compte a été créé avec succès.");

      router.push("/login");
    } catch (error: any) {
      console.error(
        "ERREUR CREATION COMPTE COMPLETE:",
        JSON.stringify(error, null, 2)
      );

      alert(
        error?.message ||
          JSON.stringify(error) ||
          "Erreur inconnue lors de la création du compte."
      );
    } finally {
      setLoading(false);
    }
  }

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
            Créez votre compte pour accéder à TAUI TE ORA.
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
          </select>

          <input
            className="input"
            placeholder="Nom complet du responsable"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          {isOrganization && (
            <>
              <input
                className="input"
                placeholder="Nom de l'association / refuge"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />

              <div className="rounded-[28px] bg-white p-6 shadow">
                <h2 className="mb-4 text-2xl font-black text-[#064b42]">
                  Logo de l'association
                </h2>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl bg-[#f8f4ec] p-5"
                />

                {logoFile && (
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="Aperçu logo"
                    className="mt-5 h-40 w-40 rounded-full object-cover shadow-xl"
                  />
                )}
              </div>
            </>
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
            type="button"
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