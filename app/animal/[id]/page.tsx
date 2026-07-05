"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MapPin,
  ShieldCheck,
  PawPrint,
  Share2,
} from "lucide-react";

import Button from "../../components/ui/Button";
import { animalService } from "../../services/animal.service";
import { photoService } from "../../services/photo.service";
import { videoService } from "../../services/video.service";

export default function AnimalPublicPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [animal, setAnimal] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnimal();
  }, []);

  async function loadAnimal() {
    try {
      const animalData = await animalService.getById(id);
      const photosData = await photoService.getByAnimal(id);
      const videosData = await videoService.getByAnimal(id);

      const cover =
        photosData.find((photo: any) => photo.is_cover)?.photo_url ||
        photosData[0]?.photo_url ||
        "https://placehold.co/900x700?text=TAUI+TE+ORA";

      setAnimal(animalData);
      setPhotos(photosData);
      setVideos(videosData);
      setSelectedPhoto(cover);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function shareAnimal() {
    const url = window.location.href;
    const title = `${animal.animal_name} cherche une famille`;

    if (navigator.share) {
      await navigator.share({
        title,
        text: `Découvre ${animal.animal_name} sur TAUI TE ORA.`,
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    alert("Lien copié !");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] font-black text-[#064b42]">
        Chargement...
      </main>
    );
  }

  if (!animal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] font-black text-[#064b42]">
        Animal introuvable.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] p-8 text-[#064b42]">
      <section className="mx-auto max-w-7xl">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 font-black"
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="overflow-hidden rounded-[42px] bg-white shadow-2xl">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="overflow-hidden rounded-[32px] bg-gray-100">
              <img
                src={selectedPhoto}
                alt={animal.animal_name}
                className="h-[620px] w-full object-cover"
              />
            </div>

            <div className="grid gap-4">
              {photos.slice(0, 4).map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo.photo_url)}
                  className={`overflow-hidden rounded-2xl border-4 ${
                    selectedPhoto === photo.photo_url
                      ? "border-[#064b42]"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt="Photo animal"
                    className="h-36 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div>
                <h1 className="text-6xl font-black">{animal.animal_name}</h1>

                <p className="mt-3 text-2xl text-gray-600">
                  {animal.sex || "Sexe inconnu"} •{" "}
                  {animal.age_label || "Âge inconnu"} •{" "}
                  {animal.size_label || "Taille inconnue"}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={shareAnimal}>
                  <Share2 size={22} />
                  <span className="ml-2">Partager</span>
                </Button>

                <Button>
                  <Heart size={22} />
                  <span className="ml-2">Coup de cœur</span>
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-[#f8f4ec] p-5 font-bold">
                <MapPin className="mb-2" />
                {animal.island || "Île non renseignée"}
              </div>

              <div className="rounded-2xl bg-[#f8f4ec] p-5 font-bold">
                <ShieldCheck className="mb-2" />
                {animal.health_status || "Santé non renseignée"}
              </div>

              <div className="rounded-2xl bg-[#f8f4ec] p-5 font-bold">
                <PawPrint className="mb-2" />
                {animal.breed || animal.animal_type || "Animal"}
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-3xl font-black">Caractère</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                {animal.description_character ||
                  "Aucune description renseignée."}
              </p>
            </div>

            <div className="mt-10">
              <h2 className="text-3xl font-black">Son histoire</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                {animal.story || "Aucune histoire renseignée."}
              </p>
            </div>

            {photos.length > 4 && (
              <div className="mt-10">
                <h2 className="mb-5 text-3xl font-black">Toutes les photos</h2>

                <div className="grid gap-4 md:grid-cols-4">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.photo_url)}
                      className="overflow-hidden rounded-2xl"
                    >
                      <img
                        src={photo.photo_url}
                        alt="Photo animal"
                        className="h-56 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-5 text-3xl font-black">Vidéos</h2>

                <div className="grid gap-4 md:grid-cols-2">
                  {videos.map((video) => (
                    <video
                      key={video.id}
                      src={video.video_url}
                      controls
                      className="h-80 w-full rounded-2xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}