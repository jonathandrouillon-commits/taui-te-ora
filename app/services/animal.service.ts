import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type AnimalPhoto = {
  id: string;
  animal_id: string;
  photo_url: string;
  sort_order?: number | null;
  is_cover?: boolean | null;
  created_at?: string | null;
};

export type Animal = {
  id: string;

  created_at?: string;
  updated_at?: string;

  reference_number?: string | null;

  animal_name: string | null;
  animal_type: string | null;

  age_label: string | null;
  sex: string | null;

  breed: string | null;
  size_label: string | null;

  association_name?: string | null;

  street_duration?: string | null;
  capture_location?: string | null;

  island: string | null;
  city: string | null;

  description_character?: string | null;

  health_status?: string | null;
  special_needs?: string | null;

  is_published?: boolean | null;

  latitude?: number | null;
  longitude?: number | null;

  map_address?: string | null;
  map_visibility?: string | null;

  weight_kg?: number | null;

  story?: string | null;

  vaccinated?: boolean | null;
  sterilized?: boolean | null;
  microchipped?: boolean | null;

  owner_id?: string | null;

  compatible_chiens?: string | null;
  compatible_chats?: string | null;
  compatible_enfants?: string | null;

  energy_level?: string | null;
  housing_need?: string | null;
  alone_tolerance?: string | null;
  adopter_experience_required?: string | null;
  education_level?: string | null;
  human_contact?: string | null;
  daily_activity_need?: string | null;
  vigilance_points?: string[] | null;
  ideal_family?: string | null;

  animal_photos?: AnimalPhoto[];

  owner_profile?: {
    id: string;
    organization_name: string | null;
    avatar_url: string | null;
    role: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;

  /*
   * Anciens champs conservâ”œÂ®s
   * pour compatibilitâ”œÂ® avec les
   * anciennes pages.
   */
  nom?: string | null;
  type?: string | null;
  sexe?: string | null;
  age?: string | null;
  race?: string | null;
  taille?: string | null;
  poids?: string | null;
  ile?: string | null;
  localisation?: string | null;

  lieu_capture?: string | null;
  temps_rue?: string | null;

  statut?: string | null;

  histoire?: string | null;
  caractere?: string | null;
  sante?: string | null;

  sterilise?: boolean | null;
  vaccine?: boolean | null;
  identifie?: boolean | null;

  photo_url?: string | null;

  association_id?: string | null;
  created_by?: string | null;
};

export type AppRole =
  | "adoptant"
  | "association"
  | "refuge"
  | "benevole"
  | "fourriere"
  | "admin";

export type CurrentUserAccess = {
  userId: string;
  role: AppRole | null;
  isActive: boolean;
  approvalStatus: string;
  canPublishAnimals: boolean;
};

const PUBLISHER_ROLES: AppRole[] = [
  "association",
  "refuge",
  "benevole",
  "fourriere",
  "admin",
];

/* =========================================================
   PROFILS CRâ”œÃ«ATEURS
========================================================= */

async function attachOwnerProfiles(
  animals: Animal[]
) {
  const ownerIds = Array.from(
    new Set(
      animals
        .map(
          (animal) =>
            animal.owner_id
        )
        .filter(
          (id): id is string =>
            Boolean(id)
        )
    )
  );

  if (
    ownerIds.length === 0
  ) {
    return animals.map(
      (animal) => ({
        ...animal,
        owner_profile: null,
      })
    );
  }

  const {
    data: profiles,
    error,
  } = await supabase
    .from("public_structure_profiles")
    .select(
      `
        id,
        organization_name,
        avatar_url,
        role,
        first_name,
        last_name
      `
    )
    .in(
      "id",
      ownerIds
    );

  if (error) {
    throw error;
  }

  return animals.map(
    (animal) => ({
      ...animal,

      owner_profile:
        profiles?.find(
          (profile) =>
            profile.id ===
            animal.owner_id
        ) || null,
    })
  );
}

/* =========================================================
   UTILISATEUR CONNECTâ”œÃ«
========================================================= */

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } =
    await supabase.auth.getUser();

  if (
    error ||
    !user
  ) {
    throw new Error(
      "Utilisateur non connectâ”œÂ®."
    );
  }

  return user;
}

/* =========================================================
   Vâ”œÃ«RIFICATION DROIT DE PUBLICATION
========================================================= */

