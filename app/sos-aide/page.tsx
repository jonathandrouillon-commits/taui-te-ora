"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Archive,
  Camera,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type HelpType =
  | "famille_accueil"
  | "transport"
  | "capture"
  | "nourriture_materiel"
  | "veterinaire"
  | "benevolat";

type Urgency = "normale" | "urgente" | "critique";
type SosStatus = "ouvert" | "en_cours" | "cloture";

type FosterSize = "" | "small" | "medium" | "large";
type FosterAge = "" | "puppy" | "young" | "adult" | "senior";
type FosterSex = "" | "male" | "female";
type FosterDuration =
  | ""
  | "emergency"
  | "days"
  | "week"
  | "weeks"
  | "months"
  | "until_adoption";

type HelpSos = {
  id: string;
  created_by: string;
  title: string;
  help_type: HelpType;
  island: string;
  city: string | null;
  message: string;
  urgency: Urgency;
  status: SosStatus;
  animal_id: string | null;
  animal_type?: string | null;
  animals_count?: number | null;
  push_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  photo_url?: string | null;
  archived_at?: string | null;
  companion_id?: string | null;
  adoption_animal_id?: string | null;
  facebook_shared_at?: string | null;
  facebook_post_id?: string | null;
  facebook_share_status?: string | null;

  foster_size?: FosterSize | null;
  foster_age?: FosterAge | null;
  foster_sex?: FosterSex | null;
  foster_temperament_calm?: boolean | null;
  foster_temperament_social?: boolean | null;
  foster_temperament_shy?: boolean | null;
  foster_temperament_active?: boolean | null;
  foster_reactive?: boolean | null;
  foster_medical?: boolean | null;
  foster_recovery?: boolean | null;
  foster_disabled?: boolean | null;
  foster_special_needs?: boolean | null;
  foster_requires_garden?: boolean | null;
  foster_requires_fenced_garden?: boolean | null;
  foster_requires_isolation?: boolean | null;
  foster_requires_medication?: boolean | null;
  foster_max_hours_alone?: number | null;
  foster_required_duration?: FosterDuration | null;
};

type AnimalSource = "manual" | "companion" | "adoption";
type SelectableAnimal = { id: string; name: string; species?: string | null; breed?: string | null; sex?: string | null; photo_url?: string | null; };

type MatchingHelper = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  organization_name?: string | null;
  phone?: string | null;
  email?: string | null;
  island?: string | null;
  city?: string | null;
  help_notes?: string | null;
  foster_capacity?: number | null;
  foster_duration?: string | null;
  foster_accepts_dogs?: boolean | null;
  foster_accepts_cats?: boolean | null;
  help_has_transport?: boolean | null;

  foster_size_small?: boolean | null;
  foster_size_medium?: boolean | null;
  foster_size_large?: boolean | null;

  foster_age_puppy?: boolean | null;
  foster_age_young?: boolean | null;
  foster_age_adult?: boolean | null;
  foster_age_senior?: boolean | null;

  foster_accepts_male?: boolean | null;
  foster_accepts_female?: boolean | null;

  foster_temperament_calm?: boolean | null;
  foster_temperament_social?: boolean | null;
  foster_temperament_shy?: boolean | null;
  foster_temperament_active?: boolean | null;
  foster_accepts_reactive?: boolean | null;

  foster_accepts_medical?: boolean | null;
  foster_accepts_recovery?: boolean | null;
  foster_accepts_disabled?: boolean | null;
  foster_accepts_special_needs?: boolean | null;

  foster_has_garden?: boolean | null;
  foster_garden_fenced?: boolean | null;
  foster_can_isolate?: boolean | null;
  foster_can_medicate?: boolean | null;

  foster_hours_alone?: number | null;
};

const HELP_TYPES: Array<{
  value: HelpType;
  label: string;
  icon: string;
}> = [
  { value: "famille_accueil", label: "Famille d’accueil", icon: "🏠" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "capture", label: "Capture / sauvetage", icon: "🛟" },
  { value: "nourriture_materiel", label: "Nourriture / matériel", icon: "🥣" },
  { value: "veterinaire", label: "Accompagnement vétérinaire", icon: "🩺" },
  { value: "benevolat", label: "Bénévolat", icon: "🤝" },
];

const EMPTY_FORM = {
  title: "",
  help_type: "famille_accueil" as HelpType,
  island: "",
  city: "",
  message: "",
  urgency: "urgente" as Urgency,

  animal_type: "chien",
  animals_count: 1,

  foster_size: "" as FosterSize,
  foster_age: "" as FosterAge,
  foster_sex: "" as FosterSex,

  foster_temperament_calm: false,
  foster_temperament_social: false,
  foster_temperament_shy: false,
  foster_temperament_active: false,
  foster_reactive: false,

  foster_medical: false,
  foster_recovery: false,
  foster_disabled: false,
  foster_special_needs: false,

  foster_requires_garden: false,
  foster_requires_fenced_garden: false,
  foster_requires_isolation: false,
  foster_requires_medication: false,

  foster_max_hours_alone: "" as number | "",
  foster_required_duration: "" as FosterDuration,
  animal_source: "manual" as AnimalSource,
  companion_id: "",
  adoption_animal_id: "",
  photo_url: "",
};

function helpTypeLabel(value: HelpType) {
  return HELP_TYPES.find((item) => item.value === value)?.label || value;
}

function helpTypeIcon(value: HelpType) {
  return HELP_TYPES.find((item) => item.value === value)?.icon || "🤝";
}

function urgencyClasses(value: Urgency) {
  if (value === "critique") return "bg-red-100 text-red-700";
  if (value === "urgente") return "bg-amber-100 text-amber-800";
  return "bg-[#e7f3ef] text-[#064b42]";
}

function statusLabel(value: SosStatus) {
  if (value === "en_cours") return "En cours";
  if (value === "cloture") return "Clôturé";
  return "Ouvert";
}


function getSosPublicUrl(
  sosId: string
) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.taui-te-ora.com";

  return `${baseUrl}/sos-aide/${encodeURIComponent(
    sosId
  )}`;
}

