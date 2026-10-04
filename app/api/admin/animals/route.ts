import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

function getBearerToken(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }

  return authorization
    .slice(7)
    .trim();
}

function getText(
  formData: FormData,
  key: string
) {
  const value =
    formData.get(
      key
    );

  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function getBoolean(
  formData: FormData,
  key: string
) {
  return (
    getText(
      formData,
      key
    ) ===
    "true"
  );
}

function getProfileName(
  profile:
    Record<
      string,
      unknown
    >
) {
  const organization =
    String(
      profile.organization_name ||
        profile.structure_name ||
        profile.company_name ||
        ""
    ).trim();

  if (organization) {
    return organization;
  }

  const firstName =
    String(
      profile.first_name ||
        ""
    ).trim();

  const lastName =
    String(
      profile.last_name ||
        ""
    ).trim();

  const complete =
    `${firstName} ${lastName}`.trim();

  if (complete) {
    return complete;
  }

  return String(
    profile.display_name ||
      profile.full_name ||
      profile.email ||
      "Taui Te Ora"
  ).trim();
}

function getExtension(
  file: File
) {
  const extension =
    file.name
      .toLowerCase()
      .split(".")
      .pop();

  if (
    extension &&
    [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "heic",
      "heif",
    ].includes(
      extension
    )
  ) {
    return extension;
  }

  return "jpg";
}

export async function POST(
  request: Request
) {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !serviceRoleKey
  ) {
    return NextResponse.json(
      {
        error:
          "Configuration Supabase serveur incomplète.",
      },
      {
        status:
          500,
      }
    );
  }

  try {
    /*
     * =====================================================
     * AUTHENTIFICATION ADMIN
     * =====================================================
     */

    const token =
      getBearerToken(
        request
      );

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Authentification requise.",
        },
        {
          status:
            401,
        }
      );
    }

    const authClient =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },

          global: {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        }
      );

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await authClient.auth.getUser(
        token
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Session administrateur invalide.",
        },
        {
          status:
            401,
        }
      );
    }

    /*
     * Client Service Role.
     * Utilisé uniquement côté serveur.
     */

    const adminSupabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    const {
      data:
        adminProfile,
      error:
        adminProfileError,
    } =
      await adminSupabase
        .from(
          "profiles"
        )
        .select(
          "id, role"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      adminProfileError
    ) {
      throw adminProfileError;
    }

    if (
      String(
        adminProfile?.role ||
          ""
      )
        .trim()
        .toLowerCase() !==
      "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Accès réservé aux administrateurs.",
        },
        {
          status:
            403,
        }
      );
    }

    /*
     * =====================================================
     * FORMULAIRE
     * =====================================================
     */

    const formData =
      await request.formData();

    const ownerId =
      getText(
        formData,
        "owner_id"
      );

    const animalName =
      getText(
        formData,
        "animal_name"
      );

    const animalType =
      getText(
        formData,
        "animal_type"
      );

    if (!ownerId) {
      return NextResponse.json(
        {
          error:
            "Le profil propriétaire est obligatoire.",
        },
        {
          status:
            400,
        }
      );
    }

    if (!animalName) {
      return NextResponse.json(
        {
          error:
            "Le nom de l'animal est obligatoire.",
        },
        {
          status:
            400,
        }
      );
    }

    if (!animalType) {
      return NextResponse.json(
        {
          error:
            "Le type d'animal est obligatoire.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
     * =====================================================
     * VERIFICATION DU VRAI PROPRIETAIRE
     * =====================================================
     */

    const {
      data:
        ownerProfile,
      error:
        ownerError,
    } =
      await adminSupabase
        .from(
          "profiles"
        )
        .select("*")
        .eq(
          "id",
          ownerId
        )
        .maybeSingle();

    if (
      ownerError
    ) {
      throw ownerError;
    }

    if (!ownerProfile) {
      return NextResponse.json(
        {
          error:
            "Le profil sélectionné n'existe plus.",
        },
        {
          status:
            404,
        }
      );
    }

    const ownerName =
      getProfileName(
        ownerProfile as Record<
          string,
          unknown
        >
      );

    /*
     * =====================================================
     * DONNEES ANIMAL
     * =====================================================
     */

    const weightText =
      getText(
        formData,
        "weight_kg"
      );

    let weightKg:
      number | null =
      null;

    if (
      weightText
    ) {
      const parsedWeight =
        Number(
          weightText.replace(
            ",",
            "."
          )
        );

      if (
        !Number.isNaN(
          parsedWeight
        )
      ) {
        weightKg =
          parsedWeight;
      }
    }

    const animalToCreate = {
      owner_id:
        ownerId,

      association_name:
        ownerName,

      reference_number:
        getText(
          formData,
          "reference_number"
        ) ||
        null,

      animal_name:
        animalName,

      animal_type:
        animalType,

      age_label:
        getText(
          formData,
          "age_label"
        ) ||
        null,

      sex:
        getText(
          formData,
          "sex"
        ) ||
        null,

      breed:
        getText(
          formData,
          "breed"
        ) ||
        null,

      size_label:
        getText(
          formData,
          "size_label"
        ) ||
        null,

      street_duration:
        getText(
          formData,
          "street_duration"
        ) ||
        null,

      capture_location:
        getText(
          formData,
          "capture_location"
        ) ||
        null,

      island:
        getText(
          formData,
          "island"
        ) ||
        null,

      city:
        getText(
          formData,
          "city"
        ) ||
        null,

      map_address:
        getText(
          formData,
          "map_address"
        ) ||
        null,

      description_character:
        getText(
          formData,
          "description_character"
        ) ||
        null,

      health_status:
        getText(
          formData,
          "health_status"
        ) ||
        null,

      special_needs:
        getText(
          formData,
          "special_needs"
        ) ||
        null,

      story:
        getText(
          formData,
          "story"
        ) ||
        null,

      weight_kg:
        weightKg,

      compatible_chiens:
        getText(
          formData,
          "compatible_chiens"
        ) ||
        null,

      compatible_chats:
        getText(
          formData,
          "compatible_chats"
        ) ||
        null,

      compatible_enfants:
        getText(
          formData,
          "compatible_enfants"
        ) ||
        null,

      vaccinated:
        getBoolean(
          formData,
          "vaccinated"
        ),

      sterilized:
        getBoolean(
          formData,
          "sterilized"
        ),

      microchipped:
        getBoolean(
          formData,
          "microchipped"
        ),

      status:
        "available",

      is_adopted:
        false,

      is_published:
        getBoolean(
          formData,
          "is_published"
        ),

      updated_at:
        new Date()
          .toISOString(),
    };

    /*
     * =====================================================
     * CREATION
     * =====================================================
     */

    const {
      data:
        animal,
      error:
        animalError,
    } =
      await adminSupabase
        .from(
          "animals"
        )
        .insert(
          animalToCreate
        )
        .select("*")
        .single();

    if (
      animalError ||
      !animal
    ) {
      throw (
        animalError ||
        new Error(
          "Animal non créé."
        )
      );
    }

    /*
     * =====================================================
     * PHOTOS
     * =====================================================
     */

    const photoValues =
      formData.getAll(
        "photos"
      );

    const files =
      photoValues.filter(
        (
          value
        ): value is File =>
          value instanceof
            File &&
          value.size >
            0
      );

    const uploadedPaths:
      string[] =
      [];

    try {
      for (
        let index = 0;
        index <
        files.length;
        index++
      ) {
        const file =
          files[index];

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          continue;
        }

        if (
          file.size >
          15 *
            1024 *
            1024
        ) {
          continue;
        }

        const extension =
          getExtension(
            file
          );

        const fileName =
          `${Date.now()}-${crypto.randomUUID()}.${extension}`;

        const path =
          `${animal.id}/${fileName}`;

        const {
          error:
            uploadError,
        } =
          await adminSupabase.storage
            .from(
              "animals"
            )
            .upload(
              path,
              file,
              {
                cacheControl:
                  "3600",

                upsert:
                  false,

                contentType:
                  file.type,
              }
            );

        if (
          uploadError
        ) {
          throw uploadError;
        }

        uploadedPaths.push(
          path
        );

        const {
          data:
            publicUrlData,
        } =
          adminSupabase.storage
            .from(
              "animals"
            )
            .getPublicUrl(
              path
            );

        const {
          error:
            photoError,
        } =
          await adminSupabase
            .from(
              "animal_photos"
            )
            .insert({
              animal_id:
                animal.id,

              photo_url:
                publicUrlData.publicUrl,

              is_cover:
                index ===
                0,

              sort_order:
                index,
            });

        if (
          photoError
        ) {
          throw photoError;
        }
      }
    } catch (
      photoError
    ) {
      /*
       * L'animal existe déjà.
       * On ne le supprime pas automatiquement :
       * on renvoie l'erreur afin de ne pas perdre
       * la fiche saisie.
       */

      console.error(
        "Erreur photos animal admin :",
        photoError
      );

      return NextResponse.json(
        {
          error:
            photoError instanceof
              Error
              ? `Animal créé, mais erreur photo : ${photoError.message}`
              : "Animal créé, mais les photos n'ont pas pu être enregistrées.",

          animal,
        },
        {
          status:
            500,
        }
      );
    }

    /*
     * =====================================================
     * REPONSE
     * =====================================================
     */

    return NextResponse.json(
      {
        success:
          true,

        animal,

        owner: {
          id:
            ownerProfile.id,

          name:
            ownerName,

          role:
            ownerProfile.role,
        },
      },
      {
        status:
          201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Erreur API création animal admin :",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Erreur serveur pendant la création de l'animal.",
      },
      {
        status:
          500,
      }
    );
  }
}