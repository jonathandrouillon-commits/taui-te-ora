"use client";

import { ImagePlus, Star, Trash2 } from "lucide-react";

type Props = {
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
};

export default function Step2Photos({ photos, setPhotos }: Props) {
  function addPhotos(files: FileList | null) {
    if (!files) return;

    setPhotos((prev) => [...prev, ...Array.from(files)]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    setPhotos((prev) => {
      const copy = [...prev];
      const cover = copy.splice(index, 1)[0];
      copy.unshift(cover);
      return copy;
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-[#064b42]">
          Photos de l'animal
        </h2>

        <p className="mt-2 text-gray-500">
          Ajoutez plusieurs photos. La première sera utilisée comme photo
          principale.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#064b42] bg-[#f8f4ec] p-12 transition hover:bg-[#efe5d4]">
        <ImagePlus size={60} className="text-[#064b42]" />

        <p className="mt-4 text-xl font-black">
          Ajouter des photos
        </p>

        <p className="mt-2 text-center text-gray-500">
          JPG • PNG • WEBP
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addPhotos(e.target.files)}
        />
      </label>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black">
          {photos.length} photo{photos.length > 1 && "s"}
        </h3>

        <p className="text-sm text-gray-500">
          ⭐ = Photo principale
        </p>
      </div>

      {photos.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-3xl bg-white shadow-lg"
            >
              <div className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt=""
                  className="h-72 w-full object-cover"
                />

                {index === 0 && (
                  <div className="absolute left-3 top-3 rounded-full bg-yellow-400 p-2 shadow">
                    <Star
                      size={20}
                      fill="white"
                      className="text-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <p
                  className="truncate text-sm font-bold"
                  title={photo.name}
                >
                  {photo.name}
                </p>

                <div className="flex gap-2">
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeCover(index)}
                      className="flex-1 rounded-xl bg-[#064b42] py-3 font-black text-white"
                    >
                      Définir principale
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="rounded-xl bg-red-100 p-3 text-red-600"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="rounded-3xl bg-white p-10 text-center shadow">
          <p className="text-lg font-bold text-gray-500">
            Aucune photo sélectionnée.
          </p>
        </div>
      )}
    </div>
  );
}