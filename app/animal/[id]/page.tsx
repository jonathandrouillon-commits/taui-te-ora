"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AnimalActions from "../../components/animal/AnimalActions";
import AnimalGallery from "../../components/animal/AnimalGallery";
import AnimalHeader from "../../components/animal/AnimalHeader";
import AnimalHistory from "../../components/animal/AnimalHistory";
import AnimalHealth from "../../components/animal/AnimalHealth";
import AnimalCompatibility from "../../components/animal/AnimalCompatibility";

import { animalService, Animal } from "../../services/animal.service";

export default function AnimalPublicPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
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

    if (id) loadAnimal();
  }, [id]);

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
          <AnimalGallery mainPhoto={animal.photo_url} name={animal.nom} />

          <div>
            <AnimalHeader
              nom={animal.nom}
              statut={animal.statut}
              type={animal.type}
              sexe={animal.sexe}
              age={animal.age}
              race={animal.race}
              taille={animal.taille}
              poids={animal.poids}
              ile={animal.ile}
              localisation={animal.localisation}
              association={animal.association_id}
            />

            <AnimalActions animalId={animal.id} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <AnimalHistory
            histoire={animal.histoire}
            lieuCapture={animal.lieu_capture}
            tempsRue={animal.temps_rue}
          />

          <AnimalHealth
            sterilise={animal.sterilise}
            vaccine={animal.vaccine}
            identifie={animal.identifie}
            sante={animal.sante}
          />

          <AnimalCompatibility
            compatibleChiens={animal.compatible_chiens}
            compatibleChats={animal.compatible_chats}
            compatibleEnfants={animal.compatible_enfants}
          />
        </section>
      </div>
    </main>
  );
}