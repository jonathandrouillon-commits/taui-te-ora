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

  const [ageWanted, setAgeWanted] = useState("");
  const [sexWanted, setSexWanted] = useState("");
  const [sizeWanted, setSizeWanted] = useState("");
  const [activityWanted, setActivityWanted] = useState("");
  const [raceWanted, setRaceWanted] = useState("");
  const [hypoallergenicWanted, setHypoallergenicWanted] = useState("");
  const [cleanWanted, setCleanWanted] = useState("");
  const [specialNeedsOpen, setSpecialNeedsOpen] = useState("");

  const isOrganization = role === "association" || role === "refuge";
  const isAdoptant = role === "adoptant";

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

            adopter_experience: isAdoptant ? adopterExperience : "",
            current_animals: isAdoptant ? currentAnimals : "",
            adoption_for: isAdoptant ? adoptionFor : "",
            children_age: isAdoptant ? childrenAge : "",
            garden_type: isAdoptant ? gardenType : "",

            age_souhaite: isAdoptant ? ageWanted : "",
            sexe_souhaite: isAdoptant ? sexWanted : "",
            taille_souhaitee: isAdoptant ? sizeWanted : "",
            activite_souhaitee: isAdoptant ? activityWanted : "",
            race_souhaitee: isAdoptant ? raceWanted : "",
            hypoallergenique: isAdoptant ? hypoallergenicWanted : "",
            proprete: isAdoptant ? cleanWanted : "",
            besoins_speciaux: isAdoptant ? specialNeedsOpen : "",
          },
        },
      });

      if (error) throw error;

      alert(
        isOrganization
          ? "Votre compte association/refuge a été créé. Il doit maintenant être validé par l’administration."
          : "Votre compte adoptant a été créé."
      );

      router.push(isOrganization ? "/pending-approval" : "/login");
    } catch (error: any) {
      console.error("ERREUR CREATION COMPTE:", error);
      alert(error?.message || "Erreur inconnue lors de la création du compte.");
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
            Les associations et refuges doivent être validés par l’administration.
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

          {isAdoptant && (
            <>
              <div className="pt-6">
                <h2 className="text-3xl font-black text-[#064b42]">
                  Questionnaire adoptant
                </h2>
              </div>

              <select
                className="input"
                value={adopterExperience}
                onChange={(e) => setAdopterExperience(e.target.value)}
              >
                <option value="">Êtes-vous déjà propriétaire d’un animal ?</option>
                <option value="oui">Oui</option>
                <option value="avant">Avant</option>
                <option value="premiere_fois">Première fois</option>
              </select>

              <select
                className="input"
                value={currentAnimals}
                onChange={(e) => setCurrentAnimals(e.target.value)}
              >
                <option value="">Avez-vous actuellement un animal ?</option>
                <option value="chien">Chien</option>
                <option value="chat">Chat</option>
                <option value="autre">Autre</option>
                <option value="aucun">Aucun</option>
              </select>

              <select
                className="input"
                value={adoptionFor}
                onChange={(e) => setAdoptionFor(e.target.value)}
              >
                <option value="">Vous adoptez pour :</option>
                <option value="moi">Moi</option>
                <option value="ma_famille">Ma famille</option>
              </select>

              <select
                className="input"
                value={childrenAge}
                onChange={(e) => setChildrenAge(e.target.value)}
              >
                <option value="">Avez-vous des enfants ?</option>
                <option value="moins_8_ans">Moins de 8 ans</option>
                <option value="plus_8_ans">Plus de 8 ans</option>
                <option value="plus_15_ans">Plus de 15 ans</option>
              </select>

              <select
                className="input"
                value={gardenType}
                onChange={(e) => setGardenType(e.target.value)}
              >
                <option value="">Type de jardin</option>
                <option value="cloture">Clôturé</option>
                <option value="ouvert">Ouvert</option>
                <option value="pas_de_jardin">Pas de jardin</option>
              </select>

              <div className="pt-6">
                <h2 className="text-3xl font-black text-[#064b42]">
                  🐾 Mon animal idéal
                </h2>
                <p className="mt-1 text-gray-600">
                  Ces réponses permettront de proposer des animaux compatibles.
                </p>
              </div>

              <select
                className="input"
                value={ageWanted}
                onChange={(e) => setAgeWanted(e.target.value)}
              >
                <option value="">Âge souhaité</option>
                <option value="puppy">Puppy — moins de 1 an</option>
                <option value="young">Young — 1 à 3 ans</option>
                <option value="adult">Adult — 3 à 8 ans</option>
                <option value="senior">Senior</option>
                <option value="aucune_preference">Aucune préférence</option>
              </select>

              <select
                className="input"
                value={sexWanted}
                onChange={(e) => setSexWanted(e.target.value)}
              >
                <option value="">Sexe souhaité</option>
                <option value="male">Mâle</option>
                <option value="femelle">Femelle</option>
                <option value="aucune_preference">Aucune préférence</option>
              </select>

              <select
                className="input"
                value={sizeWanted}
                onChange={(e) => setSizeWanted(e.target.value)}
              >
                <option value="">Taille souhaitée</option>
                <option value="petit">Petit — 0 à 10 kg</option>
                <option value="moyen">Moyen — 11 à 27 kg</option>
                <option value="large">Large — 28 à 45 kg</option>
                <option value="xl">XL — plus de 45 kg</option>
              </select>

              <select
                className="input"
                value={activityWanted}
                onChange={(e) => setActivityWanted(e.target.value)}
              >
                <option value="">Activité souhaitée</option>
                <option value="chien_de_compagnie">Chien de compagnie</option>
                <option value="cool_dog">Cool Dog</option>
                <option value="actif">Actif</option>
                <option value="tres_actif">Très actif</option>
                <option value="pas_de_preference">Pas de préférence</option>
              </select>

              <input
                className="input"
                placeholder="Race de prédilection ou pas de préférence"
                value={raceWanted}
                onChange={(e) => setRaceWanted(e.target.value)}
              />

              <select
                className="input"
                value={hypoallergenicWanted}
                onChange={(e) => setHypoallergenicWanted(e.target.value)}
              >
                <option value="">Hypoallergénique ?</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>

              <select
                className="input"
                value={cleanWanted}
                onChange={(e) => setCleanWanted(e.target.value)}
              >
                <option value="">Animal déjà propre ?</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>

              <select
                className="input"
                value={specialNeedsOpen}
                onChange={(e) => setSpecialNeedsOpen(e.target.value)}
              >
                <option value="">
                  Ouvert à un animal avec besoins spécifiques ?
                </option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </>
          )}

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