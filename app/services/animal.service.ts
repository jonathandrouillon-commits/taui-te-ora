import { supabase } from "../lib/supabase";

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

  animal_photos?: any[];

  owner_profile?: {
    id: string;
    organization_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;

  /*
   * Anciens champs conserv├®s
   * pour compatibilit├® avec les
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

type PublisherRole =
  | "association"
  | "refuge"
  | "benevole"
  | "fourriere"
  | "admin";

const PUBLISHER_ROLES: PublisherRole[] = [
  "association",
  "refuge",
  "benevole",
  "fourriere",
  "admin",
];

/* =========================================================
   PROFILS CR├ëATEURS
========================================================= */

async function attachOwnerProfiles(
  animals: any[]
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
    .from("profiles")
    .select(
      `
        id,
        organization_name,
        avatar_url,
        role
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
   UTILISATEUR CONNECT├ë
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
      "Utilisateur non connect├®."
    );
  }

  return user;
}

/* =========================================================
   V├ëRIFICATION DROIT DE PUBLICATION
========================================================= */

async function getPublisherUser() {
  const user =
    await getCurrentUser();

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

  const role =
    String(
      profile?.role ||
        ""
    )
      .toLowerCase()
      .trim();

  const approvalStatus =
    String(
      profile?.approval_status ||
        "pending"
    )
      .toLowerCase()
      .trim();

  if (
    !PUBLISHER_ROLES.includes(
      role as PublisherRole
    ) ||
    profile?.is_active === false ||
    approvalStatus === "rejected" ||
    approvalStatus === "suspended"
  ) {
    throw new Error(
      "Votre compte ne permet pas actuellement de créer des fiches d'animaux."
    );
  }

  return {
    user,
    role:
      role as PublisherRole,
  };
}

/* =========================================================
   NOM DU CR├ëATEUR / STRUCTURE
========================================================= */

function getPublisherName(
  user: any
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
   ANIMAUX PUBLI├ëS POUR SWIPE CARD
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
   CR├ëER UN ANIMAL
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
   * l'utilisateur connect├®.
   *
   * On ignore volontairement
   * animal.owner_id envoy├®
   * depuis le navigateur.
   */
  const animalToCreate = {
    ...animal,

    owner_id:
      user.id,

    /*
     * Si association_name
     * n'a pas ├®t├® fourni,
     * on utilise automatiquement
     * le nom du cr├®ateur.
     *
     * Association :
     * Les Veilleurs de Kali
     *
     * Refuge :
     * SIGFA
     *
     * B├®n├®vole :
     * Jonathan Drouillon
     *
     * Fourri├¿re :
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
   PUBLIER / D├ëPUBLIER
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