async function getCurrentUserAccess(): Promise<CurrentUserAccess> {
  const user = await getCurrentUser();

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select(
      "role, approval_status, is_active"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const normalizedRole =
    String(
      profile?.role || ""
    )
      .toLowerCase()
      .trim();

  const role =
    normalizedRole
      ? (normalizedRole as AppRole)
      : null;

  const approvalStatus =
    String(
      profile?.approval_status ||
        "pending"
    )
      .toLowerCase()
      .trim();

  const isActive =
    profile?.is_active !== false;

  const canPublishAnimals =
    role !== null &&
    PUBLISHER_ROLES.includes(role) &&
    isActive &&
    approvalStatus !== "rejected" &&
    approvalStatus !== "suspended";

  return {
    userId: user.id,
    role,
    isActive,
    approvalStatus,
    canPublishAnimals,
  };
}

/* =========================================================
   VÃ‰RIFICATION DROIT DE PUBLICATION
========================================================= */

async function getPublisherUser() {
  const user =
    await getCurrentUser();

  const access =
    await getCurrentUserAccess();

  if (!access.canPublishAnimals) {
    throw new Error(
      "Votre compte ne permet pas actuellement de crÃ©er des fiches d'animaux."
    );
  }

  return {
    user,
    role: access.role,
  };
}

/* =========================================================
   NOM DU CRâ”œÃ«ATEUR / STRUCTURE
========================================================= */

function getPublisherName(
  user: User
) {
  const organizationName =
    String(
      user.user_metadata
        ?.organization_name ||
        ""
    ).trim();

  if (
    organizationName
  ) {
    return organizationName;
  }

  const fullName =
    String(
      user.user_metadata
        ?.full_name || ""
    ).trim();

  if (
    fullName
  ) {
    return fullName;
  }

  const firstName =
    String(
      user.user_metadata
        ?.first_name || ""
    ).trim();

  const lastName =
    String(
      user.user_metadata
        ?.last_name || ""
    ).trim();

  const name =
    [
      firstName,
      lastName,
    ]
      .filter(Boolean)
      .join(" ");

  if (name) {
    return name;
  }

  return (
    user.email ||
    "Utilisateur Taui Te Ora"
  );
}

/* =========================================================
   TOUS LES ANIMAUX
========================================================= */

async function getAll() {
  const {
    data,
    error,
  } = await supabase
    .from("animals")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return attachOwnerProfiles(
    data || []
  ) as Promise<Animal[]>;
}

/* =========================================================
   MES ANIMAUX
========================================================= */

async function getMyAnimals() {
  const user =
    await getCurrentUser();

  const {
    data,
    error,
  } = await supabase
    .from("animals")
    .select(
      `
        *,
        animal_photos (*)
      `
    )
    .eq(
      "owner_id",
      user.id
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return attachOwnerProfiles(
    data || []
  ) as Promise<Animal[]>;
}

/* =========================================================
   UN ANIMAL
========================================================= */

async function getById(
  id: string
) {
  const {
    data,
    error,
  } = await supabase
    .from("animals")
    .select(
      `
        *,
        animal_photos (*)
      `
    )
    .eq(
      "id",
      id
    )
    .single();

  if (error) {
    throw error;
  }

  const result =
    await attachOwnerProfiles(
      [data]
    );

  return result[0] as Animal;
}

/* =========================================================
   ANIMAUX PUBLIâ”œÃ«S POUR SWIPE CARD
========================================================= */

async function getPublishedWithPhotos() {
  const {
    data,
    error,
  } = await supabase
    .from("animals")
    .select(
      `
        *,
        animal_photos (*)
      `
    )
    .eq(
      "is_published",
      true
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return attachOwnerProfiles(
    data || []
  ) as Promise<Animal[]>;
}

/* =========================================================
   TOUS AVEC PHOTOS
========================================================= */

async function getAllWithPhotos() {
  const {
    data,
    error,
  } = await supabase
    .from("animals")
    .select(
      `
        *,
        animal_photos (*)
      `
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return attachOwnerProfiles(
    data || []
  ) as Promise<Animal[]>;
}

/* =========================================================
   CRâ”œÃ«ER UN ANIMAL
========================================================= */

async function create(
  animal: Partial<Animal>
) {
  const {
    user,
  } =
    await getPublisherUser();

  const publisherName =
    getPublisherName(
      user
    );

  /*
   * IMPORTANT :
   *
   * owner_id est TOUJOURS
   * l'utilisateur connectâ”œÂ®.
   *
   * On ignore volontairement
   * animal.owner_id envoyâ”œÂ®
   * depuis le navigateur.
   */
  const animalToCreate = {
    ...animal,

    owner_id:
      user.id,

    /*
     * Si association_name
     * n'a pas â”œÂ®tâ”œÂ® fourni,
     * on utilise automatiquement
     * le nom du crâ”œÂ®ateur.
     *
     * Association :
     * Les Veilleurs de Kali
     *
     * Refuge :
     * SIGFA
     *
     * Bâ”œÂ®nâ”œÂ®vole :
     * Jonathan Drouillon
     *
     * Fourriâ”œÂ¿re :
     * nom de la structure
     */
    association_name:
      animal.association_name ||
      publisherName,

    updated_at:
      new Date().toISOString(),
  };

  const {
    data,
    error,
  } = await supabase
    .from("animals")
    .insert(
      animalToCreate
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Animal;
}

/* =========================================================
   MODIFIER UN ANIMAL
========================================================= */

async function update(
  id: string,
  animal: Partial<Animal>
) {
  const user =
    await getCurrentUser();

  /*
   * owner_id n'est jamais
   * modifiable depuis le formulaire.
   */
  const {
    owner_id: _ignoredOwnerId,
    ...safeAnimal
  } = animal;

  const {
    data,
    error,
  } = await supabase
    .from("animals")
    .update({
      ...safeAnimal,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      id
    )
    .eq(
      "owner_id",
      user.id
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Animal;
}

/* =========================================================
   PUBLIER / Dâ”œÃ«PUBLIER
========================================================= */

async function togglePublished(
  id: string,
  isPublished: boolean
) {
  return update(
    id,
    {
      is_published:
        isPublished,
    }
  );
}

/* =========================================================
   SUPPRIMER
========================================================= */

async function remove(
  id: string
) {
  const user =
    await getCurrentUser();

  const {
    error,
  } = await supabase
    .from("animals")
    .delete()
    .eq(
      "id",
      id
    )
    .eq(
      "owner_id",
      user.id
    );

  if (error) {
    throw error;
  }

  return true;
}

/* =========================================================
   EXPORT SERVICE
========================================================= */

export const animalService = {
  getCurrentUserAccess,

  getAll,

  getMyAnimals,

  getById,

  getPublishedWithPhotos,

  getAllWithPhotos,

  create,

  update,

  togglePublished,

  delete:
    remove,
};
