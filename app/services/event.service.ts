import { supabase } from "../lib/supabase";

/* =========================================================
   TYPES
========================================================= */

export type EventItem = {
  id: string;

  title: string;
  event_type: string;
  description: string | null;

  start_date: string;
  end_date: string | null;

  start_time: string | null;
  end_time: string | null;

  location_name: string | null;
  island: string | null;
  city: string | null;
  address: string | null;

  organizer_name: string | null;

  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;

  external_url: string | null;
  image_url: string | null;

  is_free: boolean;
  price_label: string | null;

  is_published: boolean;
  facebook_share_enabled: boolean;

  created_by: string | null;

  created_at: string;
  updated_at: string;
};

export type EventInput = {
  title: string;
  event_type: string;

  description?: string | null;

  start_date: string;
  end_date?: string | null;

  start_time?: string | null;
  end_time?: string | null;

  location_name?: string | null;
  island?: string | null;
  city?: string | null;
  address?: string | null;

  organizer_name?: string | null;

  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;

  external_url?: string | null;
  image_url?: string | null;

  is_free?: boolean;
  price_label?: string | null;

  is_published?: boolean;
  facebook_share_enabled?: boolean;
};

/* =========================================================
   TYPES D'ÉVÉNEMENTS
========================================================= */

export const EVENT_TYPES = [
  {
    value: "journee_animaux",
    label: "Journée des animaux",
    icon: "🐾",
  },
  {
    value: "collecte_croquettes",
    label: "Collecte de croquettes",
    icon: "🥫",
  },
  {
    value: "tombola",
    label: "Tombola",
    icon: "🎟️",
  },
  {
    value: "journee_adoption",
    label: "Journée adoption",
    icon: "❤️",
  },
  {
    value: "sterilisation_solidaire",
    label: "Stérilisation solidaire",
    icon: "🩺",
  },
  {
    value: "collecte_dons",
    label: "Collecte de dons",
    icon: "💝",
  },
  {
    value: "evenement_association",
    label: "Événement association",
    icon: "🤝",
  },
  {
    value: "autre",
    label: "Autre",
    icon: "📅",
  },
] as const;

/* =========================================================
   OUTILS
========================================================= */

function clean(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const result = String(value).trim();

  return result || null;
}

function getTypeLabel(
  type: string | null | undefined
): string {
  const found = EVENT_TYPES.find(
    (item) => item.value === type
  );

  return found?.label || "Événement";
}

function getTypeIcon(
  type: string | null | undefined
): string {
  const found = EVENT_TYPES.find(
    (item) => item.value === type
  );

  return found?.icon || "📅";
}

/* =========================================================
   TOUS LES ÉVÉNEMENTS — ADMIN
========================================================= */

async function getAllAdmin(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erreur récupération événements admin :",
      error
    );

    throw error;
  }

  return (data || []) as EventItem[];
}

/* =========================================================
   ÉVÉNEMENTS PUBLICS
========================================================= */

async function getPublished(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("start_date", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erreur récupération événements publics :",
      error
    );

    throw error;
  }

  return (data || []) as EventItem[];
}

/* =========================================================
   UN ÉVÉNEMENT PUBLIC
========================================================= */

async function getById(
  id: string
): Promise<EventItem | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Erreur récupération événement :",
      error
    );

    throw error;
  }

  return data
    ? (data as EventItem)
    : null;
}

/* =========================================================
   UN ÉVÉNEMENT — ADMIN
========================================================= */

async function getByIdAdmin(
  id: string
): Promise<EventItem | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erreur récupération événement admin :",
      error
    );

    throw error;
  }

  return data
    ? (data as EventItem)
    : null;
}

/* =========================================================
   CRÉER
========================================================= */

async function create(
  input: EventInput
): Promise<EventItem> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "Vous devez être connecté."
    );
  }

  const payload = {
    title: input.title.trim(),

    event_type:
      input.event_type || "autre",

    description:
      clean(input.description),

    start_date:
      input.start_date,

    end_date:
      clean(input.end_date),

    start_time:
      clean(input.start_time),

    end_time:
      clean(input.end_time),

    location_name:
      clean(input.location_name),

    island:
      clean(input.island),

    city:
      clean(input.city),

    address:
      clean(input.address),

    organizer_name:
      clean(input.organizer_name),

    contact_name:
      clean(input.contact_name),

    contact_phone:
      clean(input.contact_phone),

    contact_email:
      clean(input.contact_email),

    external_url:
      clean(input.external_url),

    image_url:
      clean(input.image_url),

    is_free:
      input.is_free ?? true,

    price_label:
      clean(input.price_label),

    is_published:
      input.is_published ?? false,

    facebook_share_enabled:
      input.facebook_share_enabled ?? true,

    created_by:
      user.id,

    updated_at:
      new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Erreur création événement :",
      error
    );

    throw error;
  }

  return data as EventItem;
}

