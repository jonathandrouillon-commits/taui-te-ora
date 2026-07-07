"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AnimalActions from "../../components/animal/AnimalActions";
import AnimalGallery from "../../components/animal/AnimalGallery";
import AnimalHeader from "../../components/animal/AnimalHeader";
import AnimalHistory from "../../components/animal/AnimalHistory";
import AnimalHealth from "../../components/animal/AnimalHealth";
import AnimalCompatibility from "../../components/animal/AnimalCompatibility";

import { animalService } from "../../services/animal.service";

export default function AnimalPublicPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [animal, setAnimal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadAnimal();
  }, [id]);

  async function loadAnimal() {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await animalService.getById(id);
      setAnimal(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Animal introuvable ou erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
        <p className="text-xl font-black">Chargement de la fiche animal...</p>
      </main>
    );
  }

  if (errorMessage || !animal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] px-4 text-[#064b42]">
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black">Fiche introuvable</h1>
          <p className="mt-3 text-gray-600">{errorMessage}</p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-[#064b42] px-5 py-3 font-bold text-white"
          >
            Retour
          </button>
        </div>
      </main>
    );
  }

  const name = animal.animal_name || animal.nom || "Animal";
  const type = animal.animal_type || animal.type || "";
  const sexe = animal.sex || animal.sexe || "";
  const age = animal.age_label || animal.age || "";
  const race = animal.breed || animal.race || "";
  const taille = animal.size_label || animal.taille || "";
  const poids = animal.weight_kg ? `${animal.weight_kg} kg` : animal.poids || "";
  const ile = animal.island || animal.ile || "";
  const localisation = animal.city || animal.localisation || "";
  const association =
    animal.owner_profile?.organization_name ||
    animal.association_name ||
    animal.association_id ||
    "";
  const statut = animal.is_published ? "À adopter" : "Brouillon";

  const mainPhoto =
    animal.animal_photos?.find((photo: any) => photo.is_cover)?.photo_url ||
    animal.animal_photos?.[0]?.photo_url ||
    animal.photo_url ||
    null;

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-6 text-[#064b42]">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-xl bg-white px-4 py-2 font-bold shadow"
        >
          ← Retour
        </button>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <AnimalGallery mainPhoto={mainPhoto} name={name} />

          <div>
            <AnimalHeader
              nom={name}
              statut={statut}
              type={type}
              sexe={sexe}
              age={age}
              race={race}
              taille={taille}
              poids={poids}
              ile={ile}
              localisation={localisation}
              association={association}
            />

            <AnimalActions animalId={animal.id} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <AnimalHistory
            histoire={animal.story || animal.histoire || ""}
            lieuCapture={animal.capture_location || animal.lieu_capture || ""}
            tempsRue={animal.street_duration || animal.temps_rue || ""}
          />

          <AnimalHealth
            sterilise={animal.sterilized ?? animal.sterilise ?? false}
            vaccine={animal.vaccinated ?? animal.vaccine ?? false}
            identifie={animal.microchipped ?? animal.identifie ?? false}
            sante={animal.health_status || animal.sante || ""}
          />

          <AnimalCompatibility
            compatibleChiens={animal.compatible_chiens || null}
            compatibleChats={animal.compatible_chats || null}
            compatibleEnfants={animal.compatible_enfants || null}
          />
        </section>
      </div>
    </main>
  );
}