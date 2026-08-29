import { supabase } from "../lib/supabase";

/* =========================================================
   TYPES
========================================================= */

export type EventType =
  | "journee_animaux"
  | "collecte_croquettes"
  | "tombola"
  | "journee_adoption"
  | "sterilisation_solidaire"
  | "collecte_dons"
  | "evenement_association"
  | "autre";

export type EventItem = {
  id: string;

  title: string;
  event_type: EventType | string;

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

export type EventFormData = {
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
   VÉRIFICATION ADMIN
========================================================= */

async function requireAdmin() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "Vous devez être connecté pour effectuer cette action."
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const role = String(
    profile?.role || ""
  )
    .trim()
    .toLowerCase();

  if (
    role !== "admin" &&
    role !== "administrateur"
  ) {
    throw new Error(
      "Cette action est réservée à l'administration."
    );
  }

  return user;
}

/* =========================================================
   NETTOYAGE DES VALEURS
========================================================= */

function cleanText(
  value: string | null | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const cleaned =
    String(value).trim();

  return cleaned || null;
}

/* =========================================================
   ÉVÉNEMENTS PUBLIÉS
   PUBLIC / LECTURE SEULE
========================================================= */

async function getPublished() {
  const {
    data,
    error,
  } = await supabase
    .from("events")
    .select("*")
    .eq(
      "is_published",
      true
    )
    .order(
      "start_date",
      {
        ascending: true,
      }
    )
    .order(
      "start_time",
      {
        ascending: true,
        nullsFirst: false,
      }
    );

  if (error) {
    throw error;
  }

  return (
    data || []
  ) as EventItem[];
}

/* =========================================================
   ÉVÉNEMENTS À VENIR
========================================================= */

async function getUpcoming() {
  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  const {
    data,
    error,
  } = await supabase
    .from("events")
    .select("*")
    .eq(
      "is_published",
      true
    )
    .gte(
      "start_date",
      today
    )
    .order(
      "start_date",
      {
        ascending: true,
      }
    )
    .order(
      "start_time",
      {
        ascending: true,
        nullsFirst: false,
      }
    );

  if (error) {
    throw error;
  }

  return (
    data || []
  ) as EventItem[];
}

/* =========================================================
   ÉVÉNEMENTS PASSÉS
========================================================= */

async function getPast() {
  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  const {
    data,
    error,
  } = await supabase
    .from("events")
    .select("*")
    .eq(
      "is_published",
      true
    )
    .lt(
      "start_date",
      today
    )
    .order(
      "start_date",
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return (
    data || []
  ) as EventItem[];
}

/* =========================================================
   UN ÉVÉNEMENT PUBLIC
========================================================= */

async function getById(
  eventId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from("events")
    .select("*")
    .eq(
      "id",
      eventId
    )
    .eq(
      "is_published",
      true
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Événement introuvable."
    );
  }

  return data as EventItem;
}

/* =========================================================
   TOUS LES ÉVÉNEMENTS
   ADMIN UNIQUEMENT
========================================================= */

async function getAllAdmin() {
  await requireAdmin();

  const {
    data,
    error,
  } = await supabase
    .from("events")
    .select("*")
    .order(
      "start_date",
      {
        ascending: false,
      }
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
  ) as EventItem[];
}

/* =========================================================
   UN ÉVÉNEMENT ADMIN
========================================================= */

async function getByIdAdmin(
  eventId: string
) {
  await requireAdmin();

  const {
    data,
    error,
  } = await supabase
    .from("events")
    .select("*")
    .eq(
      "id",
      eventId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Événement introuvable."
    );
  }

  return data as EventItem;
}

/* =========================================================
   CRÉER UN ÉVÉNEMENT
========================================================= */

