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

      is_published: false,

      sibling_group_id: getText(formData, "sibling_group_id") || null,

      energy_level: getText(formData, "energy_level") || null,

      housing_need: getText(formData, "housing_need") || null,

      alone_tolerance: getText(formData, "alone_tolerance") || null,

      adopter_experience_required: getText(formData, "adopter_experience_required") || null,

      education_level: getText(formData, "education_level") || null,

      human_contact: getText(formData, "human_contact") || null,

      daily_activity_need: getText(formData, "daily_activity_need") || null,

      ideal_family: getText(formData, "ideal_family") || null,

      vigilance_points: (() => {

        try { const value = JSON.parse(getText(formData, "vigilance_points") || "[]"); return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []; }

        catch { return []; }

      })(),

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

    // Vidéo, puis publication : les médias doivent être disponibles avant Facebook.

    const videoValue = formData.get("video");

    if (videoValue instanceof File && videoValue.size > 0) {

      if (!videoValue.type.startsWith("video/") || videoValue.size > 100 * 1024 * 1024) {

        return NextResponse.json({ error: "Animal créé, mais vidéo invalide (maximum 100 Mo).", animal }, { status: 400 });

      }

      const ext = (videoValue.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");

      const videoPath = `${animal.id}/videos/${crypto.randomUUID()}.${ext || "mp4"}`;

      const { error: videoUploadError } = await adminSupabase.storage.from("animals").upload(videoPath, videoValue, {

        upsert: false,

        contentType: videoValue.type,

      });

      if (videoUploadError) throw new Error(`Animal créé, mais erreur vidéo : ${videoUploadError.message}`);

      const { data: videoPublic } = adminSupabase.storage.from("animals").getPublicUrl(videoPath);

      const { error: videoInsertError } = await adminSupabase.from("animal_videos").insert({

        animal_id: animal.id,

        video_url: videoPublic.publicUrl,

        sort_order: 99,

      });

      if (videoInsertError) throw new Error(`Animal créé, mais erreur enregistrement vidéo : ${videoInsertError.message}`);

    }



    if (getBoolean(formData, "is_published")) {

      const { error: publishError } = await adminSupabase.from("animals")

        .update({ is_published: true })

        .eq("id", animal.id);

      if (publishError) throw new Error(`Animal créé en brouillon, mais publication impossible : ${publishError.message}`);

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

/** Liste des profils pour la création d'animaux par l'administration. */
export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Configuration Supabase serveur incomplète." }, { status: 500 });
  }
  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: roleError } = await admin.from("profiles")
      .select("role").eq("id", user.id).maybeSingle();
    if (roleError) throw roleError;
    if (String(profile?.role || "").toLowerCase().trim() !== "admin") {
      return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }
    // Colonnes utilisées et existantes dans le modèle profiles.
    // Ne pas demander display_name/full_name : elles ne sont pas garanties.
    const { data: profiles, error: profilesError } = await admin.from("profiles")
      .select("id,role,first_name,last_name,organization_name,email")
      .order("created_at", { ascending: false });
    if (profilesError) throw profilesError;
    return NextResponse.json({ profiles: profiles || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erreur API liste profils admin :", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur de chargement des profils." }, { status: 500 });
  }
}
