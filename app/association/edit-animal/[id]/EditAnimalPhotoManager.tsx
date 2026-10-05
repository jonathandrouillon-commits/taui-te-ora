"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Cropper, {
  type Area,
} from "react-easy-crop";

import {
  Camera,
  Check,
  Crop,
  ImagePlus,
  Loader2,
  RotateCcw,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  photoService,
  type AnimalPhoto,
} from "../../../services/photo.service";

import {
  cropImageFile,
} from "../../../lib/cropImage";

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
      "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (
      typeof message ===
      "string"
    ) {
      return message;
    }
  }

  return "";
}

type EditAnimalPhotoManagerProps = {
  animalId: string;
};

export default function EditAnimalPhotoManager({
  animalId,
}: EditAnimalPhotoManagerProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    photos,
    setPhotos,
  ] = useState<AnimalPhoto[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  const [
    coverLoadingId,
    setCoverLoadingId,
  ] = useState<
    string | null
  >(null);

  const [
    cropSaving,
    setCropSaving,
  ] = useState(false);

  const [
    cropFile,
    setCropFile,
  ] = useState<
    File | null
  >(null);

  const [
    cropPhoto,
    setCropPhoto,
  ] = useState<
    AnimalPhoto | null
  >(null);

  const [
    cropImageUrl,
    setCropImageUrl,
  ] = useState("");

  const [
    crop,
    setCrop,
  ] = useState({
    x: 0,
    y: 0,
  });

  const [
    zoom,
    setZoom,
  ] = useState(1);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState<
    Area | null
  >(null);

  const refreshPhotos =
    useCallback(
      async () => {
        if (!animalId) {
          return;
        }

        const data =
          await photoService.getByAnimalId(
            animalId
          );

        setPhotos(
          data ?? []
        );
      },
      [animalId]
    );

  useEffect(() => {
    let active =
      true;

    async function load() {
      try {
        setLoading(
          true
        );

        const data =
          await photoService.getByAnimalId(
            animalId
          );

        if (!active) {
          return;
        }

        setPhotos(
          data ?? []
        );
      } catch (
        error
      ) {
        console.error(
          "Erreur chargement photos animal :",
          error
        );

        if (active) {
          alert(
            getErrorMessage(
              error
            ) ||
              "Impossible de charger les photos."
          );
        }
      } finally {
        if (active) {
          setLoading(
            false
          );
        }
      }
    }

    if (animalId) {
      void load();
    }

    return () => {
      active = false;
    };
  }, [animalId]);

  useEffect(() => {
    if (!cropFile) {
      setCropImageUrl(
        ""
      );

      return;
    }

    const url =
      URL.createObjectURL(
        cropFile
      );

    setCropImageUrl(
      url
    );

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(
      null
    );

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [cropFile]);

  const sortedPhotos =
    useMemo(() => {
      return [
        ...photos,
      ].sort(
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
    }, [photos]);

  const onCropComplete =
    useCallback(
      (
        _area: Area,
        pixels: Area
      ) => {
        setCroppedAreaPixels(
          pixels
        );
      },
      []
    );

  function closeCrop() {
    setCropFile(
      null
    );

    setCropPhoto(
      null
    );

    setCropImageUrl(
      ""
    );

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(
      null
    );
  }

  async function handleNewPhotos(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      Array.from(
        event.target.files ??
          []
      );

    event.target.value =
      "";

    if (
      selected.length ===
      0
    ) {
      return;
    }

    const invalid =
      selected.find(
        (file) =>
          !file.type.startsWith(
            "image/"
          )
      );

    if (invalid) {
      alert(
        `"${invalid.name}" n'est pas une image valide.`
      );

      return;
    }

    const tooLarge =
      selected.find(
        (file) =>
          file.size >
          15 *
            1024 *
            1024
      );

    if (tooLarge) {
      alert(
        `"${tooLarge.name}" dépasse 15 Mo.`
      );

      return;
    }

    /*
     * On traite la première
     * photo sélectionnée.
     *
     * Après validation du crop,
     * elle sera uploadée.
     */

    setCropPhoto(
      null
    );

    setCropFile(
      selected[0]
    );
  }

  async function openExistingCrop(
    photo: AnimalPhoto
  ) {
    try {
      setCropSaving(
        true
      );

      const response =
        await fetch(
          photo.photo_url
        );

      if (
        !response.ok
      ) {
        throw new Error(
          "Impossible de charger cette photo."
        );
      }

      const blob =
        await response.blob();

      const mimeType =
        blob.type ||
        "image/jpeg";

      const extension =
        mimeType.includes(
          "png"
        )
          ? "png"
          : mimeType.includes(
                "webp"
              )
            ? "webp"
            : "jpg";

      const file =
        new File(
          [blob],
          `animal-${photo.id}.${extension}`,
          {
            type:
              mimeType,
            lastModified:
              Date.now(),
          }
        );

      setCropPhoto(
        photo
      );

      setCropFile(
        file
      );
    } catch (
      error
    ) {
      console.error(
        "Erreur ouverture crop :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible de préparer cette photo pour le recadrage."
      );
    } finally {
      setCropSaving(
        false
      );
    }
  }

  async function saveCrop() {
    if (
      !cropFile ||
      !cropImageUrl ||
      !croppedAreaPixels ||
      cropSaving
    ) {
      return;
    }

    try {
      setCropSaving(
        true
      );

      const croppedFile =
        await cropImageFile(
          cropImageUrl,
          croppedAreaPixels,
          cropFile.name
        );

      const oldPhoto =
        cropPhoto;

      const oldIds =
        new Set(
          photos.map(
            (photo) =>
              photo.id
          )
        );

      await photoService.upload(
        croppedFile,
        animalId
      );

      const afterUpload =
        await photoService.getByAnimalId(
          animalId
        );

      const uploadedPhoto =
        (
          afterUpload ??
          []
        ).find(
          (photo) =>
            !oldIds.has(
              photo.id
            )
        ) ??
        null;

      /*
       * Si on recadre une
       * photo existante :
       *
       * - nouvelle photo uploadée
       * - conservation du statut
       *   principale
       * - suppression de
       *   l'ancienne
       */

      if (
        oldPhoto &&
        uploadedPhoto
      ) {
        if (
          oldPhoto.is_cover
        ) {
          await photoService.setCover(
            uploadedPhoto.id,
            animalId
          );
        }

        await photoService.delete(
          oldPhoto.id
        );
      }

      await refreshPhotos();

      closeCrop();
    } catch (
      error
    ) {
      console.error(
        "Erreur recadrage / upload :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible d'enregistrer le recadrage."
      );
    } finally {
      setCropSaving(
        false
      );
    }
  }

  async function handleDelete(
    photo: AnimalPhoto
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
        photo.id
      );

      await photoService.delete(
        photo.id
      );

      await refreshPhotos();
    } catch (
      error
    ) {
      console.error(
        "Erreur suppression photo :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible de supprimer la photo."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  async function handleSetCover(
    photo: AnimalPhoto
  ) {
    try {
      setCoverLoadingId(
        photo.id
      );

      await photoService.setCover(
        photo.id,
        animalId
      );

      await refreshPhotos();
    } catch (
      error
    ) {
      console.error(
        "Erreur photo principale :",
        error
      );

      alert(
        getErrorMessage(
          error
        ) ||
          "Impossible de modifier la photo principale."
      );
    } finally {
      setCoverLoadingId(
        null
      );
    }
  }

  return (
    <>
      <section className="mx-auto mb-20 mt-8 w-full max-w-7xl px-4 sm:px-6">
        <div className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
                Photos
              </p>

              <h2 className="mt-1 text-3xl font-black text-[#064b42]">
                Gérer les
                photos
              </h2>

              <p className="mt-2 text-sm text-[#746c64]">
                Ajoutez,
                recadrez,
                choisissez la
                photo principale
                ou supprimez une
                photo.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f2ef] text-[#064b42]">
              <Camera
                size={24}
              />
            </div>
          </div>

          <div className="mt-6">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={
                handleNewPhotos
              }
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              disabled={
                uploading ||
                cropSaving
              }
              className="flex w-full items-center justify-center gap-3 rounded-[20px] bg-[#064b42] px-6 py-4 font-black text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              <ImagePlus
                size={20}
              />

              Ajouter une
              photo
            </button>
          </div>

          {loading ? (
            <div className="mt-8 flex items-center justify-center rounded-[24px] bg-[#fbf7ef] p-10">
              <Loader2
                size={30}
                className="animate-spin text-[#064b42]"
              />
            </div>
          ) : sortedPhotos.length ===
            0 ? (
            <div className="mt-8 rounded-[24px] bg-[#fbf7ef] p-10 text-center">
              <ImagePlus
                size={36}
                className="mx-auto text-[#b6aca3]"
              />

              <p className="mt-3 font-black text-[#746c64]">
                Aucune photo
                pour cet animal.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedPhotos.map(
                (
                  photo
                ) => {
                  const deleting =
                    deletingId ===
                    photo.id;

                  const changingCover =
                    coverLoadingId ===
                    photo.id;

                  return (
                    <article
                      key={
                        photo.id
                      }
                      className="overflow-hidden rounded-[24px] border border-[#eee7dc] bg-white shadow-sm"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            photo.photo_url
                          }
                          alt="Photo de l'animal"
                          className="h-full w-full object-cover"
                        />

                        {photo.is_cover && (
                          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#064b42] px-3 py-1.5 text-xs font-black text-white shadow">
                            <Star
                              size={
                                13
                              }
                              fill="currentColor"
                            />

                            Principale
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 p-4">
                        <button
                          type="button"
                          disabled={
                            cropSaving
                          }
                          onClick={() =>
                            void openExistingCrop(
                              photo
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e7f2ef] px-4 py-3 font-black text-[#064b42] transition hover:bg-[#064b42] hover:text-white disabled:opacity-50"
                        >
                          <Crop
                            size={
                              18
                            }
                          />

                          Recadrer
                        </button>

                        {!photo.is_cover && (
                          <button
                            type="button"
                            disabled={
                              changingCover
                            }
                            onClick={() =>
                              void handleSetCover(
                                photo
                              )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#064b42] px-4 py-3 font-black text-[#064b42] transition hover:bg-[#064b42] hover:text-white disabled:opacity-50"
                          >
                            {changingCover ? (
                              <Loader2
                                size={
                                  18
                                }
                                className="animate-spin"
                              />
                            ) : (
                              <Star
                                size={
                                  18
                                }
                              />
                            )}

                            Définir
                            principale
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={
                            deleting
                          }
                          onClick={() =>
                            void handleDelete(
                              photo
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fff1f2] px-4 py-3 font-black text-[#b42336] transition hover:bg-[#b42336] hover:text-white disabled:opacity-50"
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
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {cropFile &&
        cropImageUrl && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-3 sm:p-6">
            <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-black text-[#064b42]">
                    {cropPhoto
                      ? "Recadrer la photo"
                      : "Ajouter une photo"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Déplacez
                    l&apos;image
                    et utilisez
                    le zoom.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    cropSaving
                  }
                  onClick={
                    closeCrop
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                >
                  <X
                    size={20}
                  />
                </button>
              </div>

              <div className="relative h-[55vh] min-h-[320px] max-h-[620px] bg-[#151515]">
                <Cropper
                  image={
                    cropImageUrl
                  }
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  minZoom={1}
                  maxZoom={3}
                  showGrid
                  onCropChange={
                    setCrop
                  }
                  onZoomChange={
                    setZoom
                  }
                  onCropComplete={
                    onCropComplete
                  }
                />
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <div className="mb-2 flex justify-between text-sm font-black text-[#064b42]">
                    <span>
                      Zoom
                    </span>

                    <span>
                      {zoom.toFixed(
                        1
                      )}
                      ×
                    </span>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(
                      event
                    ) =>
                      setZoom(
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={
                      cropSaving
                    }
                    onClick={() => {
                      setCrop({
                        x: 0,
                        y: 0,
                      });

                      setZoom(
                        1
                      );
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 font-black"
                  >
                    <RotateCcw
                      size={
                        18
                      }
                    />

                    Réinitialiser
                  </button>

                  <button
                    type="button"
                    disabled={
                      cropSaving
                    }
                    onClick={
                      closeCrop
                    }
                    className="rounded-2xl border border-gray-300 px-5 py-3 font-black"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    disabled={
                      cropSaving ||
                      !croppedAreaPixels
                    }
                    onClick={() =>
                      void saveCrop()
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-6 py-3 font-black text-white disabled:opacity-50"
                  >
                    {cropSaving ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Check
                        size={
                          18
                        }
                      />
                    )}

                    {cropSaving
                      ? "Enregistrement..."
                      : cropPhoto
                        ? "Enregistrer le recadrage"
                        : "Ajouter la photo"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
}