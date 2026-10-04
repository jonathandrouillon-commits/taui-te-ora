"use client";

import {
  Camera,
  Save,
} from "lucide-react";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

import CollapsibleDashboardSection from "./CollapsibleDashboardSection";

type ProfileForm = {
  id: string;
  role: string;
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
  id: "",
  role: "",
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

const MAX_AVATAR_SIZE =
  8 * 1024 * 1024;

function getExtension(
  file: File
) {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    extension &&
    [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ].includes(extension)
  ) {
    return extension;
  }

  return "jpg";
}

function roleLabel(
  role: string
) {
  switch (
    String(role || "")
      .trim()
      .toLowerCase()
  ) {
    case "admin":
      return "Administration";
    case "association":
      return "Association";
    case "refuge":
      return "Refuge / SIGFA";
    case "fourriere":
      return "Fourrière";
    case "benevole":
      return "Bénévole";
    case "adoptant":
      return "Adoptant";
    default:
      return role || "Profil";
  }
}

export default function UnifiedProfileSection({
  defaultOpen = false,
  onSaved,
}: {
  defaultOpen?: boolean;
  onSaved?: () => void;
}) {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    form,
    setForm,
  ] =
    useState<ProfileForm>(
      EMPTY_FORM
    );

  const loadProfile =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const {
            data: {
              user,
            },
            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (
            authError
          ) {
            throw authError;
          }

          if (!user) {
            return;
          }

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "profiles"
              )
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
                  organization_name
                `
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            error
          ) {
            throw error;
          }

          if (!data) {
            throw new Error(
              "Profil introuvable."
            );
          }

          setForm({
            id:
              data.id || "",
            role:
              data.role || "",
            first_name:
              data.first_name || "",
            last_name:
              data.last_name || "",
            birth_date:
              data.birth_date || "",
            phone:
              data.phone || "",
            email:
              data.email ||
              user.email ||
              "",
            avatar_url:
              data.avatar_url || "",
            island:
              data.island || "",
            city:
              data.city || "",
            address:
              data.address || "",
            postal_code:
              data.postal_code || "",
            organization_name:
              data.organization_name ||
              "",
          });
        } catch (
          error
        ) {
          console.error(
            "Erreur chargement profil dashboard :",
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function updateField(
    field:
      keyof ProfileForm,
    value:
      string
  ) {
    setSaved(false);

    setForm(
      (
        current
      ) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  async function saveProfile() {
    if (
      saving ||
      !form.id
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      setSaved(
        false
      );

      const payload = {
        first_name:
          form.first_name.trim() ||
          null,

        last_name:
          form.last_name.trim() ||
          null,

        birth_date:
          form.birth_date ||
          null,

        phone:
          form.phone.trim() ||
          null,

        island:
          form.island.trim() ||
          null,

        city:
          form.city.trim() ||
          null,

        address:
          form.address.trim() ||
          null,

        postal_code:
          form.postal_code.trim() ||
          null,

        organization_name:
          form.organization_name.trim() ||
          null,
      };

      const {
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update(
            payload
          )
          .eq(
            "id",
            form.id
          );

      if (
        error
      ) {
        throw error;
      }

      setSaved(
        true
      );

      onSaved?.();

      window.setTimeout(
        () =>
          setSaved(
            false
          ),
        2500
      );
    } catch (
      error
    ) {
      console.error(
        "Erreur sauvegarde profil :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible d'enregistrer le profil."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleAvatarChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (
      !file ||
      !form.id
    ) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Sélectionnez une image."
      );

      return;
    }

    if (
      file.size >
      MAX_AVATAR_SIZE
    ) {
      alert(
        "La photo dépasse 8 Mo."
      );

      return;
    }

    try {
      setUploadingAvatar(
        true
      );

      const extension =
        getExtension(
          file
        );

      const path =
        `${form.id}/avatar-${Date.now()}.${extension}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "profiles"
          )
          .upload(
            path,
            file,
            {
              upsert:
                true,

              cacheControl:
                "3600",

              contentType:
                file.type,
            }
          );

      if (
        uploadError
      ) {
        throw uploadError;
      }

      const {
        data:
          publicData,
      } =
        supabase.storage
          .from(
            "profiles"
          )
          .getPublicUrl(
            path
          );

      const publicUrl =
        publicData.publicUrl;

      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update({
            avatar_url:
              publicUrl,
          })
          .eq(
            "id",
            form.id
          );

      if (
        updateError
      ) {
        throw updateError;
      }

      setForm(
        (
          current
        ) => ({
          ...current,
          avatar_url:
            publicUrl,
        })
      );

      onSaved?.();
    } catch (
      error
    ) {
      console.error(
        "Erreur photo profil :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible de modifier la photo."
      );
    } finally {
      setUploadingAvatar(
        false
      );
    }
  }

  return (
    <CollapsibleDashboardSection
      title="Mon profil"
      subtitle="Mes informations personnelles et mes coordonnées."
      icon="👤"
      defaultOpen={
        defaultOpen
      }
    >
      {loading ? (
        <p className="font-bold text-[#6f5a47]">
          Chargement du profil...
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="rounded-2xl bg-[#f8f4ec] p-5 text-center">
            {form.avatar_url ? (
              <img
                src={
                  form.avatar_url
                }
                alt="Photo de profil"
                className="mx-auto h-28 w-28 rounded-full object-cover"
              />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#e8f5f1] text-4xl">
                👤
              </div>
            )}

            <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow-sm">
              <Camera
                size={17}
              />

              {uploadingAvatar
                ? "Envoi..."
                : "Changer la photo"}

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleAvatarChange
                }
                disabled={
                  uploadingAvatar
                }
                className="hidden"
              />
            </label>

            <p className="mt-4 text-lg font-black text-[#064b42]">
              {form.organization_name ||
                `${form.first_name} ${form.last_name}`.trim() ||
                "Mon profil"}
            </p>

            <span className="mt-2 inline-flex rounded-full bg-[#064b42] px-3 py-1 text-xs font-black text-white">
              {roleLabel(
                form.role
              )}
            </span>

            <p className="mt-3 break-all text-sm text-[#6f5a47]">
              {form.email}
            </p>
          </div>

          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Prénom"
                value={
                  form.first_name
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "first_name",
                    value
                  )
                }
              />

              <Field
                label="Nom"
                value={
                  form.last_name
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "last_name",
                    value
                  )
                }
              />

              <Field
                label="Téléphone"
                value={
                  form.phone
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "phone",
                    value
                  )
                }
              />

              <Field
                label="Email"
                value={
                  form.email
                }
                disabled
                onChange={() => {}}
              />

              <Field
                label="Date de naissance"
                value={
                  form.birth_date
                }
                type="date"
                onChange={(
                  value
                ) =>
                  updateField(
                    "birth_date",
                    value
                  )
                }
              />

              <Field
                label="Nom de la structure"
                value={
                  form.organization_name
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "organization_name",
                    value
                  )
                }
              />

              <Field
                label="Île"
                value={
                  form.island
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "island",
                    value
                  )
                }
              />

              <Field
                label="Commune"
                value={
                  form.city
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "city",
                    value
                  )
                }
              />

              <div className="sm:col-span-2">
                <Field
                  label="Adresse"
                  value={
                    form.address
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "address",
                      value
                    )
                  }
                />
              </div>

              <Field
                label="Code postal"
                value={
                  form.postal_code
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "postal_code",
                    value
                  )
                }
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  void saveProfile()
                }
                disabled={
                  saving
                }
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#064b42] px-6 py-3 font-black text-white transition hover:bg-[#08695d] disabled:opacity-60"
              >
                <Save
                  size={18}
                />

                {saving
                  ? "Enregistrement..."
                  : "Sauvegarder mon profil"}
              </button>

              {saved ? (
                <p className="text-sm font-black text-green-700">
                  ✓ Profil enregistré
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </CollapsibleDashboardSection>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-black text-[#064b42]">
      {label}

      <input
        type={
          type
        }
        value={
          value
        }
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-xl border border-[#d8e9e3] bg-white px-4 py-3 font-semibold outline-none transition focus:border-[#064b42] disabled:bg-gray-50 disabled:text-gray-500"
      />
    </label>
  );
}
