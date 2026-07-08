import { supabase } from "./supabase";

export type Profile = {
  id: string;
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
};

export type Animal = {
  id: string;
  animal_name?: string;
  animal_type?: string;
  age_label?: string;
  sex?: string;
  breed?: string;
  size_label?: string;
  association_name?: string;
  island?: string;
  city?: string;
  story?: string;
  status?: string;
  is_adopted?: boolean;
  owner_id?: string;
};

export type Like = {
  id: string;
  animal_id: string;
  user_id?: string;
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

export function getFullName(profile: Profile | null) {
  if (!profile) return "";
  return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
}

export function isQuestionnaireFilled(profile: Profile | null) {
  if (!profile) return false;

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
      profile.cleanliness ||
      profile.special_needs
  );
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}

export async function getProfile(userId: string, email?: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return {
    id: userId,
    role: data?.role || "adoptant",
    first_name: data?.first_name || "",
    last_name: data?.last_name || "",
    birth_date: data?.birth_date || "",
    phone: data?.phone || "",
    email: data?.email || email || "",
    avatar_url: data?.avatar_url || "",
    island: data?.island || "",
    city: data?.city || "",
    address: data?.address || "",
    postal_code: data?.postal_code || "",
    organization_name: data?.organization_name || "",
    adopter_experience: data?.adopter_experience || "",
    current_animals: data?.current_animals || "",
    adoption_for: data?.adoption_for || "",
    children_age: data?.children_age || "",
    garden_type: data?.garden_type || "",
    ideal_age: data?.ideal_age || "",
    ideal_sex: data?.ideal_sex || "",
    ideal_size: data?.ideal_size || "",
    ideal_activity: data?.ideal_activity || "",
    ideal_breed: data?.ideal_breed || "",
    hypoallergenic: data?.hypoallergenic || "",
    cleanliness: data?.cleanliness || "",
    special_needs: data?.special_needs || "",
    approval_status: data?.approval_status || "",
  } as Profile;
}

export async function getLikes(userId: string) {
  const { data, error } = await supabase
    .from("likes")
    .select(`
      id,
      animal_id,
      user_id,
      animals (*)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Like[]) || [];
}

export async function getAdoptionRequests(userId: string) {
  const { data, error } = await supabase
    .from("adoption_requests")
    .select(`
      id,
      created_at,
      animal_id,
      requester_id,
      owner_id,
      status,
      message,
      animals (*)
    `)
    .eq("requester_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as AdoptionRequest[]) || [];
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      created_at,
      user_id,
      title,
      message,
      type,
      animal_id,
      adoption_request_id,
      is_read
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data as Notification[]) || [];
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getDashboardData() {
  const user = await getCurrentUser();

  if (!user) return null;

  const [profile, likes, adoptionRequests, notifications] = await Promise.all([
    getProfile(user.id, user.email || ""),
    getLikes(user.id),
    getAdoptionRequests(user.id),
    getNotifications(user.id),
  ]);

  return {
    user,
    profile,
    likes,
    adoptionRequests,
    notifications,
  };
}