"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, Trash2, Eye } from "lucide-react";

import { animalService } from "../../../services/animal.service";
import { photoService } from "../../../services/photo.service";

import AnimalTabs, { TabKey } from "./AnimalTabs";
import GeneralTab from "./GeneralTab";
import PhotosTab from "./PhotosTab";
import HealthTab from "./HealthTab";
import CharacterTab from "./CharacterTab";
import StoryTab from "./StoryTab";
import LocationTab from "./LocationTab";
import AdoptionTab from "./AdoptionTab";
import PreviewTab from "./PreviewTab";

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [animal, setAnimal] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAnimal();
  }, [id]);

  async function loadAnimal() {
    try {
      setLoading(true);

      const [animalData, photosData] = await Promise.all([
        animalService.getById(id),
        photoService.getByAnimalId(id),
      ]);

      setAnimal(animalData);
      setPhotos(photosData || []);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Impossible de charger l’animal.");
      router.push("/association/animals");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: any) {
    setAnimal((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveAnimal() {
    if (!animal) return;

    try {
      setSaving(true);

      await animalService.update(id, {
        animal_name: animal.animal_name || null,
        animal_type: animal.animal_type || null,
        breed: animal.breed || null,
        sex: animal.sex || null,
        age_label: animal.age_label || null,
        size_label: animal.size_label || null,
        weight_kg: animal.weight_kg ? Number(animal.weight_kg) : null,

        island: animal.island || null,
        city: animal.city || null,
        map_address: animal.map_address || null,
        map_visibility: animal.map_visibility || null,

        description_character: animal.description_character || null,
        story: animal.story || null,
        capture_location: animal.capture_location || null,
        street_duration: animal.street_duration || null,

        health_status: animal.health_status || null,
        special_needs: animal.special_needs || null,
        vaccinated: !!animal.vaccinated,
        sterilized: !!animal.sterilized,
        microchipped: !!animal.microchipped,

        is_published: !!animal.is_published,
      });

      alert("Animal sauvegardé.");
      await loadAnimal();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAnimal() {
    if (!confirm("Supprimer définitivement cet animal ?")) return;

    try {
      setSaving(true);
      await animalService.delete(id);
      alert("Animal supprimé.");
      router.push("/association/animals");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished() {
    if (!animal) return;

    try {
      setSaving(true);

      const nextValue = !animal.is_published;

      await animalService.togglePublished(id, nextValue);

      setAnimal((prev: any) => ({
        ...prev,
        is_published: nextValue,
      }));

      alert(nextValue ? "Animal publié." : "Animal passé en brouillon.");
    } catch (error: any) {
      alert(error.message || "Erreur lors du changement de statut.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] text-[#064b42]">
        <p className="text-xl font-black">Chargement de l’éditeur...</p>
      </main>
    );
  }

  if (!animal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] text-[#064b42]">
        <p className="text-xl font-black">Animal introuvable.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-6 text-[#064b42]">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/association/animals")}
              className="mb-3 rounded-2xl bg-white px-4 py-2 font-bold shadow"
            >
              ← Retour aux animaux
            </button>

            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b68b2f]">
              Édition animal
            </p>

            <h1 className="mt-2 text-4xl font-black">
              {animal.animal_name || "Animal sans nom"}
            </h1>

            <p className="mt-2 text-gray-500">
              {animal.is_published ? "Publié" : "Brouillon"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(`/animal/${id}`)}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black shadow"
            >
              <Eye size={18} />
              Voir
            </button>

            <button
              type="button"
              onClick={togglePublished}
              disabled={saving}
              className={`rounded-2xl px-5 py-3 font-black text-white disabled:opacity-60 ${
                animal.is_published ? "bg-orange-600" : "bg-green-700"
              }`}
            >
              {animal.is_published ? "Dépublier" : "Publier"}
            </button>

            <button
              type="button"
              onClick={saveAnimal}
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-[#064b42] px-5 py-3 font-black text-white disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>

            <button
              type="button"
              onClick={deleteAnimal}
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-60"
            >
              <Trash2 size={18} />
              Supprimer
            </button>
          </div>
        </div>

        <AnimalTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-xl">
          {activeTab === "general" && (
            <GeneralTab animal={animal} updateField={updateField} />
          )}

          {activeTab === "photos" && (
            <PhotosTab animalId={id} photos={photos} setPhotos={setPhotos} />
          )}

          {activeTab === "health" && (
            <HealthTab animal={animal} updateField={updateField} />
          )}

          {activeTab === "character" && (
            <CharacterTab animal={animal} updateField={updateField} />
          )}

          {activeTab === "story" && (
            <StoryTab animal={animal} updateField={updateField} />
          )}

          {activeTab === "location" && (
            <LocationTab animal={animal} updateField={updateField} />
          )}

          {activeTab === "adoption" && (
            <AdoptionTab animal={animal} updateField={updateField} />
          )}

          {activeTab === "preview" && (
            <PreviewTab animal={animal} photos={photos} />
          )}
        </div>
      </section>
    </main>
  );
}