function getSosFacebookShareUrl(
  sosId: string
) {
  const sosUrl =
    getSosPublicUrl(
      sosId
    );

  return (
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(
      sosUrl
    )
  );
}

function getSosWhatsappShareUrl(
  item: HelpSos
) {
  const sosUrl =
    getSosPublicUrl(
      item.id
    );

  const text =
    `🚨 SOS TAUI TE ORA\n${item.title}\n📍 ${[item.city, item.island]
      .filter(Boolean)
      .join(" · ")}\n${sosUrl}`;

  return (
    "https://wa.me/?text=" +
    encodeURIComponent(
      text
    )
  );
}


const FOSTER_SIZES: Array<{ value: FosterSize; label: string }> = [
  { value: "", label: "Sans préférence" },
  { value: "small", label: "Petit" },
  { value: "medium", label: "Moyen" },
  { value: "large", label: "Grand" },
];

const FOSTER_AGES: Array<{ value: FosterAge; label: string }> = [
  { value: "", label: "Sans préférence" },
  { value: "puppy", label: "Chiot / chaton" },
  { value: "young", label: "Jeune" },
  { value: "adult", label: "Adulte" },
  { value: "senior", label: "Senior" },
];

const FOSTER_SEXES: Array<{ value: FosterSex; label: string }> = [
  { value: "", label: "Sans préférence" },
  { value: "male", label: "Mâle" },
  { value: "female", label: "Femelle" },
];

const FOSTER_DURATIONS: Array<{
  value: FosterDuration;
  label: string;
}> = [
  { value: "", label: "Non précisée" },
  { value: "emergency", label: "Urgence 24 / 48 h" },
  { value: "days", label: "Quelques jours" },
  { value: "week", label: "1 semaine" },
  { value: "weeks", label: "Plusieurs semaines" },
  { value: "months", label: "Plusieurs mois" },
  { value: "until_adoption", label: "Jusqu'à adoption" },
];

