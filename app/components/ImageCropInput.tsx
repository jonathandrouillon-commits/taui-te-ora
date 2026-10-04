"use client";

import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Cropper, {
  type Area,
} from "react-easy-crop";

import {
  Check,
  RotateCcw,
  X,
} from "lucide-react";

import {
  cropImageFile,
} from "../lib/cropImage";

type ImageCropInputProps = {
  onFilesReady: (
    files: File[]
  ) => void;

  multiple?: boolean;

  maxFiles?: number;

  maxSizeMB?: number;

  aspect?: number;

  disabled?: boolean;

  className?: string;

  children?: ReactNode;
};

export default function ImageCropInput({
  onFilesReady,
  multiple = false,
  maxFiles = 1,
  maxSizeMB = 15,
  aspect = 1,
  disabled = false,
  className = "",
  children,
}: ImageCropInputProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    files,
    setFiles,
  ] = useState<File[]>([]);

  const [
    croppedFiles,
    setCroppedFiles,
  ] = useState<File[]>([]);

  const [
    index,
    setIndex,
  ] = useState(0);

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
    files[index] ?? null;

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
    setFiles([]);
    setCroppedFiles([]);
    setIndex(0);
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
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  }

  function handleInputChange(
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

    const limitedFiles =
      selectedFiles.slice(
        0,
        multiple
          ? maxFiles
          : 1
      );

    const invalidFile =
      limitedFiles.find(
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

    const maxBytes =
      maxSizeMB *
      1024 *
      1024;

    const tooLargeFile =
      limitedFiles.find(
        (file) =>
          file.size >
          maxBytes
      );

    if (tooLargeFile) {
      alert(
        `"${tooLargeFile.name}" dépasse ${maxSizeMB} Mo.`
      );

      return;
    }

    setFiles(
      limitedFiles
    );

    setCroppedFiles(
      []
    );

    setIndex(0);
  }

  async function validateCrop() {
    if (
      !currentFile ||
      !imageUrl ||
      !croppedAreaPixels ||
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

      const nextFiles = [
        ...croppedFiles,
        croppedFile,
      ];

      const hasNextFile =
        index <
        files.length - 1;

      if (hasNextFile) {
        setCroppedFiles(
          nextFiles
        );

        setIndex(
          (
            previousIndex
          ) =>
            previousIndex +
            1
        );

        return;
      }

      onFilesReady(
        nextFiles
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

  function resetCurrentCrop() {
    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        disabled={disabled}
        onChange={
          handleInputChange
        }
        className="hidden"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          inputRef.current?.click()
        }
        className={
          className
        }
      >
        {children ??
          "Choisir une photo"}
      </button>

      {currentFile &&
        imageUrl && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-3 sm:p-6">
            <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-black text-[#064b42]">
                    Recadrer la
                    photo
                  </h2>

                  {files.length >
                    1 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Photo{" "}
                      {index +
                        1}
                      /
                      {
                        files.length
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
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                  aria-label="Fermer"
                >
                  <X
                    size={20}
                  />
                </button>
              </div>

              <div className="relative h-[55vh] min-h-[320px] max-h-[620px] bg-[#161616]">
                <Cropper
                  image={
                    imageUrl
                  }
                  crop={crop}
                  zoom={zoom}
                  aspect={
                    aspect
                  }
                  minZoom={1}
                  maxZoom={3}
                  zoomSpeed={0.1}
                  showGrid
                  restrictPosition
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
                    step={
                      0.05
                    }
                    value={
                      zoom
                    }
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
                    onClick={
                      resetCurrentCrop
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 font-black text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
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
                    className="rounded-2xl border border-gray-300 px-5 py-3 font-black text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
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
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-6 py-3 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check
                      size={
                        18
                      }
                    />

                    {processing
                      ? "Traitement..."
                      : index <
                          files.length -
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