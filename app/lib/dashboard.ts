import { supabase } from "./supabase";

/* =========================================================
   TYPES
========================================================= */

export type Profile = {
  id: string;
  created_at?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  island?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  is_verified?: boolean;
  is_active?: boolean;
  organization_name?: string;

  adopter_experience?: string;
  current_animals?: string;
  adoption_for?: string;
  children_age?: string;
  garden_type?: string;
  ideal_age?: string;
  ideal_sex?: string;
  ideal_size?: string;
  ideal_activity?: string;
  ideal_breed?: string;
  hypoallergenic?: string;
  cleanliness?: string;
  special_needs?: string;

  approval_status?: string;
  approved_at?: string;
  approved_by?: string;
};

export type AnimalPhoto = {
  id?: string;
  animal_id?: string;
  photo_url?: string;
  is_cover?: boolean;
  sort_order?: number;
};

export type Animal = {
  id: string;
  created_at?: string;
  updated_at?: string;

  reference_number?: string;

  animal_name?: string;
  animal_type?: string;

  age_label?: string;
  sex?: string;
  breed?: string;
  size_label?: string;

  association_name?: string;

  street_duration?: string;
  capture_location?: string;

  island?: string;
  city?: string;

  description_character?: string;
  health_status?: string;
  special_needs?: string;

  is_published?: boolean;

  latitude?: number;
  longitude?: number;

  map_address?: string;
  map_visibility?: string;

  weight_kg?: number;

  story?: string;

  vaccinated?: boolean;
  sterilized?: boolean;
  microchipped?: boolean;

  owner_id?: string;
  association_id?: string;
  refuge_id?: string;

  is_adopted?: boolean;
  status?: string;

  compatible_chiens?: string;
  compatible_chats?: string;
  compatible_enfants?: string;

  animal_photos?: AnimalPhoto[];
};

/*
  On garde le nom Like pour ne pas casser
  les composants existants du dashboard.

  MAIS les données sont maintenant lues
  depuis la table "favorites".
*/

export type Like = {
  id: string;
  user_id: string;
  animal_id: string;
  created_at?: string;

  animals: Animal | null;
};

export type AdoptionRequest = {
  id: string;
  created_at?: string;

  animal_id?: string;
  requester_id?: string;
  owner_id?: string;

  status?: string;
  message?: string;

  match_score?: number | null;
  match_level?: string | null;
  match_details?: any;
  match_calculated_at?: string | null;

  animals?: Animal | null;
};

export type Notification = {
  id: string;
  created_at?: string;

  user_id?: string;

  title?: string;
  message?: string;

  type?: string;

  animal_id?: string;
  adoption_request_id?: string;

  is_read?: boolean;
};

/* =========================================================
   PROFIL
========================================================= */

export function getFullName(
  profile: Profile | null
) {
  if (!profile) {
    return "";
  }

  return `${profile.first_name || ""} ${
    profile.last_name || ""
  }`.trim();
}

export function isQuestionnaireFilled(
  profile: Profile | null
) {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.adopter_experience ||
      profile.current_animals ||
      profile.adoption_for ||
      profile.children_age ||
      profile.garden_type ||
      profile.ideal_age ||
      profile.ideal_sex ||
      profile.ideal_size ||
      profile.ideal_activity ||
      profile.ideal_breed ||
      profile.hypoallergenic ||
      profile.cleanliness ||
      profile.special_needs
  );
}

/* =========================================================
   UTILISATEUR CONNECTÉ
========================================================= */

export async function getCurrentUser() {
  const result =
    await supabase.auth.getUser();

  if (result.error) {
    throw result.error;
  }

  return result.data.user;
}

/* =========================================================
   RÉCUPÉRER LE PROFIL
========================================================= */

export async function getProfile(
  userId: string,
  email?: string
): Promise<Profile> {
  const { data, error } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    id: userId,

    created_at:
      data?.created_at || "",

    role:
      data?.role || "adoptant",

    first_name:
      data?.first_name || "",

    last_name:
      data?.last_name || "",

    birth_date:
      data?.birth_date || "",

    phone:
      data?.phone || "",

    email:
      data?.email ||
      email ||
      "",

    avatar_url:
      data?.avatar_url || "",

    island:
      data?.island || "",

    city:
      data?.city || "",

    address:
      data?.address || "",

    postal_code:
      data?.postal_code || "",

    is_verified:
      data?.is_verified || false,

    is_active:
      data?.is_active !== false,

    organization_name:
      data?.organization_name || "",

    adopter_experience:
      data?.adopter_experience || "",

    current_animals:
      data?.current_animals || "",

    adoption_for:
      data?.adoption_for || "",

    children_age:
      data?.children_age || "",

    garden_type:
      data?.garden_type || "",

    ideal_age:
      data?.ideal_age || "",

    ideal_sex:
      data?.ideal_sex || "",

    ideal_size:
      data?.ideal_size || "",

    ideal_activity:
      data?.ideal_activity || "",

    ideal_breed:
      data?.ideal_breed || "",

    hypoallergenic:
      data?.hypoallergenic || "",

    cleanliness:
      data?.cleanliness || "",

    special_needs:
      data?.special_needs || "",

    approval_status:
      data?.approval_status || "",

    approved_at:
      data?.approved_at || "",

    approved_by:
      data?.approved_by || "",
  };
}

