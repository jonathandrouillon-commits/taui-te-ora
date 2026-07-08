"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type AnimalPhoto = {
  id: string;
  animal_id: string;
  photo_url: string;
  is_cover: boolean;
  sort_order: number;
};

type Animal = {
  id: string;
  animal_name: string | null;
  animal_type: string | null;
  age_label: string | null;
  sex: string | null;
  breed: string | null;
  size_label: string | null;
  association_name: string | null;
  island: string | null;
  city: string | null;
  status: string | null;
  description_character: string | null;
  health_status: string | null;
  special_needs: string | null;
  story: string | null;
  is_adopted: boolean | null;
  vaccinated: boolean | null;
  sterilized: boolean | null;
  microchipped: boolean | null;
  compatible_chiens: boolean | null;
  compatible_chats: boolean | null;
  compatible_enfants: boolean | null;
  animal_photos?: AnimalPhoto[];
};

export default function SearchPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [animalType, setAnimalType] = useState("");
  const [sex, setSex] = useState("");
  const [size, setSize] = useState("");
  const [status, setStatus] = useState("");
  const [island, setIsland] = useState("");
  const [city, setCity] = useState("");
  const [vaccinated, setVaccinated] = useState("");
  const [sterilized, setSterilized] = useState("");
  const [microchipped, setMicrochipped] = useState("");

  useEffect(() => {
    searchAnimals();
  }, []);

  async function searchAnimals() {
    try {
      setLoading(true);

      let query = supabase
        .from("animals")
        .select(
          `
          *,
          animal_photos (
            id,
            animal_id,
            photo_url,
            is_cover,
            sort_order
          )
        `
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (keyword.trim()) {
        query = query.or(
          `animal_name.ilike.%${keyword}%,breed.ilike.%${keyword}%,description_character.ilike.%${keyword}%,story.ilike.%${keyword}%,association_name.ilike.%${keyword}%`
        );
      }

      if (animalType) query = query.eq("animal_type", animalType);
      if (sex) query = query.eq("sex", sex);
      if (size) query = query.eq("size_label", size);
      if (status) query = query.eq("status", status);
      if (island) query = query.ilike("island", `%${island}%`);
      if (city) query = query.ilike("city", `%${city}%`);

      if (vaccinated) query = query.eq("vaccinated", vaccinated === "Oui");
      if (sterilized) query = query.eq("sterilized", sterilized === "Oui");
      if (microchipped) query = query.eq("microchipped", microchipped === "Oui");

      const { data, error } = await query;

      if (error) throw error;

      setAnimals(data || []);
    } catch (error: any) {
      alert(error.message || "Erreur pendant la recherche.");
    } finally {
      setLoading(false);
    }
  }

  function getAnimalImage(animal: Animal) {
    const cover = animal.animal_photos?.find((photo) => photo.is_cover);
    if (cover?.photo_url) return cover.photo_url;

    const firstPhoto = animal.animal_photos
      ?.slice()
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];

    return firstPhoto?.photo_url || "";
  }

  function resetFilters() {
    setKeyword("");
    setAnimalType("");
    setSex("");
    setSize("");
    setStatus("");
    setIsland("");
    setCity("");
    setVaccinated("");
    setSterilized("");
    setMicrochipped("");

    setTimeout(() => {
      searchAnimals();
    }, 100);
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-[#064b42]">
          🔎 Recherche animaux
        </h1>

        <p className="mt-2 text-gray-600">
          Rechercher un animal selon les informations de sa fiche.
        </p>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-lg">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Recherche"
              placeholder="Nom, race, description, association..."
              value={keyword}
              onChange={setKeyword}
            />

            <Select
              label="Type d'animal"
              value={animalType}
              onChange={setAnimalType}
              options={["Chien", "Chat", "Oiseau", "Autre"]}
            />

            <Select
              label="Sexe"
              value={sex}
              onChange={setSex}
              options={["Mâle", "Femelle", "Inconnu"]}
            />

            <Select
              label="Taille"
              value={size}
              onChange={setSize}
              options={["Petit", "Moyen", "Grand", "Très grand"]}
            />

            <Select
              label="Statut"
              value={status}
              onChange={setStatus}
              options={["available", "adopted", "lost", "found", "care"]}
            />

            <Input
              label="Île"
              placeholder="Tahiti, Moorea..."
              value={island}
              onChange={setIsland}
            />

            <Input
              label="Commune"
              placeholder="Papeete, Faa'a..."
              value={city}
              onChange={setCity}
            />

            <Select
              label="Vacciné"
              value={vaccinated}
              onChange={setVaccinated}
              options={["Oui", "Non"]}
            />

            <Select
              label="Stérilisé"
              value={sterilized}
              onChange={setSterilized}
              options={["Oui", "Non"]}
            />

            <Select
              label="Identifié / pucé"
              value={microchipped}
              onChange={setMicrochipped}
              options={["Oui", "Non"]}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={searchAnimals}
              disabled={loading}
              className="rounded-full bg-[#064b42] px-8 py-3 font-black text-white"
            >
              {loading ? "Recherche..." : "Rechercher"}
            </button>

            <button
              onClick={resetFilters}
              className="rounded-full bg-[#eadfce] px-8 py-3 font-bold text-[#064b42]"
            >
              Réinitialiser
            </button>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-black text-[#064b42]">
            Résultats : {animals.length}
          </h2>

          {animals.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow">
              Aucun animal trouvé.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {animals.map((animal) => {
                const imageUrl = getAnimalImage(animal);

                return (
                  <Link
                    key={animal.id}
                    href={`/animal/${animal.id}`}
                    className="overflow-hidden rounded-[2rem] bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="h-64 bg-[#eadfce]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={animal.animal_name || "Animal"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-6xl">
                          🐾
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-2xl font-black text-[#064b42]">
                        {animal.animal_name || "Sans nom"}
                      </h3>

                      <p className="mt-2 text-gray-600">
                        {animal.animal_type || "Animal"} •{" "}
                        {animal.sex || "Sexe inconnu"} •{" "}
                        {animal.age_label || "Âge inconnu"}
                      </p>

                      <p className="mt-1 text-gray-600">
                        {animal.breed || "Race inconnue"} •{" "}
                        {animal.size_label || "Taille inconnue"}
                      </p>

                      <p className="mt-3 font-bold text-[#b58b5b]">
                        📍 {animal.city || "Commune inconnue"} -{" "}
                        {animal.island || "Île inconnue"}
                      </p>

                      {animal.association_name && (
                        <p className="mt-2 text-sm font-semibold text-[#064b42]">
                          🏠 {animal.association_name}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge label={animal.status || "Statut inconnu"} />

                        {animal.vaccinated && <Badge label="Vacciné" />}
                        {animal.sterilized && <Badge label="Stérilisé" />}
                        {animal.microchipped && <Badge label="Identifié" />}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-[#f8f4ec] px-4 py-2 text-xs font-bold text-[#064b42]">
      {label}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
      >
        <option value="">Tous</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}