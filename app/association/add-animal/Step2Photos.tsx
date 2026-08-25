"use client";

import { ImagePlus, Star, Trash2, Video, X } from "lucide-react";

type Props = {
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  video: File | null;
  setVideo: React.Dispatch<React.SetStateAction<File | null>>;
};

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export default function Step2Photos({
  photos,
  setPhotos,
  video,
  setVideo,
}: Props) {
  function addPhotos(files: FileList | null) {
    if (!files) return;

    const selected = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    setPhotos((prev) => [...prev, ...selected]);
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

  function selectVideo(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Merci de sélectionner un fichier vidéo.");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      alert("La vidéo ne doit pas dépasser 100 Mo.");
      return;
    }

    setVideo(file);
  }

  function formatFileSize(size: number) {
    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} Ko`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  return (
    <div className="space-y-10">
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-[#064b42]">
            Photos de l&apos;animal
          </h2>

          <p className="mt-2 text-gray-500">
            Ajoutez plusieurs photos. La première sera utilisée comme photo principale.
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
            ★ = Photo principale
          </p>
        </div>

        {photos.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo, index) => {
              const preview = URL.createObjectURL(photo);

              return (
                <div
                  key={`${photo.name}-${photo.lastModified}-${index}`}
                  className="overflow-hidden rounded-3xl bg-white shadow-lg"
                >
                  <div className="relative">
                    <img
                      src={preview}
                      alt={photo.name}
                      className="h-72 w-full object-cover"
                      onLoad={() => URL.revokeObjectURL(preview)}
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
                        aria-label="Supprimer la photo"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <p className="text-lg font-bold text-gray-500">
              Aucune photo sélectionnée.
            </p>
          </div>
        )}
      </section>

      <section className="border-t border-[#eadfce] pt-10">
        <div className="flex items-center gap-3">
          <Video size={30} className="text-[#064b42]" />

          <h2 className="text-3xl font-black text-[#064b42]">
            Vidéo de l&apos;animal
          </h2>
        </div>

        <p className="mt-2 text-gray-500">
          Ajoutez une courte vidéo pour montrer son caractère, sa démarche ou son comportement.
        </p>

        {!video ? (
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#df8995] bg-[#fff7f8] p-10 transition hover:bg-[#fdebed]">
            <Video size={54} className="text-[#df8995]" />

            <p className="mt-4 text-xl font-black text-[#064b42]">
              Ajouter une vidéo
            </p>

            <p className="mt-2 text-center text-sm text-gray-500">
              MP4 • MOV • WEBM
            </p>

            <p className="mt-1 text-center text-xs text-gray-400">
              100 Mo maximum
            </p>

            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              className="hidden"
              onChange={(e) => selectVideo(e.target.files?.[0] || null)}
            />
          </label>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-lg">
            <video
              src={URL.createObjectURL(video)}
              controls
              preload="metadata"
              className="max-h-[440px] w-full bg-black object-contain"
            />

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p
                  className="truncate font-black text-[#064b42]"
                  title={video.name}
                >
                  {video.name}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {formatFileSize(video.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setVideo(null)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-100 px-5 py-3 font-black text-red-600"
              >
                <X size={18} />
                Retirer la vidéo
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl bg-[#f8f4ec] p-4 text-sm leading-6 text-gray-600">
          Une seule vidéo est ajoutée à la création de la fiche.
        </div>
      </section>
    </div>
  );
}