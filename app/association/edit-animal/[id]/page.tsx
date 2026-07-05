"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { animalService } from "../../../services/animal.service";
import { photoService } from "../../../services/photo.service";
import { videoService } from "../../../services/video.service";
import PhotoGalleryEditor from "../../../components/animal/PhotoGalleryEditor";
import VideoGalleryEditor from "../../../components/animal/VideoGalleryEditor";

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [animal, setAnimal] = useState<any>({});
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const animalData = await animalService.getById(id);
      const photosData = await photoService.getByAnimal(id);
      const videosData = await videoService.getByAnimal(id);

      setAnimal({
        ...animalData,
        weight_kg: animalData.weight_kg || "",
      });

      setPhotos(photosData);
      setVideos(videosData);
    } catch (error: any) {
      alert(error.message);
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

  async function saveChanges() {
    try {
      setSaving(true);

      await animalService.update(id, {
        ...animal,
        weight_kg: animal.weight_kg ? Number(animal.weight_kg) : null,
      });

      for (const photo of newPhotos) {
        await photoService.upload(photo, id);
      }

      for (const video of newVideos) {
        await videoService.upload(video, id);
      }

      router.push("/association/animals");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function setCover(photoId: string) {
    try {
      await photoService.setCover(photoId, id);
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function deletePhoto(photoId: string) {
    const ok = window.confirm("Supprimer cette photo ?");
    if (!ok) return;

    try {
      await photoService.delete(photoId);
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function deleteVideo(videoId: string) {
    const ok = window.confirm("Supprimer cette vidéo ?");
    if (!ok) return;

    try {
      await videoService.delete(videoId);
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbf7ef] flex items-center justify-center font-black text-[#064b42]">
        Chargement...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-5xl font-black">Modifier l’animal</h1>

        <p className="mt-2 text-gray-500">
          Modifiez les informations, les photos et les vidéos de la fiche.
        </p>

        <Card className="mt-8 space-y-10">
          <section>
            <h2 className="mb-5 text-3xl font-black">Informations générales</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <input
                className="input"
                placeholder="Nom"
                value={animal.animal_name || ""}
                onChange={(e) => updateField("animal_name", e.target.value)}
              />

              <input
                className="input"
                placeholder="Espèce"
                value={animal.animal_type || ""}
                onChange={(e) => updateField("animal_type", e.target.value)}
              />

              <input
                className="input"
                placeholder="Race"
                value={animal.breed || ""}
                onChange={(e) => updateField("breed", e.target.value)}
              />

              <input
                className="input"
                placeholder="Sexe"
                value={animal.sex || ""}
                onChange={(e) => updateField("sex", e.target.value)}
              />

              <input
                className="input"
                placeholder="Âge estimé"
                value={animal.age_label || ""}
                onChange={(e) => updateField("age_label", e.target.value)}
              />

              <input
                className="input"
                placeholder="Taille"
                value={animal.size_label || ""}
                onChange={(e) => updateField("size_label", e.target.value)}
              />

              <input
                className="input"
                placeholder="Poids kg"
                value={animal.weight_kg || ""}
                onChange={(e) => updateField("weight_kg", e.target.value)}
              />

              <input
                className="input"
                placeholder="Santé"
                value={animal.health_status || ""}
                onChange={(e) => updateField("health_status", e.target.value)}
              />

              <input
                className="input"
                placeholder="Île"
                value={animal.island || ""}
                onChange={(e) => updateField("island", e.target.value)}
              />

              <input
                className="input"
                placeholder="Commune"
                value={animal.city || ""}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-3xl font-black">Santé</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="box">
                <input
                  type="checkbox"
                  checked={animal.vaccinated || false}
                  onChange={(e) => updateField("vaccinated", e.target.checked)}
                />
                Vacciné
              </label>

              <label className="box">
                <input
                  type="checkbox"
                  checked={animal.sterilized || false}
                  onChange={(e) => updateField("sterilized", e.target.checked)}
                />
                Stérilisé
              </label>

              <label className="box">
                <input
                  type="checkbox"
                  checked={animal.microchipped || false}
                  onChange={(e) =>
                    updateField("microchipped", e.target.checked)
                  }
                />
                Identifié
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-3xl font-black">Caractère</h2>

            <textarea
              className="min-h-40 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
              placeholder="Caractère de l'animal"
              value={animal.description_character || ""}
              onChange={(e) =>
                updateField("description_character", e.target.value)
              }
            />
          </section>

          <section>
            <h2 className="mb-5 text-3xl font-black">Histoire</h2>

            <textarea
              className="min-h-40 w-full rounded-2xl border bg-white p-5 text-lg outline-none"
              placeholder="Histoire de l'animal"
              value={animal.story || ""}
              onChange={(e) => updateField("story", e.target.value)}
            />
          </section>

          <section>
            <h2 className="mb-5 text-3xl font-black">Photos existantes</h2>

            <PhotoGalleryEditor
              photos={photos}
              onSetCover={setCover}
              onDelete={deletePhoto}
            />

            <h3 className="mb-3 mt-8 text-2xl font-black">
              Ajouter des photos
            </h3>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewPhotos(Array.from(e.target.files || []))}
              className="w-full rounded-2xl bg-white p-5"
            />

            {newPhotos.length > 0 && (
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {newPhotos.map((file, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl bg-gray-100"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      className="h-52 w-full object-cover"
                      alt="Nouvelle photo"
                    />

                    <p className="p-3 text-center text-sm font-black">
                      Nouvelle photo
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-5 text-3xl font-black">Vidéos existantes</h2>

            <VideoGalleryEditor videos={videos} onDelete={deleteVideo} />

            <h3 className="mb-3 mt-8 text-2xl font-black">
              Ajouter des vidéos
            </h3>

            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => setNewVideos(Array.from(e.target.files || []))}
              className="w-full rounded-2xl bg-white p-5"
            />

            {newVideos.length > 0 && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {newVideos.map((file, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl bg-gray-100"
                  >
                    <video
                      src={URL.createObjectURL(file)}
                      controls
                      className="h-64 w-full object-cover"
                    />

                    <p className="p-3 text-center text-sm font-black">
                      Nouvelle vidéo
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-between pt-6">
            <Button
              variant="secondary"
              onClick={() => router.push("/association/animals")}
            >
              Annuler
            </Button>

            <Button onClick={saveChanges}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}