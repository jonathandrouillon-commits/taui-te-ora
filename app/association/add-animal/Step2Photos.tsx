"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
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
  Film,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import {
  cropImageFile,
} from "../../lib/cropImage";

type Step2PhotosProps = {
  photos: File[];

  setPhotos: Dispatch<
    SetStateAction<File[]>
  >;

  video: File | null;

  setVideo: Dispatch<
    SetStateAction<File | null>
  >;
};

type CropMode =
  | "new"
  | "edit"
  | null;

export default function Step2Photos({
  photos,
  setPhotos,
  video,
  setVideo,
}: Step2PhotosProps) {
  const photoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    cropQueue,
    setCropQueue,
  ] = useState<File[]>([]);

  const [
    processedPhotos,
    setProcessedPhotos,
  ] = useState<File[]>([]);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    editPhotoIndex,
    setEditPhotoIndex,
  ] = useState<number | null>(
    null
  );

  const [
    cropMode,
    setCropMode,
  ] = useState<CropMode>(
    null
  );

  const [
    imageUrl,
    setImageUrl,
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
  ] = useState<Area | null>(
    null
  );

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const currentFile =
    cropQueue[currentIndex] ??
    null;

  const cropOpen =
    Boolean(
      currentFile &&
        imageUrl &&
        cropMode
    );

  const previews =
    useMemo(() => {
      return photos.map(
        (file) => ({
          file,
          url:
            URL.createObjectURL(
              file
            ),
        })
      );
    }, [photos]);

  useEffect(() => {
    return () => {
      previews.forEach(
        ({ url }) => {
          URL.revokeObjectURL(
            url
          );
        }
      );
    };
  }, [previews]);

  useEffect(() => {
    if (!currentFile) {
      setImageUrl("");
      return;
    }

    const url =
      URL.createObjectURL(
        currentFile
      );

    setImageUrl(url);

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
  }, [currentFile]);

  const handleCropComplete =
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

  function resetCropState() {
    setCropQueue([]);
    setProcessedPhotos([]);
    setCurrentIndex(0);
    setEditPhotoIndex(
      null
    );
    setCropMode(
      null
    );
    setImageUrl("");

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(
      null
    );

    if (
      photoInputRef.current
    ) {
      photoInputRef.current.value =
        "";
    }
  }

  function handlePhotosSelected(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ??
          []
      );

    event.target.value = "";

    if (
      selectedFiles.length ===
      0
    ) {
      return;
    }

    const remaining =
      5 - photos.length;

    if (
      remaining <= 0
    ) {
      alert(
        "Maximum 5 photos."
      );

      return;
    }

    const invalidFile =
      selectedFiles.find(
        (file) =>
          !file.type.startsWith(
            "image/"
          )
      );

    if (invalidFile) {
      alert(
        `"${invalidFile.name}" n'est pas une image valide.`
      );

      return;
    }

    const tooLargeFile =
      selectedFiles.find(
        (file) =>
          file.size >
          15 *
            1024 *
            1024
      );

    if (tooLargeFile) {
      alert(
        `"${tooLargeFile.name}" dépasse 15 Mo.`
      );

      return;
    }

    const acceptedFiles =
      selectedFiles.slice(
        0,
        remaining
      );

    setCropQueue(
      acceptedFiles
    );

    setProcessedPhotos(
      []
    );

    setCurrentIndex(
      0
    );

    setEditPhotoIndex(
      null
    );

    setCropMode(
      "new"
    );
  }

  function openEditCrop(
    index: number
  ) {
    const file =
      photos[index];

    if (!file) {
      return;
    }

    setCropQueue([
      file,
    ]);

    setProcessedPhotos(
      []
    );

    setCurrentIndex(
      0
    );

    setEditPhotoIndex(
      index
    );

    setCropMode(
      "edit"
    );
  }

  async function validateCrop() {
    if (
      !currentFile ||
      !imageUrl ||
      !croppedAreaPixels ||
      !cropMode ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(
        true
      );

      const croppedFile =
        await cropImageFile(
          imageUrl,
          croppedAreaPixels,
          currentFile.name
        );

      if (
        cropMode ===
          "edit" &&
        editPhotoIndex !==
          null
      ) {
        setPhotos(
          (
            currentPhotos
          ) =>
            currentPhotos.map(
              (
                file,
                index
              ) =>
                index ===
                editPhotoIndex
                  ? croppedFile
                  : file
            )
        );

        resetCropState();

        return;
      }

      const nextProcessed =
        [
          ...processedPhotos,
          croppedFile,
        ];

      const hasNextPhoto =
        currentIndex <
        cropQueue.length -
          1;

      if (hasNextPhoto) {
        setProcessedPhotos(
          nextProcessed
        );

        setCurrentIndex(
          (
            previous
          ) =>
            previous +
            1
        );

        return;
      }

      setPhotos(
        (
          currentPhotos
        ) =>
          [
            ...currentPhotos,
            ...nextProcessed,
          ].slice(
            0,
            5
          )
      );

      resetCropState();
    } catch (
      error
    ) {
      console.error(
        "Erreur recadrage photo :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible de recadrer la photo."
      );
    } finally {
      setProcessing(
        false
      );
    }
  }

  function removePhoto(
    index: number
  ) {
    setPhotos(
      (
        currentPhotos
      ) =>
        currentPhotos.filter(
          (
            _file,
            currentIndex
          ) =>
            currentIndex !==
            index
        )
    );
  }

  function handleVideo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "video/"
      )
    ) {
      alert(
        "Merci de sélectionner une vidéo valide."
      );

      return;
    }

    if (
      file.size >
      80 *
        1024 *
        1024
    ) {
      alert(
        "La vidéo ne doit pas dépasser 80 Mo."
      );

      return;
    }

    setVideo(file);
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-black text-[#064b42]">
            Photos & vidéo
          </h2>

          <p className="mt-2 text-sm text-[#746c64]">
            Ajoutez jusqu&apos;à
            5 photos. Vous
            pouvez ensuite
            recadrer chaque
            photo autant de
            fois que nécessaire.
          </p>
        </div>

        <div className="rounded-[26px] border border-dashed border-[#d8e9e3] bg-[#fffaf7] p-5">
          <input
            ref={
              photoInputRef
            }
            type="file"
            accept="image/*"
            multiple
            onChange={
              handlePhotosSelected
            }
            className="hidden"
          />

          <button
            type="button"
            disabled={
              photos.length >=
              5
            }
            onClick={() =>
              photoInputRef.current?.click()
            }
            className="flex w-full items-center justify-center gap-3 rounded-[20px] bg-[#064b42] px-6 py-4 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera
              size={20}
            />

            {photos.length >=
            5
              ? "Maximum 5 photos"
              : "Ajouter des photos"}
          </button>

          <p className="mt-3 text-center text-xs text-[#746c64]">
            JPG, PNG, WEBP —
            15 Mo maximum par
            photo
          </p>

          <p className="mt-1 text-center text-xs font-black text-[#064b42]">
            {photos.length}/5
            photo
            {photos.length >
            1
              ? "s"
              : ""}
          </p>
        </div>

        {photos.length >
          0 && (
          <div>
            <h3 className="mb-4 text-lg font-black text-[#064b42]">
              Photos
              sélectionnées
            </h3>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {previews.map(
                (
                  {
                    file,
                    url,
                  },
                  index
                ) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="overflow-hidden rounded-[22px] bg-white shadow"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          url
                        }
                        alt={`Photo ${
                          index +
                          1
                        }`}
                        className="h-full w-full object-cover"
                      />

                      {index ===
                        0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-[#064b42] px-3 py-1 text-[11px] font-black text-white shadow">
                          Principale
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 p-3">
                      <button
                        type="button"
                        onClick={() =>
                          openEditCrop(
                            index
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e7f2ef] px-3 py-2 text-sm font-black text-[#064b42] transition hover:bg-[#064b42] hover:text-white"
                      >
                        <Crop
                          size={
                            16
                          }
                        />

                        Recadrer
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removePhoto(
                            index
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#fff1f2] px-3 py-2 text-sm font-black text-[#b42336] transition hover:bg-[#b42336] hover:text-white"
                      >
                        <Trash2
                          size={
                            16
                          }
                        />

                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            <p className="mt-3 text-sm font-bold text-[#746c64]">
              La première
              photo sera
              utilisée comme
              photo principale.
            </p>
          </div>
        )}

        <div className="rounded-[26px] bg-[#f8f4ec] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#064b42] shadow-sm">
              <Film
                size={20}
              />
            </div>

            <div>
              <h3 className="font-black text-[#064b42]">
                Vidéo
              </h3>

              <p className="text-xs text-[#746c64]">
                Facultative
              </p>
            </div>
          </div>

          {!video ? (
            <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-[#cabfae] bg-white px-5 py-4 text-center font-black text-[#064b42]">
              Choisir une
              vidéo

              <input
                type="file"
                accept="video/*"
                onChange={
                  handleVideo
                }
                className="hidden"
              />
            </label>
          ) : (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Film
                  size={22}
                  className="shrink-0 text-[#064b42]"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-[#064b42]">
                    {
                      video.name
                    }
                  </p>

                  <p className="mt-1 text-xs text-[#746c64]">
                    {(
                      video.size /
                      1024 /
                      1024
                    ).toFixed(
                      1
                    )}{" "}
                    Mo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVideo(
                    null
                  )
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fff1f2] px-4 py-3 font-black text-[#b42336]"
              >
                <Trash2
                  size={18}
                />

                Retirer la
                vidéo
              </button>
            </div>
          )}
        </div>
      </div>

      {cropOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-3 sm:p-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-black text-[#064b42]">
                  Recadrer la
                  photo
                </h2>

                {cropMode ===
                  "new" &&
                  cropQueue.length >
                    1 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Photo{" "}
                      {currentIndex +
                        1}
                      /
                      {
                        cropQueue.length
                      }
                    </p>
                  )}
              </div>

              <button
                type="button"
                disabled={
                  processing
                }
                onClick={
                  resetCropState
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div className="relative h-[55vh] min-h-[320px] max-h-[620px] bg-[#151515]">
              <Cropper
                image={
                  imageUrl
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
                  handleCropComplete
                }
              />
            </div>

            <div className="space-y-5 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-black text-[#064b42]">
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
                    processing
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 font-black text-gray-700"
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
                    processing
                  }
                  onClick={
                    resetCropState
                  }
                  className="rounded-2xl border border-gray-300 px-5 py-3 font-black text-gray-700"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={
                    processing ||
                    !croppedAreaPixels
                  }
                  onClick={
                    validateCrop
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-6 py-3 font-black text-white disabled:opacity-50"
                >
                  <Check
                    size={18}
                  />

                  {processing
                    ? "Traitement..."
                    : cropMode ===
                        "edit"
                      ? "Enregistrer le recadrage"
                      : currentIndex <
                          cropQueue.length -
                            1
                        ? "Valider et suivante"
                        : "Valider le recadrage"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}