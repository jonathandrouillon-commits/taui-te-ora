import {
  supabase,
} from "../lib/supabase";

export type AnimalPhoto = {
  id: string;
  created_at?: string;
  animal_id: string;
  photo_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

function cleanFileName(
  name: string
) {
  return name
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9.-]/g,
      "-"
    )
    .toLowerCase();
}

function changeExtensionToJpg(
  fileName: string
) {
  const withoutExtension =
    fileName.replace(
      /\.[^/.]+$/,
      ""
    );

  return `${withoutExtension}.jpg`;
}

/**
 * Normalise physiquement l'orientation
 * de la photo AVANT son upload.
 *
 * Les photos iPhone / Android peuvent
 * contenir une orientation EXIF sans que
 * les pixels soient réellement tournés.
 *
 * Le navigateur l'affiche correctement,
 * mais d'autres systèmes (Facebook,
 * ImageResponse, etc.) peuvent l'afficher
 * tournée.
 *
 * Ici :
 * photo -> navigateur applique EXIF
 * -> canvas -> nouvelle image JPG
 * -> EXIF supprimé
 * -> pixels réellement dans le bon sens.
 */
async function normalizePhoto(
  file: File
): Promise<File> {
  /*
   * On laisse passer les formats
   * qui ne sont pas des images.
   */
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    return file;
  }

  /*
   * SVG :
   * aucune normalisation EXIF nécessaire.
   */
  if (
    file.type ===
    "image/svg+xml"
  ) {
    return file;
  }

  /*
   * Cette fonction ne doit être appelée
   * que côté navigateur.
   */
  if (
    typeof window ===
      "undefined" ||
    typeof document ===
      "undefined"
  ) {
    return file;
  }

  const objectUrl =
    URL.createObjectURL(
      file
    );

  try {
    const image =
      await new Promise<HTMLImageElement>(
        (
          resolve,
          reject
        ) => {
          const img =
            new Image();

          img.onload =
            () =>
              resolve(
                img
              );

          img.onerror =
            () =>
              reject(
                new Error(
                  "Impossible de lire la photo."
                )
              );

          img.src =
            objectUrl;
        }
      );

    /*
     * naturalWidth / naturalHeight
     * correspondent à l'image telle que
     * le navigateur l'a interprétée,
     * orientation EXIF comprise.
     */
    const width =
      image.naturalWidth;

    const height =
      image.naturalHeight;

    if (
      !width ||
      !height
    ) {
      return file;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      width;

    canvas.height =
      height;

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      return file;
    }

    /*
     * Fond blanc.
     *
     * Cela évite qu'une éventuelle image
     * transparente convertie en JPG
     * obtienne un fond noir.
     */
    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      width,
      height
    );

    /*
     * Lorsque le navigateur affiche la photo,
     * il applique déjà son orientation EXIF.
     *
     * drawImage capture donc l'image telle
     * qu'elle doit réellement apparaître.
     */
    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const blob =
      await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/jpeg",
            0.92
          );
        }
      );

    if (!blob) {
      return file;
    }

    const normalizedName =
      changeExtensionToJpg(
        cleanFileName(
          file.name
        )
      );

    return new File(
      [
        blob,
      ],
      normalizedName,
      {
        type:
          "image/jpeg",

        lastModified:
          Date.now(),
      }
    );
  } catch (
    error
  ) {
    /*
     * Une erreur de normalisation
     * ne doit pas bloquer complètement
     * l'ajout d'un animal.
     *
     * On conserve l'original en fallback.
     */
    console.warn(
      "Normalisation photo impossible, utilisation de l'original :",
      error
    );

    return file;
  } finally {
    URL.revokeObjectURL(
      objectUrl
    );
  }
}

async function getByAnimalId(
  animalId: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "animal_photos"
      )
      .select("*")
      .eq(
        "animal_id",
        animalId
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );

  if (error) {
    throw error;
  }

  return data as
    AnimalPhoto[];
}

async function create(
  photo: {
    animal_id: string;
    photo_url: string;
    sort_order?: number;
    is_cover?: boolean;
  }
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "animal_photos"
      )
      .insert({
        animal_id:
          photo.animal_id,

        photo_url:
          photo.photo_url,

        sort_order:
          photo.sort_order ??
          0,

        is_cover:
          photo.is_cover ??
          false,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data as
    AnimalPhoto;
}

async function upload(
  file: File,
  animalId: string,
  index?: number
) {
  /*
   * NOUVEAU :
   * normalisation de l'orientation
   * avant tout upload Supabase.
   */
  const normalizedFile =
    await normalizePhoto(
      file
    );

  const safeName =
    cleanFileName(
      normalizedFile.name
    );

  const path =
    `${animalId}/photos/` +
    `${Date.now()}-` +
    `${index ?? 0}-` +
    `${safeName}`;

  const {
    error:
      uploadError,
  } =
    await supabase.storage
      .from(
        "animals"
      )
      .upload(
        path,
        normalizedFile,
        {
          upsert: true,

          /*
           * Supabase utilisera également
           * le bon MIME type.
           */
          contentType:
            normalizedFile.type ||
            "image/jpeg",
        }
      );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        "animals"
      )
      .getPublicUrl(
        path
      );

  const existingPhotos =
    await getByAnimalId(
      animalId
    );

  const order =
    index ??
    existingPhotos.length;

  return create({
    animal_id:
      animalId,

    photo_url:
      data.publicUrl,

    sort_order:
      order,

    is_cover:
      existingPhotos.length ===
        0 &&
      order === 0,
  });
}

async function uploadMany(
  files: File[],
  animalId: string
) {
  const uploaded:
    AnimalPhoto[] = [];

  for (
    let i = 0;
    i < files.length;
    i++
  ) {
    const photo =
      await upload(
        files[i],
        animalId,
        i
      );

    uploaded.push(
      photo
    );
  }

  return uploaded;
}

async function remove(
  id: string
) {
  const {
    error,
  } =
    await supabase
      .from(
        "animal_photos"
      )
      .delete()
      .eq(
        "id",
        id
      );

  if (error) {
    throw error;
  }

  return true;
}

async function setCover(
  photoId: string,
  animalId: string
) {
  const {
    error:
      resetError,
  } =
    await supabase
      .from(
        "animal_photos"
      )
      .update({
        is_cover:
          false,
      })
      .eq(
        "animal_id",
        animalId
      );

  if (resetError) {
    throw resetError;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "animal_photos"
      )
      .update({
        is_cover:
          true,
      })
      .eq(
        "id",
        photoId
      )
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data as
    AnimalPhoto;
}

async function reorder(
  animalId: string,
  photos: AnimalPhoto[]
) {
  for (
    let i = 0;
    i < photos.length;
    i++
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "animal_photos"
        )
        .update({
          sort_order:
            i,

          is_cover:
            i === 0,
        })
        .eq(
          "id",
          photos[i].id
        )
        .eq(
          "animal_id",
          animalId
        );

    if (error) {
      throw error;
    }
  }

  return true;
}

export const photoService = {
  getByAnimalId,

  getByAnimal:
    getByAnimalId,

  create,

  upload,

  uploadMany,

  delete:
    remove,

  setCover,

  reorder,
};