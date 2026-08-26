"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Building2,
  Camera,
  CheckCircle2,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type UserRole =
  | "admin"
  | "association"
  | "refuge"
  | "fourriere"
  | "benevole"
  | "adoptant";

type ProfileRow = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  island: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  organization_name: string | null;
  approval_status: string | null;
};

type ProfileForm = {
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: string;
  email: string;
  avatar_url: string;
  island: string;
  city: string;
  address: string;
  postal_code: string;
  organization_name: string;
};

const EMPTY_FORM: ProfileForm = {
  first_name: "",
  last_name: "",
  birth_date: "",
  phone: "",
  email: "",
  avatar_url: "",
  island: "",
  city: "",
  address: "",
  postal_code: "",
  organization_name: "",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administration",
  association: "Association",
  refuge: "Refuge / SIGFA",
  fourriere: "Fourrière",
  benevole: "Bénévole",
  adoptant: "Adoptant",
};

const MAX_AVATAR_SIZE = 8 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function normalizeRole(
  value: string | null | undefined
): UserRole | null {
  const role = String(value || "")
    .trim()
    .toLowerCase();

  if (
    role === "admin" ||
    role === "association" ||
    role === "refuge" ||
    role === "fourriere" ||
    role === "benevole" ||
    role === "adoptant"
  ) {
    return role;
  }

  return null;
}

function getApprovalLabel(value: string | null) {
  switch (String(value || "").trim().toLowerCase()) {
    case "approved":
      return "Validé";
    case "pending":
      return "En attente de validation";
    case "rejected":
      return "Refusé";
    case "suspended":
      return "Suspendu";
    default:
      return "Non renseigné";
  }
}