/* =========================================================
   COUPS DE CŒUR
========================================================= */

/*
  IMPORTANT

  Ancien fonctionnement :
  table "likes"
  colonne user_id

  Nouveau fonctionnement :
  table "favorites"
  colonne profile_id

  C'est donc la même table que celle utilisée
  par favorite.service.ts.
*/

export async function getLikes(
  userId: string
): Promise<Like[]> {
  const {
    data,
    error,
  } = await supabase
    .from("favorites")
    .select(`
      id,
      created_at,
      profile_id,
      animal_id,
      animals (
        *,
        animal_photos (*)
      )
    `)
    .eq(
      "profile_id",
      userId
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

  return (
    data || []
  ).map(
    (favorite: any) => ({
      id:
        favorite.id,

      user_id:
        favorite.profile_id,

      animal_id:
        favorite.animal_id,

      created_at:
        favorite.created_at,

      animals:
        favorite.animals ||
        null,
    })
  ) as Like[];
}

/* =========================================================
   DEMANDES D'ADOPTION
========================================================= */

export async function getAdoptionRequests(
  userId: string
): Promise<AdoptionRequest[]> {
  const {
    data: requestsData,
    error: requestsError,
  } = await supabase
    .from("adoption_requests")
    .select(`
      id,
      created_at,
      animal_id,
      requester_id,
      owner_id,
      status,
      message,
      match_score,
      match_level,
      match_details,
      match_calculated_at
    `)
    .eq(
      "requester_id",
      userId
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (requestsError) {
    throw requestsError;
  }

  const requests =
    requestsData || [];

  const animalIds =
    requests
      .map(
        (request) =>
          request.animal_id
      )
      .filter(
        Boolean
      );

  if (
    animalIds.length === 0
  ) {
    return requests.map(
      (request) => ({
        ...request,
        animals: null,
      })
    ) as AdoptionRequest[];
  }

  const {
    data: animalsData,
    error: animalsError,
  } = await supabase
    .from("animals")
    .select(`
      *,
      animal_photos (*)
    `)
    .in(
      "id",
      animalIds
    );

  if (animalsError) {
    throw animalsError;
  }

  return requests.map(
    (request: any) => ({
      ...request,

      animals:
        (
          animalsData ||
          []
        ).find(
          (animal) =>
            animal.id ===
            request.animal_id
        ) ||
        null,
    })
  ) as AdoptionRequest[];
}

/* =========================================================
   ANNULER UNE DEMANDE D'ADOPTION
========================================================= */

/*
  IMPORTANT :

  On ne supprime PAS la demande.

  On passe simplement :
  status = "cancelled"

  Cela permet de conserver :
  - l'historique
  - la conversation
  - les informations de la demande
  - le score de compatibilité

  Et surtout :

  PAS de .single()

  Cela corrige l'erreur :
  "Cannot coerce the result to a single JSON object"
*/

export async function cancelAdoptionRequest(
  requestId: string,
  userId: string
) {
  const {
    error,
  } = await supabase
    .from("adoption_requests")
    .update({
      status: "cancelled",
    })
    .eq(
      "id",
      requestId
    )
    .eq(
      "requester_id",
      userId
    );

  if (error) {
    throw error;
  }

  return true;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export async function getNotifications(
  userId: string
): Promise<Notification[]> {
  const {
    data,
    error,
  } = await supabase
    .from("notifications")
    .select("*")
    .eq(
      "user_id",
      userId
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(20);

  if (error) {
    throw error;
  }

  return (
    data || []
  ) as Notification[];
}

/* =========================================================
   DÉCONNEXION
========================================================= */

export async function logoutUser() {
  const {
    error,
  } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return true;
}

/* =========================================================
   CHARGEMENT COMPLET DU DASHBOARD
========================================================= */

export async function getDashboardData() {
  const user =
    await getCurrentUser();

  if (!user) {
    return null;
  }

  const [
    profile,
    likes,
    adoptionRequests,
    notifications,
  ] =
    await Promise.all([
      getProfile(
        user.id,
        user.email || ""
      ),

      getLikes(
        user.id
      ),

      getAdoptionRequests(
        user.id
      ),

      getNotifications(
        user.id
      ),
    ]);

  return {
    user,
    profile,
    likes,
    adoptionRequests,
    notifications,
  };
}