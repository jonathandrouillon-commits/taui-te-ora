"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Star,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

import {
  photoService,
} from "../../../services/photo.service";

import {
  videoService,
} from "../../../services/video.service";

type Props = {
  animalId: string;
  photos: any[];
  setPhotos: (
    photos: any[]
  ) => void;
};

type AnimalVideo = {
  id: string;
  animal_id: string;
  video_url: string;
  sort_order: number;
  created_at?: string;
};

const MAX_VIDEO_SIZE =
  100 * 1024 * 1024;

export default function PhotosTab({
  animalId,
  photos,
  setPhotos,
}: Props) {
  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    video,
    setVideo,
  ] =
    useState<AnimalVideo | null>(
      null
    );

  const [
    loadingVideo,
    setLoadingVideo,
  ] =
    useState(true);

  const [
    uploadingVideo,
    setUploadingVideo,
  ] =
    useState(false);

  const [
    deletingVideo,
    setDeletingVideo,
  ] =
    useState(false);

  /* =========================================================
     CHARGEMENT VIDEO
  ========================================================= */

  useEffect(() => {
    void loadVideo();
  }, [animalId]);

  async function loadVideo() {
    try {
      setLoadingVideo(
        true
      );

      const videos =
        await videoService.getByAnimal(
          animalId
        );

      setVideo(
        videos.length > 0
          ? (videos[0] as AnimalVideo)
          : null
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur chargement vidéo :",
        error
      );
    } finally {
      setLoadingVideo(
        false
      );
    }
  }

  /* =========================================================
     PHOTOS
  ========================================================= */

  async function addPhotos(
    files: FileList | null
  ) {
    if (!files) {
      return;
    }

    try {
      setUploading(
        true
      );

      const uploaded =
        await photoService.uploadMany(
          Array.from(
            files
          ),
          animalId
        );

      setPhotos([
        ...photos,
        ...uploaded,
      ]);
    } catch (
      error: any
    ) {
      console.error(
        error
      );

      alert(
        error?.message ||
          "Erreur lors de l’upload des photos."
      );
    } finally {
      setUploading(
        false
      );
    }
  }

  async function removePhoto(
    photoId: string
  ) {
    const confirmed =
      window.confirm(
        "Supprimer cette photo ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await photoService.delete(
        photoId
      );

      setPhotos(
        photos.filter(
          (
            photo
          ) =>
            photo.id !==
            photoId
        )
      );
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible de supprimer la photo."
      );
    }
  }

  async function setCover(
    photoId: string
  ) {
    try {
      await photoService.setCover(
        photoId,
        animalId
      );

      setPhotos(
        photos.map(
          (
            photo
          ) => ({
            ...photo,

            is_cover:
              photo.id ===
              photoId,
          })
        )
      );
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible de modifier la photo principale."
      );
    }
  }

  /* =========================================================
     VIDEO
  ========================================================= */

  async function addVideo(
    file: File | null
  ) {
    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "video/"
      )
    ) {
      alert(
        "Merci de sélectionner un fichier vidéo."
      );

      return;
    }

    if (
      file.size >
      MAX_VIDEO_SIZE
    ) {
      alert(
        "La vidéo ne doit pas dépasser 100 Mo."
      );

      return;
    }

    try {
      setUploadingVideo(
        true
      );

      /*
       * Une seule vidéo par animal.
       * Si une vidéo existe déjà,
       * on supprime son enregistrement
       * avant d'ajouter la nouvelle.
       */

      if (video?.id) {
        await videoService.delete(
          video.id
        );
      }

      await videoService.upload(
        file,
        animalId
      );

      await loadVideo();

      alert(
        video
          ? "Vidéo remplacée avec succès."
          : "Vidéo ajoutée avec succès."
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur upload vidéo :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'ajouter la vidéo."
      );
    } finally {
      setUploadingVideo(
        false
      );
    }
  }

  async function removeVideo() {
    if (!video?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        "Supprimer la vidéo de cet animal ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingVideo(
        true
      );

      await videoService.delete(
        video.id
      );

      setVideo(
        null
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur suppression vidéo :",
        error
      );

      alert(
        error?.message ||
          "Impossible de supprimer la vidéo."
      );
    } finally {
      setDeletingVideo(
        false
      );
    }
  }

  function formatFileSize(
    size: number
  ) {
    if (
      size <
      1024 * 1024
    ) {
      return `${Math.round(
        size / 1024
      )} Ko`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} Mo`;
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-10">

      {/* =====================================================
          PHOTOS
      ====================================================== */}

      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-[#064b42]">
            Photos
          </h2>

          <p className="mt-2 text-gray-500">
            Ajoutez plusieurs photos et choisissez la photo principale.
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#064b42] bg-[#f8f4ec] p-10 text-center transition hover:bg-[#efe5d4]">
          <Upload
            size={48}
            className="text-[#064b42]"
          />

          <p className="mt-3 text-xl font-black">
            {uploading
              ? "Upload en cours..."
              : "Ajouter des photos"}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            JPG • PNG • WEBP
          </p>

          <input
            type="file"
            accept="image/*"
            multiple
            disabled={
              uploading
            }
            onChange={(
              event
            ) =>
              addPhotos(
                event.target
                  .files
              )
            }
            className="hidden"
          />
        </label>

        {photos.length ===
        0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow">
            Aucune photo pour le moment.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map(
              (
                photo
              ) => (
                <div
                  key={
                    photo.id
                  }
                  className="overflow-hidden rounded-3xl bg-white shadow"
                >
                  <div className="relative">
                    <img
                      src={
                        photo.photo_url
                      }
                      alt="Animal"
                      className="h-64 w-full object-cover"
                    />

                    {photo.is_cover && (
                      <div className="absolute left-3 top-3 rounded-full bg-yellow-400 p-2 shadow">
                        <Star
                          size={
                            20
                          }
                          fill="white"
                          className="text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 p-4">
                    {!photo.is_cover && (
                      <button
                        type="button"
                        onClick={() =>
                          setCover(
                            photo.id
                          )
                        }
                        className="flex-1 rounded-xl bg-[#064b42] py-3 font-black text-white"
                      >
                        Principale
                      </button>
                    )}

                    {photo.is_cover && (
                      <div className="flex-1 rounded-xl bg-[#064b42] py-3 text-center font-black text-white">
                        Principale
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removePhoto(
                          photo.id
                        )
                      }
                      className="rounded-xl bg-red-100 p-3 text-red-600"
                      aria-label="Supprimer la photo"
                    >
                      <Trash2
                        size={
                          20
                        }
                      />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          VIDEO
      ====================================================== */}

      <section className="border-t border-[#eadfce] pt-10">
        <div className="flex items-center gap-3">
          <Video
            size={30}
            className="text-[#064b42]"
          />

          <h2 className="text-3xl font-black text-[#064b42]">
            Vidéo
          </h2>
        </div>

        <p className="mt-2 text-gray-500">
          Ajoutez une courte vidéo pour montrer le caractère,
          la démarche ou le comportement de l&apos;animal.
        </p>

        {loadingVideo ? (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow">
            Chargement de la vidéo...
          </div>
        ) : video ? (
          <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-lg">
            <video
              src={
                video.video_url
              }
              controls
              preload="metadata"
              className="max-h-[520px] w-full bg-black object-contain"
            />

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-[#064b42]">
                  Vidéo actuelle
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Une seule vidéo peut être associée à cet animal.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="cursor-pointer rounded-2xl bg-[#064b42] px-5 py-3 text-center font-black text-white">
                  {uploadingVideo
                    ? "Remplacement..."
                    : "Remplacer"}

                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/*"
                    disabled={
                      uploadingVideo ||
                      deletingVideo
                    }
                    onChange={(
                      event
                    ) =>
                      addVideo(
                        event
                          .target
                          .files?.[0] ||
                          null
                      )
                    }
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  disabled={
                    uploadingVideo ||
                    deletingVideo
                  }
                  onClick={
                    removeVideo
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-100 px-5 py-3 font-black text-red-600 disabled:opacity-50"
                >
                  <Trash2
                    size={
                      18
                    }
                  />

                  {deletingVideo
                    ? "Suppression..."
                    : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#df8995] bg-[#fff7f8] p-10 text-center transition hover:bg-[#fdebed]">
            <Video
              size={54}
              className="text-[#df8995]"
            />

            <p className="mt-4 text-xl font-black text-[#064b42]">
              {uploadingVideo
                ? "Upload en cours..."
                : "Ajouter une vidéo"}
            </p>

            <p className="mt-2 text-gray-500">
              MP4 • MOV • WEBM
            </p>

            <p className="mt-1 text-sm text-gray-400">
              100 Mo maximum
            </p>

            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              disabled={
                uploadingVideo
              }
              onChange={(
                event
              ) =>
                addVideo(
                  event.target
                    .files?.[0] ||
                    null
                )
              }
              className="hidden"
            />
          </label>
        )}
      </section>
    </div>
  );
}