/* =========================================================
   MODIFIER
========================================================= */

async function update(
  id: string,
  input: Partial<EventInput>
): Promise<EventItem> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    payload.title = input.title.trim();
  }

  if (input.event_type !== undefined) {
    payload.event_type =
      input.event_type || "autre";
  }

  if (input.description !== undefined) {
    payload.description =
      clean(input.description);
  }

  if (input.start_date !== undefined) {
    payload.start_date =
      input.start_date;
  }

  if (input.end_date !== undefined) {
    payload.end_date =
      clean(input.end_date);
  }

  if (input.start_time !== undefined) {
    payload.start_time =
      clean(input.start_time);
  }

  if (input.end_time !== undefined) {
    payload.end_time =
      clean(input.end_time);
  }

  if (input.location_name !== undefined) {
    payload.location_name =
      clean(input.location_name);
  }

  if (input.island !== undefined) {
    payload.island =
      clean(input.island);
  }

  if (input.city !== undefined) {
    payload.city =
      clean(input.city);
  }

  if (input.address !== undefined) {
    payload.address =
      clean(input.address);
  }

  if (input.organizer_name !== undefined) {
    payload.organizer_name =
      clean(input.organizer_name);
  }

  if (input.contact_name !== undefined) {
    payload.contact_name =
      clean(input.contact_name);
  }

  if (input.contact_phone !== undefined) {
    payload.contact_phone =
      clean(input.contact_phone);
  }

  if (input.contact_email !== undefined) {
    payload.contact_email =
      clean(input.contact_email);
  }

  if (input.external_url !== undefined) {
    payload.external_url =
      clean(input.external_url);
  }

  if (input.image_url !== undefined) {
    payload.image_url =
      clean(input.image_url);
  }

  if (input.is_free !== undefined) {
    payload.is_free =
      input.is_free;
  }

  if (input.price_label !== undefined) {
    payload.price_label =
      clean(input.price_label);
  }

  if (input.is_published !== undefined) {
    payload.is_published =
      input.is_published;
  }

  if (
    input.facebook_share_enabled !== undefined
  ) {
    payload.facebook_share_enabled =
      input.facebook_share_enabled;
  }

  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Erreur modification événement :",
      error
    );

    throw error;
  }

  return data as EventItem;
}

/* =========================================================
   PUBLIER / MASQUER
========================================================= */

async function setPublished(
  id: string,
  isPublished: boolean
): Promise<EventItem> {
  const { data, error } = await supabase
    .from("events")
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Erreur publication événement :",
      error
    );

    throw error;
  }

  return data as EventItem;
}

/* =========================================================
   SUPPRIMER
========================================================= */

async function deleteEvent(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Erreur suppression événement :",
      error
    );

    throw error;
  }
}

/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadImage(
  file: File
): Promise<{
  publicUrl: string;
  path: string;
}> {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Format d'image non autorisé."
    );
  }

  const maxSize =
    8 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error(
      "L'image ne doit pas dépasser 8 Mo."
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg";

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

  const path =
    `events/${fileName}`;

  const { error } = await supabase.storage
    .from("event-images")
    .upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      }
    );

  if (error) {
    console.error(
      "Erreur upload image événement :",
      error
    );

    throw error;
  }

  const { data } = supabase.storage
    .from("event-images")
    .getPublicUrl(path);

  return {
    publicUrl:
      data.publicUrl,

    path,
  };
}

/* =========================================================
   SUPPRIMER IMAGE
========================================================= */

async function deleteImage(
  path: string
): Promise<void> {
  if (!path) {
    return;
  }

  const { error } = await supabase.storage
    .from("event-images")
    .remove([path]);

  if (error) {
    console.error(
      "Erreur suppression image événement :",
      error
    );

    throw error;
  }
}

/* =========================================================
   FACEBOOK
========================================================= */

function getFacebookShareUrl(
  eventId: string
): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.taui-te-ora.com";

  const eventUrl =
    `${baseUrl}/evenements/${encodeURIComponent(
      eventId
    )}`;

  return (
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(eventUrl)
  );
}

/* =========================================================
   EXPORT SERVICE
========================================================= */

export const eventService = {
  getAllAdmin,
  getPublished,

  getById,
  getByIdAdmin,

  create,
  update,

  setPublished,

  delete: deleteEvent,

  uploadImage,
  deleteImage,

  getTypeLabel,
  getTypeIcon,

  getFacebookShareUrl,
};