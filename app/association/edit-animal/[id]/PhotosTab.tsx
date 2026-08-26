"use client";

import {
  useRef,
  useState,
} from "react";

import {
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";

import {
  photoService,
  type AnimalPhoto,
} from "../../../services/photo.service";

type PhotosTabProps = {
  animalId: string;

  photos: AnimalPhoto[];

  setPhotos: React.Dispatch<
    React.SetStateAction<AnimalPhoto[]>
  >;
};

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message =
      (
        error as {
          message?: unknown;
        }
      ).message;

    if (
      typeof message === "string"
    ) {
      return message;
    }
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  return "";
}

export default function PhotosTab({
  animalId,
  photos,
  setPhotos,
}: PhotosTabProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    coverLoadingId,
    setCoverLoadingId,
  ] =
    useState<string | null>(
      null
    );

  async function refreshPhotos() {
    try {
      const refreshedPhotos =
        await photoService.getByAnimalId(
          animalId
        );

      setPhotos(
        refreshedPhotos ?? []
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur actualisation photos :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible d’actualiser les photos."
      );
    }
  }

  async function handleFiles(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files ?? []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    try {
      setUploading(true);

      for (
        const file
        of files
      ) {
        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          throw new Error(
            `Le fichier "${file.name}" n’est pas une image valide.`
          );
        }

        if (
          file.size >
          8 *
            1024 *
            1024
        ) {
          throw new Error(
            `Le fichier "${file.name}" dépasse 8 Mo.`
          );
        }

        await photoService.upload(
          file,
          animalId
        );
      }

      await refreshPhotos();
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur upload photos :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Erreur lors de l’upload des photos."
      );
    } finally {
      setUploading(false);

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    }
  }

  async function handleDelete(
    photoId: string
  ) {
    const confirmed =
      window.confirm(
        "Supprimer cette photo ?"
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setDeletingId(
        photoId
      );

      await photoService.delete(
        photoId
      );

      setPhotos(
        (
          currentPhotos
        ) =>
          currentPhotos.filter(
            (
              photo
            ) =>
              photo.id !==
              photoId
          )
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur suppression photo :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Erreur lors de la suppression de la photo."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  async function handleSetCover(
    photoId: string
  ) {
    try {
      setCoverLoadingId(
        photoId
      );

      await photoService.setCover(
        photoId,
        animalId
      );

      setPhotos(
        (
          currentPhotos
        ) =>
          currentPhotos.map(
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
      error: unknown
    ) {
      console.error(
        "Erreur photo principale :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Erreur lors de la modification de la photo principale."
      );
    } finally {
      setCoverLoadingId(
        null
      );
    }
  }

  const sortedPhotos =
    [...photos].sort(
      (
        photoA,
        photoB
      ) => {
        if (
          photoA.is_cover &&
          !photoB.is_cover
        ) {
          return -1;
        }

        if (
          !photoA.is_cover &&
          photoB.is_cover
        ) {
          return 1;
        }

        return (
          Number(
            photoA.sort_order ??
              0
          ) -
          Number(
            photoB.sort_order ??
              0
          )
        );
      }
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#064b42]">
          Photos
        </h2>

        <p className="mt-1 text-sm text-[#746c64]">
          Ajoutez plusieurs photos de
          l&apos;animal et choisissez sa
          photo principale.
        </p>
      </div>

      <div className="rounded-[24px] border border-dashed border-[#cfc4b5] bg-[#fffaf7] p-6">
        <input
          ref={
            inputRef
          }
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={
            handleFiles
          }
        />

        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={
            uploading
          }
          className="flex w-full items-center justify-center gap-3 rounded-[20px] bg-[#064b42] px-6 py-4 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2
                size={
                  20
                }
                className="animate-spin"
              />

              Upload en cours...
            </>
          ) : (
            <>
              <ImagePlus
                size={
                  20
                }
              />

              Ajouter des photos
            </>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-[#746c64]">
          JPG, PNG, WEBP — 8 Mo
          maximum par photo
        </p>
      </div>

      {sortedPhotos.length ===
      0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-sm">
          <ImagePlus
            size={
              36
            }
            className="mx-auto text-[#b6aca3]"
          />

          <p className="mt-3 font-bold text-[#746c64]">
            Aucune photo pour le
            moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPhotos.map(
            (
              photo
            ) => {
              const deleting =
                deletingId ===
                photo.id;

              const coverLoading =
                coverLoadingId ===
                photo.id;

              return (
                <div
                  key={
                    photo.id
                  }
                  className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={
                        photo.photo_url
                      }
                      alt="Photo de l’animal"
                      className="h-full w-full object-cover"
                    />

                    {photo.is_cover && (
                      <div className="absolute left-3 top-3 rounded-full bg-[#064b42] px-3 py-1.5 text-xs font-black text-white shadow">
                        Photo principale
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    {!photo.is_cover && (
                      <button
                        type="button"
                        disabled={
                          coverLoading
                        }
                        onClick={() =>
                          handleSetCover(
                            photo.id
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#064b42] px-4 py-3 font-black text-[#064b42] transition hover:bg-[#064b42] hover:text-white disabled:opacity-60"
                      >
                        {coverLoading && (
                          <Loader2
                            size={
                              18
                            }
                            className="animate-spin"
                          />
                        )}

                        Définir comme
                        principale
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={
                        deleting
                      }
                      onClick={() =>
                        handleDelete(
                          photo.id
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fff1f2] px-4 py-3 font-black text-[#b42336] transition hover:bg-[#b42336] hover:text-white disabled:opacity-60"
                    >
                      {deleting ? (
                        <Loader2
                          size={
                            18
                          }
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={
                            18
                          }
                        />
                      )}

                      Supprimer
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}