export default function HelpSosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sosList, setSosList] = useState<HelpSos[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SosStatus>("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [matchingHelpers, setMatchingHelpers] = useState<Record<string, MatchingHelper[]>>({});
  const [matchingLoading, setMatchingLoading] = useState<Record<string, boolean>>({});
  const [expandedMatching, setExpandedMatching] = useState<string | null>(null);
  const [notifying, setNotifying] = useState<Record<string, boolean>>({});
  const [notificationResults, setNotificationResults] = useState<
    Record<string, string>
  >({});
  const [companions, setCompanions] = useState<SelectableAnimal[]>([]);
  const [adoptionAnimals, setAdoptionAnimals] = useState<SelectableAnimal[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [shareOnFacebook, setShareOnFacebook] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/sos-aide");
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const role = String(profile?.role || "").trim().toLowerCase();

      if (!["admin", "administrateur", "association", "refuge", "fourriere", "benevole"].includes(role)) {
        router.replace("/");
        return;
      }

      setIsAdmin(role === "admin" || role === "administrateur");

      const [companionsResult, adoptionResult] = await Promise.all([
        supabase.from("companions").select("id, name, species, breed, sex, photo_url").eq("owner_id", user.id).eq("is_deceased", false),
        supabase.from("animals").select("id, animal_name, animal_type, breed, sex, owner_id, is_adopted, status, is_published, animal_photos(photo_url, is_cover, sort_order)").eq("owner_id", user.id),
      ]);
      if (!companionsResult.error) setCompanions((companionsResult.data || []) as SelectableAnimal[]);
      if (!adoptionResult.error) {
        const active = (adoptionResult.data || []).filter((a: any) => !a.is_adopted && String(a.status || "").toLowerCase() !== "archive");
        setAdoptionAnimals(
          active.map((a: any) => {
            const photos = Array.isArray(a.animal_photos)
              ? [...a.animal_photos].sort((left: any, right: any) => {
                  if (Boolean(left?.is_cover) !== Boolean(right?.is_cover)) {
                    return left?.is_cover ? -1 : 1;
                  }
                  return Number(left?.sort_order || 0) - Number(right?.sort_order || 0);
                })
              : [];

            return {
              id: a.id,
              name: a.animal_name || "Animal sans nom",
              species: a.animal_type || null,
              breed: a.breed || null,
              sex: a.sex || null,
              photo_url: photos[0]?.photo_url || null,
            };
          })
        );
      }

      const { data, error: listError } = await supabase
        .from("help_sos")
        .select(
          "id, created_by, title, help_type, island, city, message, urgency, status, animal_id, animal_type, animals_count, push_sent_at, created_at, updated_at, closed_at, photo_url, archived_at, companion_id, adoption_animal_id, facebook_shared_at, facebook_post_id, facebook_share_status, foster_size, foster_age, foster_sex, foster_temperament_calm, foster_temperament_social, foster_temperament_shy, foster_temperament_active, foster_reactive, foster_medical, foster_recovery, foster_disabled, foster_special_needs, foster_requires_garden, foster_requires_fenced_garden, foster_requires_isolation, foster_requires_medication, foster_max_hours_alone, foster_required_duration"
        )
        .order("created_at", { ascending: false });

      if (listError) throw listError;

      setSosList((data || []) as HelpSos[]);
    } catch (caught) {
      console.error("Chargement SOS aide :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de charger les SOS."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void load();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [load]);

  async function createSos(event: FormEvent) {
    event.preventDefault();

    if (!currentUserId) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.title.trim()) {
        throw new Error("Indiquez un titre.");
      }

      if (!form.island.trim()) {
        throw new Error("Indiquez l’île concernée.");
      }

      if (!form.message.trim()) {
        throw new Error("Décrivez le besoin.");
      }

      if (
        form.animal_source === "companion" &&
        !form.companion_id
      ) {
        throw new Error("Sélectionnez le compagnon concerné.");
      }

      if (
        form.animal_source === "adoption" &&
        !form.adoption_animal_id
      ) {
        throw new Error("Sélectionnez l’animal en adoption concerné.");
      }

      if (form.help_type === "famille_accueil") {
        if (!form.animal_type.trim()) {
          throw new Error("Indiquez le type d'animal à accueillir.");
        }

        if (Number(form.animals_count || 0) < 1) {
          throw new Error("Indiquez au moins un animal.");
        }
      }

      /*
       * IMPORTANT : on crée d'abord le SOS en base.
       * Ainsi une erreur d'upload photo ou Facebook
       * ne peut plus empêcher la création du SOS.
       *
       * animals_count reste toujours >= 1 car cette
       * colonne peut être NOT NULL dans Supabase.
       */
      const {
        data: created,
        error: insertError,
      } = await supabase
        .from("help_sos")
        .insert({
          created_by: currentUserId,
          title: form.title.trim(),
          help_type: form.help_type,
          island: form.island.trim(),
          city: form.city.trim() || null,
          message: form.message.trim(),
          urgency: form.urgency,
          status: "ouvert",

          photo_url:
            form.photo_url || null,

          companion_id:
            form.animal_source === "companion"
              ? form.companion_id || null
              : null,

          adoption_animal_id:
            form.animal_source === "adoption"
              ? form.adoption_animal_id || null
              : null,

          animal_id:
            form.animal_source === "adoption"
              ? form.adoption_animal_id || null
              : null,

          animal_type:
            form.help_type === "famille_accueil"
              ? form.animal_type.trim() || null
              : form.animal_type.trim() || null,

          animals_count:
            Math.max(
              1,
              Number(form.animals_count || 1)
            ),

          foster_size:
            form.help_type === "famille_accueil" && form.foster_size
              ? form.foster_size
              : null,

          foster_age:
            form.help_type === "famille_accueil" && form.foster_age
              ? form.foster_age
              : null,

          foster_sex:
            form.help_type === "famille_accueil" && form.foster_sex
              ? form.foster_sex
              : null,

          foster_temperament_calm:
            form.help_type === "famille_accueil"
              ? form.foster_temperament_calm
              : null,

          foster_temperament_social:
            form.help_type === "famille_accueil"
              ? form.foster_temperament_social
              : null,

          foster_temperament_shy:
            form.help_type === "famille_accueil"
              ? form.foster_temperament_shy
              : null,

          foster_temperament_active:
            form.help_type === "famille_accueil"
              ? form.foster_temperament_active
              : null,

          foster_reactive:
            form.help_type === "famille_accueil"
              ? form.foster_reactive
              : null,

          foster_medical:
            form.help_type === "famille_accueil"
              ? form.foster_medical
              : null,

          foster_recovery:
            form.help_type === "famille_accueil"
              ? form.foster_recovery
              : null,

          foster_disabled:
            form.help_type === "famille_accueil"
              ? form.foster_disabled
              : null,

          foster_special_needs:
            form.help_type === "famille_accueil"
              ? form.foster_special_needs
              : null,

          foster_requires_garden:
            form.help_type === "famille_accueil"
              ? form.foster_requires_garden
              : null,

          foster_requires_fenced_garden:
            form.help_type === "famille_accueil"
              ? form.foster_requires_fenced_garden
              : null,

          foster_requires_isolation:
            form.help_type === "famille_accueil"
              ? form.foster_requires_isolation
              : null,

          foster_requires_medication:
            form.help_type === "famille_accueil"
              ? form.foster_requires_medication
              : null,

          foster_max_hours_alone:
            form.help_type === "famille_accueil" &&
            form.foster_max_hours_alone !== ""
              ? Number(form.foster_max_hours_alone)
              : null,

          foster_required_duration:
            form.help_type === "famille_accueil" &&
            form.foster_required_duration
              ? form.foster_required_duration
              : null,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("INSERT HELP_SOS :", insertError);
        throw new Error(
          `Impossible de créer le SOS : ${insertError.message}`
        );
      }

      if (!created?.id) {
        throw new Error(
          "Le SOS a été créé mais son identifiant est introuvable."
        );
      }

      let finalPhotoUrl = form.photo_url || null;
      let photoWarning = "";

      /*
       * Upload photo APRES création.
       * Si l'upload échoue, le SOS reste créé.
       */
      if (photoFile) {
        try {
          const extension =
            photoFile.name.split(".").pop()?.toLowerCase() || "jpg";

          const storagePath =
            `${currentUserId}/${created.id}/${crypto.randomUUID()}.${extension}`;

          const {
            error: uploadError,
          } = await supabase.storage
            .from("sos-media")
            .upload(
              storagePath,
              photoFile,
              {
                upsert: false,
                contentType: photoFile.type || undefined,
              }
            );

          if (uploadError) {
            throw uploadError;
          }

          finalPhotoUrl =
            supabase.storage
              .from("sos-media")
              .getPublicUrl(storagePath)
              .data.publicUrl;

          const {
            error: photoUpdateError,
          } = await supabase
            .from("help_sos")
            .update({
              photo_url: finalPhotoUrl,
            })
            .eq("id", created.id);

          if (photoUpdateError) {
            throw photoUpdateError;
          }
        } catch (photoError) {
          console.error(
            "PHOTO SOS :",
            photoError
          );

          photoWarning =
            " Le SOS est créé, mais la photo n’a pas pu être enregistrée.";
        }
      }

      /*
       * Publication automatique Les Veilleurs de Kali.
       * Elle est volontairement non bloquante.
       */
      try {
        const {
          data: sessionData,
        } = await supabase.auth.getSession();

        const accessToken =
          sessionData.session?.access_token;

        if (accessToken) {
          const publishResponse = await fetch(
            "/api/facebook/publish-sos",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                sosId: created.id,
              }),
            }
          );

          if (!publishResponse.ok) {
            const publishResult = await publishResponse
              .json()
              .catch(() => null);

            console.error(
              "Publication Facebook SOS :",
              publishResult
            );
          }
        }
      } catch (facebookError) {
        console.error(
          "Publication Facebook SOS :",
          facebookError
        );
      }

      const createdId = created.id;

      setForm(EMPTY_FORM);
      setPhotoFile(null);
      setCreating(false);

      setMessage(
        `SOS créé avec succès.${photoWarning}`
      );

      await load();

      /*
       * Le partage personnel ne se déclenche qu'APRES
       * la création réussie du SOS.
       * S'il est bloqué par le navigateur, cela n'a
       * aucun impact sur le SOS déjà enregistré.
       */
      if (shareOnFacebook) {
        const facebookShareUrl =
          getSosFacebookShareUrl(
            createdId
          );

        window.open(
          facebookShareUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }
    } catch (caught) {
      console.error(
        "Création SOS :",
        caught
      );

      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de créer le SOS."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: HelpSos) {
    const source: AnimalSource = item.companion_id
      ? "companion"
      : item.adoption_animal_id
        ? "adoption"
        : "manual";

    setEditingId(item.id);
    setCreating(true);
    setPhotoFile(null);
    setError("");
    setMessage("");

    setForm({
      ...EMPTY_FORM,
      title: item.title || "",
      help_type: item.help_type,
      island: item.island || "",
      city: item.city || "",
      message: item.message || "",
      urgency: item.urgency,
      animal_type: item.animal_type || "chien",
      animals_count: Math.max(1, Number(item.animals_count || 1)),
      foster_size: (item.foster_size || "") as FosterSize,
      foster_age: (item.foster_age || "") as FosterAge,
      foster_sex: (item.foster_sex || "") as FosterSex,
      foster_temperament_calm: Boolean(item.foster_temperament_calm),
      foster_temperament_social: Boolean(item.foster_temperament_social),
      foster_temperament_shy: Boolean(item.foster_temperament_shy),
      foster_temperament_active: Boolean(item.foster_temperament_active),
      foster_reactive: Boolean(item.foster_reactive),
      foster_medical: Boolean(item.foster_medical),
      foster_recovery: Boolean(item.foster_recovery),
      foster_disabled: Boolean(item.foster_disabled),
      foster_special_needs: Boolean(item.foster_special_needs),
      foster_requires_garden: Boolean(item.foster_requires_garden),
      foster_requires_fenced_garden: Boolean(item.foster_requires_fenced_garden),
      foster_requires_isolation: Boolean(item.foster_requires_isolation),
      foster_requires_medication: Boolean(item.foster_requires_medication),
      foster_max_hours_alone:
        item.foster_max_hours_alone == null
          ? ""
          : Number(item.foster_max_hours_alone),
      foster_required_duration:
        (item.foster_required_duration || "") as FosterDuration,
      animal_source: source,
      companion_id: item.companion_id || "",
      adoption_animal_id: item.adoption_animal_id || "",
      photo_url: item.photo_url || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();

    if (!editingId || !currentUserId) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.title.trim()) throw new Error("Indiquez un titre.");
      if (!form.island.trim()) throw new Error("Indiquez l’île concernée.");
      if (!form.message.trim()) throw new Error("Décrivez le besoin.");

      if (form.animal_source === "companion" && !form.companion_id) {
        throw new Error("Sélectionnez le compagnon concerné.");
      }

      if (form.animal_source === "adoption" && !form.adoption_animal_id) {
        throw new Error("Sélectionnez l’animal en adoption concerné.");
      }

      let finalPhotoUrl = form.photo_url || null;

      if (photoFile) {
        const extension =
          photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath =
          `${currentUserId}/${editingId}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("sos-media")
          .upload(storagePath, photoFile, {
            upsert: false,
            contentType: photoFile.type || undefined,
          });

        if (uploadError) throw uploadError;

        finalPhotoUrl = supabase.storage
          .from("sos-media")
          .getPublicUrl(storagePath).data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("help_sos")
        .update({
          title: form.title.trim(),
          help_type: form.help_type,
          island: form.island.trim(),
          city: form.city.trim() || null,
          message: form.message.trim(),
          urgency: form.urgency,
          photo_url: finalPhotoUrl,
          companion_id:
            form.animal_source === "companion"
              ? form.companion_id || null
              : null,
          adoption_animal_id:
            form.animal_source === "adoption"
              ? form.adoption_animal_id || null
              : null,
          animal_id:
            form.animal_source === "adoption"
              ? form.adoption_animal_id || null
              : null,
          animal_type: form.animal_type.trim() || null,
          animals_count: Math.max(1, Number(form.animals_count || 1)),
          foster_size:
            form.help_type === "famille_accueil" && form.foster_size
              ? form.foster_size
              : null,
          foster_age:
            form.help_type === "famille_accueil" && form.foster_age
              ? form.foster_age
              : null,
          foster_sex:
            form.help_type === "famille_accueil" && form.foster_sex
              ? form.foster_sex
              : null,
          foster_temperament_calm:
            form.help_type === "famille_accueil"
              ? form.foster_temperament_calm
              : null,
          foster_temperament_social:
            form.help_type === "famille_accueil"
              ? form.foster_temperament_social
              : null,
          foster_temperament_shy:
            form.help_type === "famille_accueil"
              ? form.foster_temperament_shy
              : null,
          foster_temperament_active:
            form.help_type === "famille_accueil"
              ? form.foster_temperament_active
              : null,
          foster_reactive:
            form.help_type === "famille_accueil"
              ? form.foster_reactive
              : null,
          foster_medical:
            form.help_type === "famille_accueil" ? form.foster_medical : null,
          foster_recovery:
            form.help_type === "famille_accueil" ? form.foster_recovery : null,
          foster_disabled:
            form.help_type === "famille_accueil" ? form.foster_disabled : null,
          foster_special_needs:
            form.help_type === "famille_accueil"
              ? form.foster_special_needs
              : null,
          foster_requires_garden:
            form.help_type === "famille_accueil"
              ? form.foster_requires_garden
              : null,
          foster_requires_fenced_garden:
            form.help_type === "famille_accueil"
              ? form.foster_requires_fenced_garden
              : null,
          foster_requires_isolation:
            form.help_type === "famille_accueil"
              ? form.foster_requires_isolation
              : null,
          foster_requires_medication:
            form.help_type === "famille_accueil"
              ? form.foster_requires_medication
              : null,
          foster_max_hours_alone:
            form.help_type === "famille_accueil" &&
            form.foster_max_hours_alone !== ""
              ? Number(form.foster_max_hours_alone)
              : null,
          foster_required_duration:
            form.help_type === "famille_accueil" && form.foster_required_duration
              ? form.foster_required_duration
              : null,
        })
        .eq("id", editingId);

      if (updateError) throw updateError;

      setEditingId(null);
      setCreating(false);
      setPhotoFile(null);
      setForm(EMPTY_FORM);
      setMessage("SOS modifié avec succès.");
      await load();
    } catch (caught) {
      console.error("Modification SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de modifier le SOS."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(item: HelpSos) {
    try {
      setError("");
      setMessage("");

      const archived = Boolean(item.archived_at);
      const { error: archiveError } = await supabase
        .from("help_sos")
        .update({ archived_at: archived ? null : new Date().toISOString() })
        .eq("id", item.id);

      if (archiveError) throw archiveError;

      setMessage(archived ? "SOS réactivé." : "SOS archivé.");
      await load();
    } catch (caught) {
      console.error("Archivage SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de modifier l’archive du SOS."
      );
    }
  }

  async function deleteSos(item: HelpSos) {
    const confirmed = window.confirm(
      `Supprimer définitivement le SOS « ${item.title} » ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const { error: deleteError } = await supabase
        .from("help_sos")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      setMessage("SOS supprimé définitivement.");
      await load();
    } catch (caught) {
      console.error("Suppression SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de supprimer le SOS."
      );
    }
  }

  async function updateStatus(item: HelpSos, status: SosStatus) {
    try {
      setError("");
      setMessage("");

      const { error: updateError } = await supabase
        .from("help_sos")
        .update({ status })
        .eq("id", item.id);

      if (updateError) throw updateError;

      setMessage(
        status === "cloture"
          ? "SOS clôturé."
          : status === "en_cours"
            ? "SOS passé en cours."
            : "SOS rouvert."
      );

      await load();
    } catch (caught) {
      console.error("Mise à jour SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de mettre à jour le SOS."
      );
    }
  }

  async function loadMatchingHelpers(item: HelpSos) {
    if (expandedMatching === item.id) {
      setExpandedMatching(null);
      return;
    }

    setExpandedMatching(item.id);

    if (matchingHelpers[item.id]) return;

    try {
      setMatchingLoading((current) => ({ ...current, [item.id]: true }));
      setError("");

      const { data, error: matchingError } = await supabase.rpc(
        "get_matching_helpers_for_sos",
        { p_sos_id: item.id }
      );

      if (matchingError) throw matchingError;

      setMatchingHelpers((current) => ({
        ...current,
        [item.id]: (data || []) as MatchingHelper[],
      }));
    } catch (caught) {
      console.error("Matching SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de rechercher les personnes compatibles."
      );
    } finally {
      setMatchingLoading((current) => ({ ...current, [item.id]: false }));
    }
  }

  async function notifyMatchingHelpers(item: HelpSos) {
    try {
      setNotifying((current) => ({ ...current, [item.id]: true }));
      setError("");
      setMessage("");

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Votre session a expiré. Reconnectez-vous.");
      }

      const response = await fetch("/api/push/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sosId: item.id,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Impossible d’envoyer les notifications SOS."
        );
      }

      let resultMessage = "";

      if (result?.alreadySent) {
        resultMessage = "Les personnes compatibles ont déjà été notifiées.";
      } else if (Number(result?.matched || 0) === 0) {
        resultMessage = "Aucune personne compatible à notifier pour le moment.";
      } else {
        const matched = Number(result?.matched || 0);
        const sent = Number(result?.sent || 0);

        resultMessage =
          `${matched} personne${matched > 1 ? "s" : ""} ciblée${
            matched > 1 ? "s" : ""
          } · ${sent} notification${sent > 1 ? "s" : ""} envoyée${
            sent > 1 ? "s" : ""
          }.`;
      }

      setNotificationResults((current) => ({
        ...current,
        [item.id]: resultMessage,
      }));

      setMessage(resultMessage);
      await load();
    } catch (caught) {
      console.error("Notification SOS :", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible d’envoyer les notifications SOS."
      );
    } finally {
      setNotifying((current) => ({ ...current, [item.id]: false }));
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sosList.filter((item) => {
      if (showArchived ? !item.archived_at : Boolean(item.archived_at)) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return [
        item.title,
        item.island,
        item.city,
        item.message,
        helpTypeLabel(item.help_type),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [sosList, search, statusFilter, showArchived]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ef]">
        <p className="font-black text-[#064b42]">Chargement des SOS...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 pb-28 pt-24 sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[30px] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <ShieldAlert size={30} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
                  TAUI TE ORA
                </p>

                <h1 className="mt-1 text-3xl font-black text-[#064b42] sm:text-4xl">
                  SOS réseau d’aide
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#756d67]">
                  Créez un besoin ciblé pour une famille d’accueil, un transport,
                  une capture, du matériel, un accompagnement vétérinaire ou du bénévolat.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowArchived((v) => !v)} className="rounded-full border border-[#064b42] px-5 py-3 font-black text-[#064b42]">{showArchived ? "Voir les SOS actifs" : "Archives"}</button>
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setPhotoFile(null); setCreating(true); }}
              className="flex items-center justify-center gap-2 rounded-full bg-[#df8995] px-6 py-3 font-black text-white shadow-md"
            >
              <Plus size={19} />
              Créer un SOS
            </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un SOS..."
                className="w-full rounded-2xl border border-[#e5ddd5] bg-white py-3 pl-11 pr-4 outline-none focus:border-[#064b42]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | SosStatus)
              }
              className="rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
            >
              <option value="all">Tous les statuts</option>
              <option value="ouvert">Ouverts</option>
              <option value="en_cours">En cours</option>
              <option value="cloture">Clôturés</option>
            </select>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-green-50 p-4 font-semibold text-green-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {creating ? (
          <section className="mt-6 rounded-[30px] bg-white p-6 shadow-lg sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#064b42]">
                  {editingId ? "Modifier le SOS" : "Nouveau SOS"}
                </h2>
                <p className="mt-1 text-sm text-[#756d67]">
                  Après publication, TAUI TE ORA pourra rechercher les personnes compatibles avec ce SOS.
                </p>
              </div>

              <button
                type="button"
                onClick={() => { setCreating(false); setEditingId(null); setForm(EMPTY_FORM); setPhotoFile(null); }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4ec] text-[#064b42]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editingId ? saveEdit : createSos} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Titre *
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Ex. Famille d’accueil urgente pour 3 chiots"
                    className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Type d’aide *
                  </span>
                  <select
                    value={form.help_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        help_type: event.target.value as HelpType,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3 font-bold text-[#064b42]"
                  >
                    {HELP_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.icon} {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Île *
                  </span>
                  <input
                    value={form.island}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        island: event.target.value,
                      }))
                    }
                    placeholder="Ex. Tahiti"
                    className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Commune
                  </span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    placeholder="Ex. Punaauia"
                    className="w-full rounded-2xl border border-[#e5ddd5] px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>
              </div>

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Niveau d’urgence
                </span>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(["normale", "urgente", "critique"] as Urgency[]).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            urgency: value,
                          }))
                        }
                        className={`rounded-2xl border-2 px-4 py-4 font-black capitalize ${
                          form.urgency === value
                            ? value === "critique"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : value === "urgente"
                                ? "border-amber-500 bg-amber-50 text-amber-800"
                                : "border-[#064b42] bg-[#eef7f4] text-[#064b42]"
                            : "border-[#eee5dc] bg-white text-[#756d67]"
                        }`}
                      >
                        {value}
                      </button>
                    )
                  )}
                </div>
              </label>

              <section className="rounded-[26px] border border-[#eadfd8] bg-[#fffaf5] p-5 sm:p-6">
                <h3 className="text-xl font-black text-[#064b42]">🐾 Animal concerné</h3>
                <p className="mt-1 text-sm text-[#756d67]">Choisissez uniquement un animal que vous gérez, ou renseignez un animal non enregistré.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {([['companion','🐾 Mon compagnon'],['adoption','❤️ Animal en adoption'],['manual','➕ Animal non enregistré']] as const).map(([value,label]) => (
                    <button key={value} type="button" onClick={() => setForm((c) => ({...c, animal_source:value, companion_id:value==='companion'?c.companion_id:'', adoption_animal_id:value==='adoption'?c.adoption_animal_id:''}))} className={`rounded-2xl border-2 px-4 py-3 font-black ${form.animal_source===value?'border-[#df8995] bg-[#fce8ec] text-[#064b42]':'border-[#eee5dc] bg-white text-[#756d67]'}`}>{label}</button>
                  ))}
                </div>
                {form.animal_source === 'companion' ? <select value={form.companion_id} onChange={(e)=>{ const a=companions.find(x=>x.id===e.target.value); setForm(c=>({...c, companion_id:e.target.value, animal_type:a?.species||c.animal_type, photo_url:a?.photo_url||c.photo_url})); }} className="mt-4 w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"><option value="">Sélectionner un compagnon</option>{companions.map(a=><option key={a.id} value={a.id}>{a.name}{a.species?` · ${a.species}`:''}</option>)}</select> : null}
                {form.animal_source === 'adoption' ? <select value={form.adoption_animal_id} onChange={(e)=>{ const a=adoptionAnimals.find(x=>x.id===e.target.value); setForm(c=>({...c, adoption_animal_id:e.target.value, animal_type:a?.species||c.animal_type})); }} className="mt-4 w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"><option value="">Sélectionner un animal en adoption</option>{adoptionAnimals.map(a=><option key={a.id} value={a.id}>{a.name}{a.species?` · ${a.species}`:''}</option>)}</select> : null}
                <label className="mt-4 block"><span className="mb-2 block text-sm font-black text-[#064b42]"><Camera size={16} className="mr-1 inline"/>Photo de l'animal</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e)=>setPhotoFile(e.target.files?.[0]||null)} className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3" /></label>
                {(photoFile || form.photo_url) ? <img src={photoFile ? URL.createObjectURL(photoFile) : form.photo_url} alt="Animal du SOS" className="mt-4 h-44 w-full rounded-2xl object-cover sm:w-72"/> : null}
              </section>

              {form.help_type === "famille_accueil" ? (
                <section className="rounded-[26px] border border-[#eadfd8] bg-[#fffaf5] p-5 sm:p-6">
                  <div>
                    <h3 className="text-xl font-black text-[#064b42]">
                      🏠 Critères de la famille d'accueil
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#756d67]">
                      Plus ces informations sont précises, plus Taui Te Ora pourra
                      proposer des familles réellement adaptées à l'animal.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Type d'animal *
                      </span>

                      <select
                        value={form.animal_type}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            animal_type: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
                      >
                        <option value="chien">🐶 Chien</option>
                        <option value="chat">🐱 Chat</option>
                        <option value="autre">🐾 Autre</option>
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Nombre d'animaux *
                      </span>

                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={form.animals_count}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            animals_count: Math.max(
                              1,
                              Number(event.target.value || 1)
                            ),
                          }))
                        }
                        className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Taille
                      </span>

                      <select
                        value={form.foster_size}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            foster_size: event.target.value as FosterSize,
                          }))
                        }
                        className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
                      >
                        {FOSTER_SIZES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Âge
                      </span>

                      <select
                        value={form.foster_age}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            foster_age: event.target.value as FosterAge,
                          }))
                        }
                        className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
                      >
                        {FOSTER_AGES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Sexe
                      </span>

                      <select
                        value={form.foster_sex}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            foster_sex: event.target.value as FosterSex,
                          }))
                        }
                        className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
                      >
                        {FOSTER_SEXES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Durée recherchée
                      </span>

                      <select
                        value={form.foster_required_duration}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            foster_required_duration:
                              event.target.value as FosterDuration,
                          }))
                        }
                        className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 font-bold text-[#064b42]"
                      >
                        {FOSTER_DURATIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-black text-[#064b42]">
                        Temps maximum seul / jour
                      </span>

                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={form.foster_max_hours_alone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            foster_max_hours_alone:
                              event.target.value === ""
                                ? ""
                                : Number(event.target.value),
                          }))
                        }
                        placeholder="Ex. 4"
                        className="w-full rounded-2xl border border-[#e5ddd5] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
                      />
                    </label>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#df8995]">
                      Caractère / comportement
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["foster_temperament_calm", "😌 Calme"],
                        ["foster_temperament_social", "🐾 Sociable"],
                        ["foster_temperament_shy", "🌱 Timide"],
                        ["foster_temperament_active", "⚡ Actif"],
                        ["foster_reactive", "⚠️ Réactif"],
                      ].map(([key, label]) => {
                        const typedKey = key as
                          | "foster_temperament_calm"
                          | "foster_temperament_social"
                          | "foster_temperament_shy"
                          | "foster_temperament_active"
                          | "foster_reactive";

                        const checked = Boolean(form[typedKey]);

                        return (
                          <button
                            key={typedKey}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                [typedKey]: !current[typedKey],
                              }))
                            }
                            className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-black ${
                              checked
                                ? "border-[#df8995] bg-[#fce8ec] text-[#064b42]"
                                : "border-[#eee5dc] bg-white text-[#756d67]"
                            }`}
                          >
                            {checked ? "✓ " : ""}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#df8995]">
                      Besoins particuliers
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["foster_medical", "💊 Traitement médical"],
                        ["foster_recovery", "🩹 Convalescence"],
                        ["foster_disabled", "♿ Handicap"],
                        ["foster_special_needs", "❤️ Besoins particuliers"],
                      ].map(([key, label]) => {
                        const typedKey = key as
                          | "foster_medical"
                          | "foster_recovery"
                          | "foster_disabled"
                          | "foster_special_needs";

                        const checked = Boolean(form[typedKey]);

                        return (
                          <button
                            key={typedKey}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                [typedKey]: !current[typedKey],
                              }))
                            }
                            className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-black ${
                              checked
                                ? "border-[#df8995] bg-[#fce8ec] text-[#064b42]"
                                : "border-[#eee5dc] bg-white text-[#756d67]"
                            }`}
                          >
                            {checked ? "✓ " : ""}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#df8995]">
                      Environnement nécessaire
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        ["foster_requires_garden", "🌿 Jardin nécessaire"],
                        [
                          "foster_requires_fenced_garden",
                          "🔒 Terrain clôturé nécessaire",
                        ],
                        [
                          "foster_requires_isolation",
                          "🚪 Possibilité d'isoler l'animal",
                        ],
                        [
                          "foster_requires_medication",
                          "💊 Administration de médicaments",
                        ],
                      ].map(([key, label]) => {
                        const typedKey = key as
                          | "foster_requires_garden"
                          | "foster_requires_fenced_garden"
                          | "foster_requires_isolation"
                          | "foster_requires_medication";

                        const checked = Boolean(form[typedKey]);

                        return (
                          <button
                            key={typedKey}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                [typedKey]: !current[typedKey],
                              }))
                            }
                            className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-black ${
                              checked
                                ? "border-[#064b42] bg-[#edf7f4] text-[#064b42]"
                                : "border-[#eee5dc] bg-white text-[#756d67]"
                            }`}
                          >
                            {checked ? "✓ " : ""}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ) : null}

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Description du besoin *
                </span>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Décrivez précisément la situation et l’aide recherchée..."
                  className="w-full resize-y rounded-2xl border border-[#e5ddd5] px-4 py-3 outline-none focus:border-[#064b42]"
                />
              </label>

              {!editingId ? (
                <section className="rounded-[24px] border border-[#eadfd8] bg-[#fffaf5] p-5">
                  <p className="font-black text-[#064b42]">
                    📣 Diffusion Facebook
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#756d67]">
                    Le SOS sera publié automatiquement sur Les Veilleurs de Kali.
                    Vous pouvez aussi ouvrir Facebook pour le partager sur votre
                    profil personnel ou une page que vous administrez.
                  </p>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4">
                    <input
                      type="checkbox"
                      checked={shareOnFacebook}
                      onChange={(event) =>
                        setShareOnFacebook(
                          event.target.checked
                        )
                      }
                      className="mt-1 h-5 w-5"
                    />

                    <div>
                      <p className="font-black text-[#064b42]">
                        Partager aussi depuis mon Facebook
                      </p>

                      <p className="mt-1 text-sm text-[#756d67]">
                        Facebook vous laissera choisir votre profil ou une page
                        que vous gérez.
                      </p>
                    </div>
                  </label>
                </section>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#064b42] px-7 py-3 font-black text-white disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Publier le SOS"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <div className="mt-6 grid gap-4">
          {filtered.length === 0 ? (
            <div className="rounded-[26px] bg-white p-8 text-center shadow-sm">
              <p className="font-black text-[#064b42]">
                Aucun SOS pour le moment.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const canManage =
                isAdmin || item.created_by === currentUserId;

              return (
                <article
                  key={item.id}
                  className="rounded-[26px] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${urgencyClasses(
                            item.urgency
                          )}`}
                        >
                          {item.urgency === "critique"
                            ? "🚨 Critique"
                            : item.urgency === "urgente"
                              ? "⚠️ Urgente"
                              : "ℹ️ Normale"}
                        </span>

                        <span className="rounded-full bg-[#f8f4ec] px-3 py-1 text-xs font-black text-[#5f554d]">
                          {helpTypeIcon(item.help_type)}{" "}
                          {helpTypeLabel(item.help_type)}
                        </span>

                        <span className="rounded-full bg-[#edf7f4] px-3 py-1 text-xs font-black text-[#064b42]">
                          {statusLabel(item.status)}
                        </span>
                      </div>

                      <h2 className="mt-3 text-2xl font-black text-[#064b42]">
                        {item.title}
                      </h2>
                      {item.photo_url ? <img src={item.photo_url} alt={item.title} className="mt-4 h-56 w-full max-w-xl rounded-2xl object-cover" /> : null}
                      {item.companion_id ? <p className="mt-2 text-sm font-black text-[#064b42]">🐾 Lié à un compagnon Taui Te Ora</p> : item.adoption_animal_id ? <p className="mt-2 text-sm font-black text-[#064b42]">❤️ Lié à un animal en adoption géré par ce compte</p> : null}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#756d67]">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={16} />
                          {[item.city, item.island]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock3 size={16} />
                          {new Date(item.created_at).toLocaleString("fr-FR")}
                        </span>
                      </div>

                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5f554d]">
                        {item.message}
                      </p>
                    </div>

                    <div className="grid min-w-[220px] gap-2">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => void loadMatchingHelpers(item)}
                          disabled={matchingLoading[item.id]}
                          className="rounded-xl bg-[#edf7f4] px-4 py-3 text-sm font-black text-[#064b42] disabled:opacity-60"
                        >
                          {matchingLoading[item.id]
                            ? "Recherche..."
                            : matchingHelpers[item.id]
                              ? `${matchingHelpers[item.id].length} personne${
                                  matchingHelpers[item.id].length > 1 ? "s" : ""
                                } compatible${
                                  matchingHelpers[item.id].length > 1 ? "s" : ""
                                }`
                              : "Voir les personnes compatibles"}
                        </button>
                      ) : null}

                      {canManage && item.status !== "cloture" ? (
                        <button
                          type="button"
                          onClick={() => void notifyMatchingHelpers(item)}
                          disabled={notifying[item.id] || Boolean(item.push_sent_at)}
                          className="flex items-center justify-center gap-2 rounded-xl bg-[#df8995] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Bell size={17} />
                          {notifying[item.id]
                            ? "Notification..."
                            : item.push_sent_at
                              ? "Personnes déjà notifiées"
                              : "Notifier les personnes compatibles"}
                        </button>
                      ) : null}

                      {notificationResults[item.id] ? (
                        <p className="rounded-xl bg-green-50 px-3 py-2 text-xs font-bold leading-5 text-green-800">
                          {notificationResults[item.id]}
                        </p>
                      ) : null}

                      {canManage ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#edf7f4] px-4 py-3 text-sm font-black text-[#064b42]"
                          >
                            <Pencil size={16} />
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => void toggleArchive(item)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#f8f4ec] px-4 py-3 text-sm font-black text-[#5f554d]"
                          >
                            <Archive size={16} />
                            {item.archived_at ? "Réactiver" : "Archiver"}
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteSos(item)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-700"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </div>
                      ) : null}

                      {canManage ? (
                      <div className="grid gap-2">
                        {item.status !== "en_cours" && item.status !== "cloture" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(item, "en_cours")
                            }
                            className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800"
                          >
                            Prendre en cours
                          </button>
                        ) : null}

                        {item.status !== "cloture" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(item, "cloture")
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#064b42] px-4 py-3 text-sm font-black text-white"
                          >
                            <CheckCircle2 size={17} />
                            Valider / clôturer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(item, "ouvert")
                            }
                            className="rounded-xl bg-[#edf7f4] px-4 py-3 text-sm font-black text-[#064b42]"
                          >
                            Rouvrir
                          </button>
                        )}
                      </div>
                    ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 border-t border-[#eee5dc] pt-5 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          getSosFacebookShareUrl(item.id),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-black text-white"
                    >
                      Facebook
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          getSosWhatsappShareUrl(item),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black text-white"
                    >
                      WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const url = getSosPublicUrl(item.id);

                        try {
                          await navigator.clipboard.writeText(url);
                          setMessage("Lien du SOS copié.");
                        } catch {
                          window.prompt("Copiez ce lien :", url);
                        }
                      }}
                      className="rounded-xl border border-[#d9cec7] bg-white px-4 py-3 text-sm font-black text-[#064b42]"
                    >
                      Copier le lien
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/sos-aide/${item.id}`
                        )
                      }
                      className="rounded-xl bg-[#edf7f4] px-4 py-3 text-sm font-black text-[#064b42]"
                    >
                      Voir la fiche publique
                    </button>
                  </div>

                  {expandedMatching === item.id ? (
                    <div className="mt-5 border-t border-[#eee5dc] pt-5">
                      <h3 className="text-lg font-black text-[#064b42]">
                        Personnes compatibles
                      </h3>

                      {matchingLoading[item.id] ? (
                        <p className="mt-3 text-sm font-semibold text-[#756d67]">
                          Recherche des personnes disponibles...
                        </p>
                      ) : (matchingHelpers[item.id] || []).length === 0 ? (
                        <div className="mt-3 rounded-2xl bg-[#fbf7ef] p-4 text-sm font-semibold text-[#756d67]">
                          Aucune personne compatible trouvée pour le moment.
                        </div>
                      ) : (
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {(matchingHelpers[item.id] || []).map((helper) => {
                            const name =
                              [helper.first_name, helper.last_name]
                                .filter(Boolean)
                                .join(" ") ||
                              helper.organization_name ||
                              "Membre du réseau";

                            return (
                              <div
                                key={helper.id}
                                className="rounded-2xl bg-[#fbf7ef] p-4"
                              >
                                <p className="font-black text-[#064b42]">
                                  {name}
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#756d67]">
                                  {[helper.city, helper.island]
                                    .filter(Boolean)
                                    .join(" · ") || "Localisation non renseignée"}
                                </p>

                                {helper.phone ? (
                                  <a
                                    href={`tel:${helper.phone}`}
                                    className="mt-3 block text-sm font-black text-[#064b42]"
                                  >
                                    📞 {helper.phone}
                                  </a>
                                ) : null}

                                {helper.email ? (
                                  <a
                                    href={`mailto:${helper.email}`}
                                    className="mt-1 block break-all text-sm font-black text-[#064b42]"
                                  >
                                    ✉️ {helper.email}
                                  </a>
                                ) : null}

                                {item.help_type === "famille_accueil" ? (
                                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                                    {helper.foster_capacity ? (
                                      <span className="rounded-full bg-white px-3 py-1">
                                        Capacité : {helper.foster_capacity}
                                      </span>
                                    ) : null}
                                    {helper.foster_accepts_dogs ? (
                                      <span className="rounded-full bg-white px-3 py-1">
                                        🐶 Chiens
                                      </span>
                                    ) : null}
                                    {helper.foster_accepts_cats ? (
                                      <span className="rounded-full bg-white px-3 py-1">
                                        🐱 Chats
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
