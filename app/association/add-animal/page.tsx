"use client";

import { useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function AddAnimalPage() {
  const [step, setStep] = useState(1);

  const [animal, setAnimal] = useState({
    name: "",
    species: "Chien",
    breed: "",
    sex: "Femelle",
    age: "",
    size: "",
    island: "",
    city: "",
    description: "",
  });

  function updateField(field: string, value: string) {
    setAnimal((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-5xl font-black">Ajouter un animal</h1>

        <p className="mt-3 text-gray-500">
          Étape {step} / 7 — Création du passeport animal
        </p>

        <div className="mt-6 h-4 rounded-full bg-white">
          <div
            className="h-4 rounded-full bg-[#064b42]"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        <Card className="mt-10 space-y-6">
          {step === 1 && (
            <>
              <h2 className="text-3xl font-black">Informations générales</h2>

              <Input
                placeholder="Nom de l'animal"
                value={animal.name}
                onChange={(value) => updateField("name", value)}
              />

              <select
                value={animal.species}
                onChange={(e) => updateField("species", e.target.value)}
                className="w-full rounded-2xl border border-[#eadfce] bg-white px-5 py-4 text-lg outline-none"
              >
                <option>Chien</option>
                <option>Chat</option>
                <option>Canard</option>
                <option>Poule</option>
                <option>Autre</option>
              </select>

              <Input
                placeholder="Race"
                value={animal.breed}
                onChange={(value) => updateField("breed", value)}
              />

              <select
                value={animal.sex}
                onChange={(e) => updateField("sex", e.target.value)}
                className="w-full rounded-2xl border border-[#eadfce] bg-white px-5 py-4 text-lg outline-none"
              >
                <option>Femelle</option>
                <option>Mâle</option>
                <option>Inconnu</option>
              </select>

              <Input
                placeholder="Âge estimé"
                value={animal.age}
                onChange={(value) => updateField("age", value)}
              />

              <Input
                placeholder="Taille / poids"
                value={animal.size}
                onChange={(value) => updateField("size", value)}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-3xl font-black">Localisation</h2>

              <Input
                placeholder="Île"
                value={animal.island}
                onChange={(value) => updateField("island", value)}
              />

              <Input
                placeholder="Commune / quartier"
                value={animal.city}
                onChange={(value) => updateField("city", value)}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-3xl font-black">Description</h2>

              <textarea
                placeholder="Décris son caractère, son histoire, son comportement..."
                value={animal.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="min-h-48 w-full rounded-2xl border border-[#eadfce] bg-white px-5 py-4 text-lg outline-none"
              />
            </>
          )}

          {step >= 4 && (
            <div>
              <h2 className="text-3xl font-black">Étape {step}</h2>
              <p className="mt-3 text-gray-500">
                Cette étape sera développée ensuite.
              </p>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="secondary"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            >
              Retour
            </Button>

            <Button
              onClick={() => setStep((prev) => Math.min(7, prev + 1))}
            >
              Suivant
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}