"use client";

import { Trash2 } from "lucide-react";

type Props = {
  videos: any[];
  onDelete: (videoId: string) => void;
};

export default function VideoGalleryEditor({ videos, onDelete }: Props) {
  if (!videos || videos.length === 0) {
    return (
      <div className="rounded-2xl bg-[#f8f4ec] p-8 text-center font-bold text-gray-500">
        Aucune vidéo pour le moment.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {videos.map((video) => (
        <div
          key={video.id}
          className="overflow-hidden rounded-2xl bg-[#f8f4ec] shadow"
        >
          <video
            src={video.video_url}
            controls
            className="h-72 w-full object-cover"
          />

          <div className="p-4">
            <button
              onClick={() => onDelete(video.id)}
              className="rounded-xl bg-red-100 px-4 py-2 font-black text-red-600"
            >
              <Trash2 size={18} className="mr-2 inline" />
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}