async function create(
  form: EventFormData
) {
  const user =
    await requireAdmin();

  if (
    !form.title
      .trim()
  ) {
    throw new Error(
      "Le titre de l'événement est obligatoire."
    );
  }

  if (
    !form.start_date
  ) {
    throw new Error(
      "La date de l'événement est obligatoire."
    );
  }

  const payload = {
    title:
      form.title.trim(),

    event_type:
      form.event_type ||
      "autre",

    description:
      cleanText(
        form.description
      ),

    start_date:
      form.start_date,

    end_date:
      cleanText(
        form.end_date
      ),

    start_time:
      cleanText(
        form.start_time
      ),

    end_time:
      cleanText(
        form.end_time
      ),

    location_name:
      cleanText(
        form.location_name
      ),

    island:
      cleanText(
        form.island
      ),

    city:
      cleanText(
        form.city
      ),

    address:
      cleanText(
        form.address
      ),

    organizer_name:
      cleanText(
        form.organizer_name
      ),

    contact_name:
      cleanText(
        form.contact_name
      ),

    contact_phone:
      cleanText(
        form.contact_phone
      ),

    contact_email:
      cleanText(
        form.contact_email
      ),

    external_url:
      cleanText(
        form.external_url
      ),

    image_url:
      cleanText(
        form.image_url
      ),

    is_free:
      form.is_free !==
      false,

    price_label:
      cleanText(
        form.price_label
      ),

    is_published:
      form.is_published ===
      true,

    facebook_share_enabled:
      form.facebook_share_enabled !==
      false,

    created_by:
      user.id,

    updated_at:
      new Date()
        .toISOString(),
  };

  const {
    data,
    error,
  } = await supabase
    .from("events")
    .insert(
      payload
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as EventItem;
}

/* =========================================================
   MODIFIER UN ÉVÉNEMENT
========================================================= */

async function update(
  eventId: string,
  form: Partial<EventFormData>
) {
  await requireAdmin();

  const payload: Record<
    string,
    unknown
  > = {
    updated_at:
      new Date()
        .toISOString(),
  };

  if (
    form.title !==
    undefined
  ) {
    payload.title =
      form.title.trim();
  }

  if (
    form.event_type !==
    undefined
  ) {
    payload.event_type =
      form.event_type ||
      "autre";
  }

  if (
    form.description !==
    undefined
  ) {
    payload.description =
      cleanText(
        form.description
      );
  }

  if (
    form.start_date !==
    undefined
  ) {
    payload.start_date =
      form.start_date;
  }

  if (
    form.end_date !==
    undefined
  ) {
    payload.end_date =
      cleanText(
        form.end_date
      );
  }

  if (
    form.start_time !==
    undefined
  ) {
    payload.start_time =
      cleanText(
        form.start_time
      );
  }

  if (
    form.end_time !==
    undefined
  ) {
    payload.end_time =
      cleanText(
        form.end_time
      );
  }

  if (
    form.location_name !==
    undefined
  ) {
    payload.location_name =
      cleanText(
        form.location_name
      );
  }

  if (
    form.island !==
    undefined
  ) {
    payload.island =
      cleanText(
        form.island
      );
  }

  if (
    form.city !==
    undefined
  ) {
    payload.city =
      cleanText(
        form.city
      );
  }

  if (
    form.address !==
    undefined
  ) {
    payload.address =
      cleanText(
        form.address
      );
  }

  if (
    form.organizer_name !==
    undefined
  ) {
    payload.organizer_name =
      cleanText(
        form.organizer_name
      );
  }

  if (
    form.contact_name !==
    undefined
  ) {
    payload.contact_name =
      cleanText(
        form.contact_name
      );
  }

  if (
    form.contact_phone !==
    undefined
  ) {
    payload.contact_phone =
      cleanText(
        form.contact_phone
      );
  }

  if (
    form.contact_email !==
    undefined
  ) {
    payload.contact_email =
      cleanText(
        form.contact_email
      );
  }

  if (
    form.external_url !==
    undefined
  ) {
    payload.external_url =
      cleanText(
        form.external_url
      );
  }

  if (
    form.image_url !==
    undefined
  ) {
    payload.image_url =
      cleanText(
        form.image_url
      );
  }

  if (
    form.is_free !==
    undefined
  ) {
    payload.is_free =
      form.is_free;
  }

  if (
    form.price_label !==
    undefined
  ) {
    payload.price_label =
      cleanText(
        form.price_label
      );
  }

  if (
    form.is_published !==
    undefined
  ) {
    payload.is_published =
      form.is_published;
  }

  if (
    form.facebook_share_enabled !==
    undefined
  ) {
    payload.facebook_share_enabled =
      form.facebook_share_enabled;
  }

  const {
    data,
    error,
  } = await supabase
    .from("events")
    .update(
      payload
    )
    .eq(
      "id",
      eventId
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as EventItem;
}

/* =========================================================
   PUBLIER / MASQUER
========================================================= */

async function setPublished(
  eventId: string,
  published: boolean
) {
  return update(
    eventId,
    {
      is_published:
        published,
    }
  );
}

/* =========================================================
   SUPPRIMER
========================================================= */

async function remove(
  eventId: string
) {
  await requireAdmin();

  const {
    error,
  } = await supabase
    .from("events")
    .delete()
    .eq(
      "id",
      eventId
    );

  if (error) {
    throw error;
  }

  return true;
}

/* =========================================================
   UPLOAD DE L'AFFICHE
========================================================= */

async function uploadImage(
  file: File
) {
  const user =
    await requireAdmin();

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Le fichier sélectionné doit être une image."
    );
  }

  /*
   * Limite de 8 Mo.
   */

  const maxSize =
    8 *
    1024 *
    1024;

  if (
    file.size >
    maxSize
  ) {
    throw new Error(
      "L'image ne doit pas dépasser 8 Mo."
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "jpg";

  const safeExtension =
    extension.replace(
      /[^a-z0-9]/g,
      ""
    ) || "jpg";

  const filename =
    `${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

  const path =
    `${user.id}/${filename}`;

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from(
        "event-images"
      )
      .upload(
        path,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,
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
        "event-images"
      )
      .getPublicUrl(
        path
      );

  if (
    !data.publicUrl
  ) {
    throw new Error(
      "Impossible de récupérer l'adresse de l'image."
    );
  }

  return {
    path,
    publicUrl:
      data.publicUrl,
  };
}

/* =========================================================
   SUPPRESSION IMAGE
========================================================= */

async function deleteImage(
  storagePath: string
) {
  await requireAdmin();

  if (
    !storagePath.trim()
  ) {
    return;
  }

  const {
    error,
  } =
    await supabase.storage
      .from(
        "event-images"
      )
      .remove([
        storagePath,
      ]);

  if (error) {
    throw error;
  }
}

/* =========================================================
   TYPE D'ÉVÉNEMENT
========================================================= */

function getTypeLabel(
  type: string | null | undefined
) {
  switch (type) {
    case "journee_animaux":
      return "Journée des animaux";

    case "collecte_croquettes":
      return "Collecte de croquettes";

    case "tombola":
      return "Tombola";

    case "journee_adoption":
      return "Journée adoption";

    case "sterilisation_solidaire":
      return "Stérilisation solidaire";

    case "collecte_dons":
      return "Collecte de dons";

    case "evenement_association":
      return "Événement association";

    default:
      return "Autre événement";
  }
}

/* =========================================================
   ICÔNE TYPE
========================================================= */

function getTypeIcon(
  type: string | null | undefined
) {
  switch (type) {
    case "journee_animaux":
      return "🐾";

    case "collecte_croquettes":
      return "🥫";

    case "tombola":
      return "🎟️";

    case "journee_adoption":
      return "❤️";

    case "sterilisation_solidaire":
      return "🩺";

    case "collecte_dons":
      return "💝";

    case "evenement_association":
      return "🤝";

    default:
      return "📅";
  }
}

/* =========================================================
   PARTAGE FACEBOOK
========================================================= */

function getFacebookShareUrl(
  eventId: string
) {
  const eventUrl =
    `https://www.taui-te-ora.com/evenements/${eventId}`;

  return (
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(
      eventUrl
    )
  );
}

/* =========================================================
   EXPORT
========================================================= */

export const eventService = {
  getPublished,

  getUpcoming,

  getPast,

  getById,

  getAllAdmin,

  getByIdAdmin,

  create,

  update,

  setPublished,

  delete:
    remove,

  uploadImage,

  deleteImage,

  getTypeLabel,

  getTypeIcon,

  getFacebookShareUrl,
};