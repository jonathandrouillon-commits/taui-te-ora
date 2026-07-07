"use client";

import { useState } from "react";

type AnimalGalleryProps = {
  mainPhoto?: string | null;
  name?: string | null;
};

export default function AnimalGallery({
  mainPhoto,
  name,
}: AnimalGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-3xl bg-white shadow">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative flex h-[420px] w-full items-center justify-center bg-[#d9c7a3]"
        >
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={name || "Animal"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-black text-[#064b42]">
              Photo de l’animal
            </span>
          )}

          <span className="absolute bottom-4 right-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#064b42] shadow">
            Voir la photo
          </span>
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

          {mainPhoto ? (
            <img
              src={mainPhoto}
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