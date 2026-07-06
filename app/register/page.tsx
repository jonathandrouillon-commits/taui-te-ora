"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState("adoptant");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [island, setIsland] = useState("");
  const [city, setCity] = useState("");

  const [adopterExperience, setAdopterExperience] = useState("");
  const [currentAnimals, setCurrentAnimals] = useState("");
  const [adoptionFor, setAdoptionFor] = useState("");
  const [childrenAge, setChildrenAge] = useState("");
  const [gardenType, setGardenType] = useState("");

  const [idealAge, setIdealAge] = useState("");
  const [idealSex, setIdealSex] = useState("");
  const [idealSize, setIdealSize] = useState("");
  const [idealActivity, setIdealActivity] = useState("");
  const [idealBreed, setIdealBreed] = useState("");
  const [hypoallergenic, setHypoallergenic] = useState("");
  const [cleanliness, setCleanliness] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");

  async function register() {
    try {
      setLoading(true);

      const profileData = {
        full_name: fullName,
        organization_name: organizationName,
        role,
        phone,
        island,
        city,
        adopter_experience: adopterExperience,
        current_animals: currentAnimals,
        adoption_for: adoptionFor,
        children_age: childrenAge,
        garden_type: gardenType,
        ideal_age: idealAge,
        ideal_sex: idealSex,
        ideal_size: idealSize,
        ideal_activity: idealActivity,
        ideal_breed: idealBreed,
        hypoallergenic,
        cleanliness,
        special_needs: specialNeeds,
      };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profileData,
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          ...profileData,
        });
      }

      alert("Compte créé.");
      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#c8a980] bg-[#fff8ec]/90 px-4 py-3 text-[#3b2417] placeholder-[#8b735c] outline-none shadow-inner";

  const selectClass =
    "w-full rounded-xl border border-[#c8a980] bg-[#fff8ec]/90 px-4 py-3 text-[#3b2417] outline-none shadow-inner";

  return (
    <main className="min-h-screen bg-[#f5ead8] p-6 text-[#3b2417]">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border-4 border-[#d9bf92] bg-[#fff3dc] shadow-2xl">
        <div className="relative bg-gradient-to-b from-[#9fd4e6] to-[#fff3dc] px-8 py-10 text-center">
          <div className="absolute left-8 top-8 text-6xl">🌴</div>
          <div className="absolute right-8 top-8 text-6xl">🌺</div>

          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-white/80 shadow-xl">
            <span className="text-6xl">🐶</span>
          </div>

          <h1 className="mx-auto w-fit rounded-full bg-white/80 px-8 py-3 text-center text-3xl font-extrabold tracking-wide text-[#064b42] shadow-lg md:text-4xl">
            Famille adoptante
          </h1>

          <div className="mx-auto mt-5 w-fit rounded-full bg-gradient-to-r from-[#0f766e] to-[#16a085] px-8 py-3 text-lg font-bold uppercase tracking-widest text-white shadow-xl">
            Créer mon profil
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold">
            Ce questionnaire nous aide à mieux vous connaître et à vous proposer
            l’animal qui vous correspond.
          </p>
        </div>

        <div className="grid gap-8 p-8 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-6">
            <div className="rounded-[28px] border-2 border-[#d1b58a] bg-[#fff8ec] p-5 shadow-lg">
              <div className="mb-5 flex h-64 items-center justify-center rounded-2xl bg-[#eadcc7] text-7xl">
                📷
              </div>

              <h2 className="mb-4 rounded-xl bg-[#416b49] px-5 py-3 text-center text-2xl font-black text-white">
                Vos informations
              </h2>

              <div className="space-y-4">
                <select
                  className={selectClass}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="adoptant">Adoptant</option>
                  <option value="association">Association</option>
                  <option value="refuge">Refuge</option>
                  <option value="admin">Administration</option>
                </select>

                <input
                  className={inputClass}
                  placeholder="Nom complet"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                {(role === "association" || role === "refuge") && (
                  <input
                    className={inputClass}
                    placeholder="Nom de l'association / refuge"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                )}

                <input
                  className={inputClass}
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  className={inputClass}
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <input
                  className={inputClass}
                  placeholder="Téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <input
                  className={inputClass}
                  placeholder="Île"
                  value={island}
                  onChange={(e) => setIsland(e.target.value)}
                />

                <input
                  className={inputClass}
                  placeholder="Commune"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            {role === "adoptant" && (
              <>
                <section className="rounded-[28px] border-2 border-[#d1b58a] bg-[#fff8ec] p-6 shadow-lg">
                  <h2 className="mb-6 rounded-xl bg-[#416b49] px-5 py-3 text-center text-2xl font-black text-white">
                    🐾 Questionnaire adoptant
                  </h2>

                  <div className="grid gap-5 md:grid-cols-2">
                    <select
                      className={selectClass}
                      value={adopterExperience}
                      onChange={(e) => setAdopterExperience(e.target.value)}
                    >
                      <option value="">Êtes-vous propriétaire d’animal ?</option>
                      <option>Oui</option>
                      <option>Avant</option>
                      <option>Première fois</option>
                    </select>

                    <select
                      className={selectClass}
                      value={currentAnimals}
                      onChange={(e) => setCurrentAnimals(e.target.value)}
                    >
                      <option value="">Avez-vous actuellement un animal ?</option>
                      <option>Chien</option>
                      <option>Chat</option>
                      <option>Autre</option>
                      <option>Non</option>
                    </select>

                    <select
                      className={selectClass}
                      value={adoptionFor}
                      onChange={(e) => setAdoptionFor(e.target.value)}
                    >
                      <option value="">Vous adoptez pour :</option>
                      <option>Moi</option>
                      <option>Ma famille</option>
                    </select>

                    <select
                      className={selectClass}
                      value={childrenAge}
                      onChange={(e) => setChildrenAge(e.target.value)}
                    >
                      <option value="">Avez-vous des enfants ?</option>
                      <option>Moins de 8 ans</option>
                      <option>Plus de 8 ans</option>
                      <option>Plus de 15 ans</option>
                      <option>Pas d'enfant</option>
                    </select>

                    <select
                      className={selectClass}
                      value={gardenType}
                      onChange={(e) => setGardenType(e.target.value)}
                    >
                      <option value="">Type de jardin</option>
                      <option>Clôturé</option>
                      <option>Ouvert</option>
                      <option>Pas de jardin</option>
                    </select>
                  </div>
                </section>

                <section className="rounded-[28px] border-2 border-[#d1b58a] bg-[#fff8ec] p-6 shadow-lg">
                  <h2 className="mb-2 text-center text-4xl font-black text-[#5a2c1d]">
                    🐕 Mon Animal Idéal
                  </h2>

                  <p className="mb-6 text-center font-bold text-[#6d5945]">
                    Système de matching
                  </p>

                  <div className="grid gap-5 md:grid-cols-2">
                    <select
                      className={selectClass}
                      value={idealAge}
                      onChange={(e) => setIdealAge(e.target.value)}
                    >
                      <option value="">Âge souhaité</option>
                      <option>Puppy - moins de 1 an</option>
                      <option>Young - 1 à 3 ans</option>
                      <option>Adult - 3 à 8 ans</option>
                      <option>Senior</option>
                      <option>Aucune préférence</option>
                    </select>

                    <select
                      className={selectClass}
                      value={idealSex}
                      onChange={(e) => setIdealSex(e.target.value)}
                    >
                      <option value="">Sexe souhaité</option>
                      <option>Mâle</option>
                      <option>Femelle</option>
                      <option>Aucune préférence</option>
                    </select>

                    <select
                      className={selectClass}
                      value={idealSize}
                      onChange={(e) => setIdealSize(e.target.value)}
                    >
                      <option value="">Taille souhaitée</option>
                      <option>Petit - 0 à 10 kg</option>
                      <option>Moyen - 11 à 27 kg</option>
                      <option>Large - 28 à 45 kg</option>
                      <option>XL - plus de 45 kg</option>
                      <option>Aucune préférence</option>
                    </select>

                    <select
                      className={selectClass}
                      value={idealActivity}
                      onChange={(e) => setIdealActivity(e.target.value)}
                    >
                      <option value="">Activité souhaitée</option>
                      <option>Chien de compagnie</option>
                      <option>Cool Dog</option>
                      <option>Actif</option>
                      <option>Très actif</option>
                      <option>Pas de préférence</option>
                    </select>

                    <input
                      className={inputClass}
                      placeholder="Race de prédilection / Pas de préférence"
                      value={idealBreed}
                      onChange={(e) => setIdealBreed(e.target.value)}
                    />

                    <select
                      className={selectClass}
                      value={hypoallergenic}
                      onChange={(e) => setHypoallergenic(e.target.value)}
                    >
                      <option value="">Hypoallergénique ?</option>
                      <option>Oui</option>
                      <option>Non</option>
                    </select>

                    <select
                      className={selectClass}
                      value={cleanliness}
                      onChange={(e) => setCleanliness(e.target.value)}
                    >
                      <option value="">Propreté importante ?</option>
                      <option>Oui</option>
                      <option>Non</option>
                    </select>

                    <select
                      className={selectClass}
                      value={specialNeeds}
                      onChange={(e) => setSpecialNeeds(e.target.value)}
                    >
                      <option value="">
                        Ouvert à un animal avec besoins spécifiques ?
                      </option>
                      <option>Oui</option>
                      <option>Non</option>
                    </select>
                  </div>
                </section>
              </>
            )}

            <button
              onClick={register}
              disabled={loading}
              className="mx-auto block rounded-full bg-[#416b49] px-16 py-5 text-3xl font-black text-white shadow-xl transition hover:scale-105 disabled:opacity-60"
            >
              {loading ? "CRÉATION..." : "VALIDER"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}