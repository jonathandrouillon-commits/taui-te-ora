"use client";

import { Star, Trash2 } from "lucide-react";

type Props = {
  photos: any[];
  onSetCover: (photoId: string) => void;
  onDelete: (photoId: string) => void;
};

export default function PhotoGalleryEditor({
  photos,
  onSetCover,
  onDelete,
}: Props) {
  if (!photos || photos.length === 0) {
    return (
      <div className="rounded-2xl bg-[#f8f4ec] p-8 text-center text-gray-500 font-bold">
        Aucune photo pour le moment.
      </div>
    );
  }

  const cover = photos.find((photo) => photo.is_cover) || photos[0];
  const others = photos.filter((photo) => photo.id !== cover.id);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] bg-[#f8f4ec] shadow">
        <img
          src={cover.photo_url}
          alt="Photo principale"
          className="h-[460px] w-full object-cover"
        />

        <div className="flex items-center justify-between p-4">
          <span className="rounded-full bg-[#064b42] px-4 py-2 text-sm font-black text-white">
            Photo principale
          </span>

          <button
            onClick={() => onDelete(cover.id)}
            className="rounded-xl bg-red-100 px-4 py-2 font-black text-red-600"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {others.length > 0 && (
        <div className="grid gap-5 md:grid-cols-3">
          {others.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-2xl bg-[#f8f4ec] shadow"
            >
              <img
                src={photo.photo_url}
                alt="Photo animal"
                className="h-56 w-full object-cover"
              />

              <div className="flex justify-between gap-2 p-4">
                <button
                  onClick={() => onSetCover(photo.id)}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#064b42]"
                >
                  <Star size={16} className="mr-1 inline" />
                  Définir
                </button>

                <button
                  onClick={() => onDelete(photo.id)}
                  className="rounded-xl bg-red-100 px-3 py-2 text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}