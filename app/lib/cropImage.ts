import type {
  Area,
} from "react-easy-crop";

function createImage(
  source: string
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(
          new Error(
            "Impossible de charger l'image."
          )
        );
      };

      image.crossOrigin =
        "anonymous";

      image.src = source;
    }
  );
}

export async function cropImageFile(
  imageSource: string,
  crop: Area,
  originalFileName: string
): Promise<File> {
  const image =
    await createImage(
      imageSource
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  const cropWidth =
    Math.max(
      1,
      Math.round(
        crop.width
      )
    );

  const cropHeight =
    Math.max(
      1,
      Math.round(
        crop.height
      )
    );

  canvas.width =
    cropWidth;

  canvas.height =
    cropHeight;

  const context =
    canvas.getContext(
      "2d"
    );

  if (!context) {
    throw new Error(
      "Impossible de préparer le recadrage de la photo."
    );
  }

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    "high";

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    cropWidth,
    cropHeight
  );

  const blob =
    await new Promise<Blob>(
      (
        resolve,
        reject
      ) => {
        canvas.toBlob(
          (
            result
          ) => {
            if (
              !result
            ) {
              reject(
                new Error(
                  "Impossible de générer la photo recadrée."
                )
              );

              return;
            }

            resolve(
              result
            );
          },
          "image/jpeg",
          0.92
        );
      }
    );

  const baseName =
    originalFileName
      .replace(
        /\.[^/.]+$/,
        ""
      )
      .trim()
      .replace(
        /[^a-zA-Z0-9-_]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      ) ||
    "photo";

  return new File(
    [blob],
    `${baseName}-crop.jpg`,
    {
      type:
        "image/jpeg",
      lastModified:
        Date.now(),
    }
  );
}