function getFileExtension(file: File) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function validateAvatar(file: File) {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    throw new Error(
      "Format non autorisé. Utilisez une image JPG, PNG ou WEBP."
    );
  }

  if (file.size <= 0) {
    throw new Error("Le fichier sélectionné est vide.");
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("La photo dépasse la taille maximale de 8 Mo.");
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profileId, setProfileId] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [approvalStatus, setApprovalStatus] =
    useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  const isStructure = useMemo(
    () =>
      role === "association" ||
      role === "refuge" ||
      role === "fourriere",
    [role]
  );

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login?redirect=/profile");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            role,
            first_name,
            last_name,
            birth_date,
            phone,
            email,
            avatar_url,
            island,
            city,
            address,
            postal_code,
            is_verified,
            is_active,
            organization_name,
            approval_status
          `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Profil utilisateur introuvable.");

      const profile = data as ProfileRow;

      setProfileId(profile.id);
      setRole(normalizeRole(profile.role));
      setApprovalStatus(profile.approval_status);
      setIsVerified(Boolean(profile.is_verified));
      setIsActive(profile.is_active !== false);

      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        birth_date: profile.birth_date || "",
        phone: profile.phone || "",
        email: profile.email || user.email || "",
        avatar_url: profile.avatar_url || "",
        island: profile.island || "",
        city: profile.city || "",
        address: profile.address || "",
        postal_code: profile.postal_code || "",
        organization_name: profile.organization_name || "",
      });
    } catch (error: unknown) {
      console.error("Erreur chargement profil :", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible de charger votre profil."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void loadProfile());
  }, [loadProfile]);

  function updateField<K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K]
  ) {
    setSaved(false);

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function uploadAvatar(file: File) {
    if (!profileId) {
      throw new Error("Profil utilisateur introuvable.");
    }

    validateAvatar(file);

    const extension = getFileExtension(file);
    const path = `${profileId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("profiles")
      .getPublicUrl(path);

    if (!data.publicUrl) {
      throw new Error("Impossible de récupérer l'URL de la photo.");
    }

    return data.publicUrl;
  }

  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingAvatar(true);
      setSaved(false);

      const publicUrl = await uploadAvatar(file);

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("id", profileId);

      if (error) throw error;

      setForm((previous) => ({
        ...previous,
        avatar_url: publicUrl,
      }));

      setSaved(true);
    } catch (error: unknown) {
      console.error("Erreur photo profil :", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'importer cette photo."
      );
    } finally {
      setUploadingAvatar(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function removeAvatar() {
    if (!profileId || !form.avatar_url) return;

    const confirmed = window.confirm(
      "Retirer la photo de votre profil ?"
    );

    if (!confirmed) return;

    try {
      setUploadingAvatar(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
        })
        .eq("id", profileId);

      if (error) throw error;

      setForm((previous) => ({
        ...previous,
        avatar_url: "",
      }));

      setSaved(true);
    } catch (error: unknown) {
      console.error("Erreur suppression photo profil :", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible de retirer la photo."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    if (saving || !profileId) return;

    try {
      setSaving(true);
      setSaved(false);

      const payload = {
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        birth_date: form.birth_date || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        island: form.island.trim() || null,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        postal_code: form.postal_code.trim() || null,
        organization_name: isStructure
          ? form.organization_name.trim() || null
          : null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profileId);

      if (error) throw error;

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 4000);
    } catch (error: unknown) {
      console.error("Erreur sauvegarde profil :", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer votre profil."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f8f4ec] px-5">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#eadfd8] border-t-[#064b42]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement de votre profil...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] px-4 py-6 pb-28 text-[#064b42] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[34px] bg-white shadow-xl">
          <div className="bg-gradient-to-br from-[#f7dfe3] via-[#f7eee7] to-[#e3efe8] px-6 py-8 sm:px-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c76d7b]">
                  TAUI TE ORA
                </p>

                <h1 className="mt-2 text-4xl font-black text-[#064b42] sm:text-5xl">
                  Mon profil
                </h1>

                <p className="mt-2 text-[#6f665f]">
                  Modifiez vos informations et votre photo de profil.
                </p>
              </div>

              <div className="rounded-[22px] bg-white/80 px-5 py-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-[#a98b73]">
                  Type de compte
                </p>

                <p className="mt-1 font-black text-[#064b42]">
                  {role ? ROLE_LABELS[role] : "Utilisateur"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-9">
            <div className="grid gap-4 md:grid-cols-3">
              <StatusCard
                icon={<ShieldCheck size={22} />}
                label="Validation"
                value={getApprovalLabel(approvalStatus)}
              />

              <StatusCard
                icon={<CheckCircle2 size={22} />}
                label="Vérification"
                value={isVerified ? "Profil vérifié" : "Non vérifié"}
              />

              <StatusCard
                icon={<UserRound size={22} />}
                label="Compte"
                value={isActive ? "Actif" : "Inactif"}
              />
            </div>

            <section className="mt-8 rounded-[28px] border border-[#eee2da] bg-[#fffaf7] p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#f3e6dd] shadow-lg">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt="Photo de profil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound
                      size={52}
                      className="text-[#c8a896]"
                    />
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-black text-[#064b42]">
                    {isStructure
                      ? "Logo / photo de la structure"
                      : "Photo de profil"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6f665f]">
                    JPG, PNG ou WEBP — 8 Mo maximum.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-full bg-[#df8995] px-5 py-3 font-black text-white shadow disabled:opacity-60"
                    >
                      <Camera size={18} />

                      {uploadingAvatar
                        ? "Import..."
                        : form.avatar_url
                          ? "Changer la photo"
                          : "Ajouter une photo"}
                    </button>

                    {form.avatar_url && (
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={removeAvatar}
                        className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-3 font-black text-red-600 disabled:opacity-60"
                      >
                        <Trash2 size={18} />
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {isStructure && (
              <section className="mt-8 rounded-[28px] border border-[#eee2da] bg-[#fffaf7] p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Building2
                    size={24}
                    className="text-[#c76d7b]"
                  />

                  <h2 className="text-2xl font-black text-[#064b42]">
                    Ma structure
                  </h2>
                </div>

                <Input
                  label="Nom de la structure"
                  value={form.organization_name}
                  onChange={(value) =>
                    updateField("organization_name", value)
                  }
                />
              </section>
            )}

            <section className="mt-8 rounded-[28px] border border-[#eee2da] bg-white p-5 sm:p-6">
              <h2 className="mb-6 text-2xl font-black text-[#064b42]">
                {isStructure
                  ? "Responsable et coordonnées"
                  : "Informations personnelles"}
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label={
                    isStructure ? "Prénom du responsable" : "Prénom"
                  }
                  value={form.first_name}
                  onChange={(value) =>
                    updateField("first_name", value)
                  }
                />

                <Input
                  label={isStructure ? "Nom du responsable" : "Nom"}
                  value={form.last_name}
                  onChange={(value) =>
                    updateField("last_name", value)
                  }
                />

                {!isStructure && (
                  <Input
                    label="Date de naissance"
                    type="date"
                    value={form.birth_date}
                    onChange={(value) =>
                      updateField("birth_date", value)
                    }
                  />
                )}

                <Input
                  label="Téléphone"
                  value={form.phone}
                  onChange={(value) => updateField("phone", value)}
                />

                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                />

                <Input
                  label="Île"
                  value={form.island}
                  onChange={(value) => updateField("island", value)}
                />

                <Input
                  label="Ville / commune"
                  value={form.city}
                  onChange={(value) => updateField("city", value)}
                />

                <Input
                  label="Code postal"
                  value={form.postal_code}
                  onChange={(value) =>
                    updateField("postal_code", value)
                  }
                />
              </div>

              <div className="mt-5">
                <Input
                  label="Adresse"
                  value={form.address}
                  onChange={(value) => updateField("address", value)}
                />
              </div>
            </section>

            {role === "adoptant" && (
              <section className="mt-8 rounded-[28px] bg-[#edf6f2] p-6">
                <h2 className="text-2xl font-black text-[#064b42]">
                  Mon profil d&apos;adoption
                </h2>

                <p className="mt-2 leading-7 text-[#607069]">
                  Votre questionnaire sert au calcul de compatibilité
                  avec les animaux proposés à l&apos;adoption.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/adoptant/profile")}
                  className="mt-5 rounded-full bg-[#064b42] px-6 py-3.5 font-black text-white"
                >
                  Modifier mon questionnaire
                </button>
              </section>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#064b42] px-8 py-4 font-black text-white shadow-lg disabled:opacity-60"
              >
                <Save size={19} />

                {saving
                  ? "Enregistrement..."
                  : "Enregistrer mon profil"}
              </button>

              {saved && (
                <div className="flex items-center gap-2 font-black text-green-700">
                  <CheckCircle2 size={20} />
                  Profil enregistré
                </div>
              )}
            </div>

            <div className="mt-7 rounded-[22px] bg-[#f8f4ec] p-4 text-sm leading-6 text-[#6f665f]">
              Le rôle, le statut de validation, la vérification et
              l&apos;activation du compte restent protégés.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-[#f8f4ec] p-4">
      <div className="flex items-center gap-2 text-[#c76d7b]">
        {icon}

        <span className="text-xs font-black uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 font-black text-[#064b42]">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-black text-[#064b42]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[18px] border border-[#e5d8cd] bg-[#fffaf7] px-4 py-3.5 outline-none transition focus:border-[#df8995]"
      />
    </label>
  );
}
