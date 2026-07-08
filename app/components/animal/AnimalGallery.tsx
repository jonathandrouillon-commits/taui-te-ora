"use client";

import { useState } from "react";

type AnimalPhoto = {
  id?: string;
  photo_url: string;
  is_cover?: boolean | null;
  sort_order?: number | null;
};

type AnimalGalleryProps = {
  photos?: AnimalPhoto[];
  name?: string | null;
};

export default function AnimalGallery({ photos = [], name }: AnimalGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPhoto = photos[currentIndex]?.photo_url || null;

  function nextPhoto() {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }

  function previousPhoto() {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl bg-white shadow">
        <button
          type="button"
          onClick={nextPhoto}
          className="relative flex h-[420px] w-full items-center justify-center bg-[#d9c7a3]"
        >
          {currentPhoto ? (
            <img
              src={currentPhoto}
              alt={name || "Animal"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-black text-[#064b42]">
              Photo de l’animal
            </span>
          )}

          {photos.length > 1 && (
            <span className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs font-black text-white">
              {currentIndex + 1}/{photos.length}
            </span>
          )}

          <span className="absolute bottom-4 right-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#064b42] shadow">
            Cliquer pour changer
          </span>
        </button>

        {photos.length > 1 && (
          <div className="grid grid-cols-5 gap-2 p-3">
            {photos.map((photo, index) => (
              <button
                key={photo.id || index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-20 overflow-hidden rounded-xl border-4 ${
                  index === currentIndex
                    ? "border-[#064b42]"
                    : "border-transparent"
                }`}
              >
                <img
                  src={photo.photo_url}
                  alt={`${name || "Animal"} ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={previousPhoto}
          disabled={photos.length <= 1}
          className="flex-1 rounded-xl bg-white px-4 py-3 font-black text-[#064b42] shadow disabled:opacity-40"
        >
          ← Photo précédente
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={!currentPhoto}
          className="flex-1 rounded-xl bg-[#064b42] px-4 py-3 font-black text-white shadow disabled:opacity-40"
        >
          Agrandir
        </button>

        <button
          type="button"
          onClick={nextPhoto}
          disabled={photos.length <= 1}
          className="flex-1 rounded-xl bg-white px-4 py-3 font-black text-[#064b42] shadow disabled:opacity-40"
        >
          Photo suivante →
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 font-bold text-[#064b42]"
          >
            Fermer
          </button>

          {currentPhoto ? (
            <img
              src={currentPhoto}
              alt={name || "Animal"}
              className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            />
          ) : (
            <p className="text-xl font-bold text-white">
              Aucune photo disponible
            </p>
          )}
        </div>
      )}
    </>
  );
}