"use client";

import { useState } from "react";
import { Star, Trash2, Upload } from "lucide-react";
import { photoService } from "../../../services/photo.service";

type Props = {
  animalId: string;
  photos: any[];
  setPhotos: (photos: any[]) => void;
};

export default function PhotosTab({ animalId, photos, setPhotos }: Props) {
  const [uploading, setUploading] = useState(false);

  async function addPhotos(files: FileList | null) {
    if (!files) return;

    try {
      setUploading(true);

      const uploaded = await photoService.uploadMany(
        Array.from(files),
        animalId
      );

      setPhotos([...photos, ...uploaded]);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors de l’upload des photos.");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(photoId: string) {
    if (!confirm("Supprimer cette photo ?")) return;

    try {
      await photoService.delete(photoId);
      setPhotos(photos.filter((photo) => photo.id !== photoId));
    } catch (error: any) {
      alert(error.message || "Impossible de supprimer la photo.");
    }
  }

  async function setCover(photoId: string) {
    try {
      await photoService.setCover(photoId, animalId);

      setPhotos(
        photos.map((photo) => ({
          ...photo,
          is_cover: photo.id === photoId,
        }))
      );
    } catch (error: any) {
      alert(error.message || "Impossible de modifier la photo principale.");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-[#064b42]">Photos</h2>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#064b42] bg-[#f8f4ec] p-10 text-center transition hover:bg-[#efe5d4]">
        <Upload size={48} className="text-[#064b42]" />

        <p className="mt-3 text-xl font-black">
          {uploading ? "Upload en cours..." : "Ajouter des photos"}
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => addPhotos(e.target.files)}
          className="hidden"
        />
      </label>

      {photos.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          Aucune photo pour le moment.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-3xl bg-white shadow"
            >
              <div className="relative">
                <img
                  src={photo.photo_url}
                  alt=""
                  className="h-64 w-full object-cover"
                />

                {photo.is_cover && (
                  <div className="absolute left-3 top-3 rounded-full bg-yellow-400 p-2 shadow">
                    <Star size={20} fill="white" className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex gap-2 p-4">
                {!photo.is_cover && (
                  <button
                    type="button"
                    onClick={() => setCover(photo.id)}
                    className="flex-1 rounded-xl bg-[#064b42] py-3 font-black text-white"
                  >
                    Principale
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="rounded-xl bg-red-100 p-3 text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}