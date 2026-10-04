"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Camera,
  PawPrint,
  Save,
  Search,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../../lib/supabase";

type Profile = {
  id: string;
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  organization_name?: string | null;
  structure_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type AnimalForm = {
  reference_number: string;
  animal_name: string;
  animal_type: string;
  age_label: string;
  sex: string;
  breed: string;
  size_label: string;

  street_duration: string;
  capture_location: string;

  island: string;
  city: string;
  map_address: string;

  description_character: string;
  health_status: string;
  special_needs: string;
  story: string;

  weight_kg: string;

  compatible_chiens: string;
  compatible_chats: string;
  compatible_enfants: string;

  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;

  is_published: boolean;
};

const EMPTY_FORM: AnimalForm = {
  reference_number: "",
  animal_name: "",
  animal_type: "",
  age_label: "",
  sex: "",
  breed: "",
  size_label: "",

  street_duration: "",
  capture_location: "",

  island: "",
  city: "",
  map_address: "",

  description_character: "",
  health_status: "",
  special_needs: "",
  story: "",

  weight_kg: "",

  compatible_chiens: "",
  compatible_chats: "",
  compatible_enfants: "",

  vaccinated: false,
  sterilized: false,
  microchipped: false,

  is_published: false,
};

function getProfileName(
  profile: Profile
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

  const completeName =
    `${profile.first_name || ""} ${
      profile.last_name || ""
    }`.trim();

  if (completeName) {
    return completeName;
  }

  return (
    profile.display_name ||
    profile.full_name ||
    profile.email ||
    "Profil sans nom"
  );
}

function getRoleLabel(
  role?: string | null
) {
  const normalized =
    String(role || "")
      .trim()
      .toLowerCase();

  switch (normalized) {
    case "admin":
      return "Administrateur";

    case "association":
      return "Association";

    case "refuge":
      return "Refuge";

    case "fourriere":
    case "fourrière":
      return "Fourrière";

    case "benevole":
    case "bénévole":
      return "Bénévole";

    case "famille_accueil":
      return "Famille d’accueil";

    case "adoptant":
      return "Adoptant";

    default:
      return normalized || "Utilisateur";
  }
}

export default function AdminCreateAnimalPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    profiles,
    setProfiles,
  ] = useState<Profile[]>([]);

  const [
    selectedOwnerId,
    setSelectedOwnerId,
  ] = useState("");

  const [
    profileSearch,
    setProfileSearch,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState<AnimalForm>(
    EMPTY_FORM
  );

  const [
    photos,
    setPhotos,
  ] = useState<File[]>([]);

  const [
    photoPreviews,
    setPhotoPreviews,
  ] = useState<string[]>([]);

  const loadPage =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const {
            data: {
              user,
            },
            error:
              userError,
          } =
            await supabase.auth.getUser();

          if (
            userError
          ) {
            throw userError;
          }

          if (!user) {
            router.replace(
              "/login?redirect=/admin/animals/create"
            );

            return;
          }

          const {
            data:
              adminProfile,
            error:
              profileError,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "role"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            throw profileError;
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
            router.replace(
              "/"
            );

            return;
          }

          const {
            data:
              profilesData,
            error:
              profilesError,
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
                  display_name,
                  full_name,
                  organization_name,
                  structure_name,
                  company_name,
                  email,
                  avatar_url
                `
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            profilesError
          ) {
            throw profilesError;
          }

          setProfiles(
            (
              profilesData ||
              []
            ) as Profile[]
          );
        } catch (
          error
        ) {
          console.error(
            "Erreur chargement création animal admin :",
            error
          );

          alert(
            error instanceof
              Error
              ? error.message
              : "Impossible de charger la page."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [router]
    );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const filteredProfiles =
    useMemo(() => {
      const query =
        profileSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return profiles;
      }

      return profiles.filter(
        (
          profile
        ) => {
          const text =
            [
              getProfileName(
                profile
              ),
              profile.email,
              getRoleLabel(
                profile.role
              ),
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLowerCase();

          return text.includes(
            query
          );
        }
      );
    }, [
      profiles,
      profileSearch,
    ]);

  const selectedProfile =
    useMemo(
      () =>
        profiles.find(
          (
            profile
          ) =>
            profile.id ===
            selectedOwnerId
        ) || null,
      [
        profiles,
        selectedOwnerId,
      ]
    );

  function updateField<
    K extends keyof AnimalForm
  >(
    key: K,
    value:
      AnimalForm[K]
  ) {
    setForm(
      (
        previous
      ) => ({
        ...previous,
        [key]:
          value,
      })
    );
  }

  function handlePhotos(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    event.target.value =
      "";

    if (
      files.length ===
      0
    ) {
      return;
    }

    const images =
      files.filter(
        (
          file
        ) =>
          file.type.startsWith(
            "image/"
          )
      );

    if (
      images.length !==
      files.length
    ) {
      alert(
        "Seules les images sont acceptées."
      );
    }

    const tooLarge =
      images.find(
        (
          file
        ) =>
          file.size >
          15 *
            1024 *
            1024
      );

    if (
      tooLarge
    ) {
      alert(
        `La photo ${tooLarge.name} dépasse 15 Mo.`
      );

      return;
    }

    const remaining =
      5 -
      photos.length;

    if (
      remaining <= 0
    ) {
      alert(
        "Maximum 5 photos."
      );

      return;
    }

    const accepted =
      images.slice(
        0,
        remaining
      );

    const nextPhotos = [
      ...photos,
      ...accepted,
    ];

    setPhotos(
      nextPhotos
    );

    const previews =
      nextPhotos.map(
        (
          file
        ) =>
          URL.createObjectURL(
            file
          )
      );

    setPhotoPreviews(
      previews
    );
  }

  function removePhoto(
    index: number
  ) {
    setPhotos(
      (
        previous
      ) =>
        previous.filter(
          (
            _,
            currentIndex
          ) =>
            currentIndex !==
            index
        )
    );

    setPhotoPreviews(
      (
        previous
      ) =>
        previous.filter(
          (
            _,
            currentIndex
          ) =>
            currentIndex !==
            index
        )
    );
  }

  async function saveAnimal() {
    if (
      saving
    ) {
      return;
    }

    if (
      !selectedOwnerId
    ) {
      alert(
        "Sélectionnez le profil qui sera propriétaire de l'animal."
      );

      return;
    }

    if (
      !form.animal_name.trim()
    ) {
      alert(
        "Le nom de l'animal est obligatoire."
      );

      return;
    }

    if (
      !form.animal_type.trim()
    ) {
      alert(
        "Le type d'animal est obligatoire."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const {
        data: {
          session,
        },
        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError
      ) {
        throw sessionError;
      }

      if (
        !session?.access_token
      ) {
        throw new Error(
          "Session administrateur introuvable."
        );
      }

      const body =
        new FormData();

      body.append(
        "owner_id",
        selectedOwnerId
      );

      body.append(
        "reference_number",
        form.reference_number
      );

      body.append(
        "animal_name",
        form.animal_name
      );

      body.append(
        "animal_type",
        form.animal_type
      );

      body.append(
        "age_label",
        form.age_label
      );

      body.append(
        "sex",
        form.sex
      );

      body.append(
        "breed",
        form.breed
      );

      body.append(
        "size_label",
        form.size_label
      );

      body.append(
        "street_duration",
        form.street_duration
      );

      body.append(
        "capture_location",
        form.capture_location
      );

      body.append(
        "island",
        form.island
      );

      body.append(
        "city",
        form.city
      );

      body.append(
        "map_address",
        form.map_address
      );

      body.append(
        "description_character",
        form.description_character
      );

      body.append(
        "health_status",
        form.health_status
      );

      body.append(
        "special_needs",
        form.special_needs
      );

      body.append(
        "story",
        form.story
      );

      body.append(
        "weight_kg",
        form.weight_kg
      );

      body.append(
        "compatible_chiens",
        form.compatible_chiens
      );

      body.append(
        "compatible_chats",
        form.compatible_chats
      );

      body.append(
        "compatible_enfants",
        form.compatible_enfants
      );

      body.append(
        "vaccinated",
        String(
          form.vaccinated
        )
      );

      body.append(
        "sterilized",
        String(
          form.sterilized
        )
      );

      body.append(
        "microchipped",
        String(
          form.microchipped
        )
      );

      body.append(
        "is_published",
        String(
          form.is_published
        )
      );

      photos.forEach(
        (
          photo
        ) => {
          body.append(
            "photos",
            photo
          );
        }
      );

      const response =
        await fetch(
          "/api/admin/animals",
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },

            body,
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Impossible de créer l'animal."
        );
      }

      alert(
        `${form.animal_name} a été créé et attribué à ${
          selectedProfile
            ? getProfileName(
                selectedProfile
              )
            : "ce profil"
        }.`
      );

      router.push(
        `/admin/animals/${result.animal.id}/edit`
      );

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        "Erreur création animal admin :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible de créer l'animal."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d8e9e3] border-t-[#064b42]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-4 pb-20 pt-24 text-[#064b42] sm:px-8">
      <section className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/dashboard"
            )
          }
          className="mb-7 flex items-center gap-2 font-black"
        >
          <ArrowLeft
            size={20}
          />

          Retour dashboard
        </button>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
            Administration
          </p>

          <h1 className="mt-1 text-4xl font-black sm:text-5xl">
            Créer un animal à adopter
          </h1>

          <p className="mt-3 max-w-3xl text-[#6f5a47]">
            Créez la fiche pour le compte
            d&apos;une association, d&apos;un
            refuge ou d&apos;un autre profil.
            L&apos;animal appartiendra réellement
            au profil sélectionné.
          </p>
        </div>

        {/* PROPRIETAIRE */}

        <div className="mt-8 rounded-3xl border-2 border-[#064b42] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df8995]">
            Étape importante
          </p>

          <h2 className="mt-1 text-2xl font-black">
            À quel profil appartient cet animal ?
          </h2>

          <div className="relative mt-5">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={
                profileSearch
              }
              onChange={(
                event
              ) =>
                setProfileSearch(
                  event.target.value
                )
              }
              placeholder="Rechercher association, refuge, utilisateur, email..."
              className="w-full rounded-2xl border border-[#d8e9e3] bg-[#faf7f2] py-4 pl-12 pr-4 font-bold outline-none"
            />
          </div>

          <select
            value={
              selectedOwnerId
            }
            onChange={(
              event
            ) =>
              setSelectedOwnerId(
                event.target.value
              )
            }
            className="mt-4 w-full rounded-2xl border border-[#d8e9e3] bg-white px-4 py-4 font-black outline-none"
          >
            <option value="">
              Sélectionner le propriétaire réel
            </option>

            {filteredProfiles.map(
              (
                profile
              ) => (
                <option
                  key={
                    profile.id
                  }
                  value={
                    profile.id
                  }
                >
                  {getProfileName(
                    profile
                  )}{" "}
                  —{" "}
                  {getRoleLabel(
                    profile.role
                  )}
                </option>
              )
            )}
          </select>

          {selectedProfile && (
            <div className="mt-4 rounded-2xl bg-[#e8f5f1] p-4">
              <p className="font-black">
                ✓ Propriétaire sélectionné :
                {" "}
                {getProfileName(
                  selectedProfile
                )}
              </p>

              <p className="mt-1 text-sm font-bold text-[#6f5a47]">
                {getRoleLabel(
                  selectedProfile.role
                )}
                {selectedProfile.email
                  ? ` • ${selectedProfile.email}`
                  : ""}
              </p>
            </div>
          )}
        </div>

        {/* INFORMATIONS */}

        <div className="mt-7 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">
            Informations de l&apos;animal
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Nom *"
              value={
                form.animal_name
              }
              onChange={(
                value
              ) =>
                updateField(
                  "animal_name",
                  value
                )
              }
            />

            <Field
              label="Référence"
              value={
                form.reference_number
              }
              onChange={(
                value
              ) =>
                updateField(
                  "reference_number",
                  value
                )
              }
            />

            <SelectField
              label="Type *"
              value={
                form.animal_type
              }
              onChange={(
                value
              ) =>
                updateField(
                  "animal_type",
                  value
                )
              }
              options={[
                "Chien",
                "Chat",
                "Cheval",
                "Oiseau",
                "Autre",
              ]}
            />

            <SelectField
              label="Sexe"
              value={
                form.sex
              }
              onChange={(
                value
              ) =>
                updateField(
                  "sex",
                  value
                )
              }
              options={[
                "Mâle",
                "Femelle",
              ]}
            />

            <Field
              label="Âge"
              value={
                form.age_label
              }
              onChange={(
                value
              ) =>
                updateField(
                  "age_label",
                  value
                )
              }
              placeholder="Ex : 2 ans"
            />

            <Field
              label="Race"
              value={
                form.breed
              }
              onChange={(
                value
              ) =>
                updateField(
                  "breed",
                  value
                )
              }
            />

            <SelectField
              label="Taille"
              value={
                form.size_label
              }
              onChange={(
                value
              ) =>
                updateField(
                  "size_label",
                  value
                )
              }
              options={[
                "Petit",
                "Moyen",
                "Grand",
                "Très grand",
              ]}
            />

            <Field
              label="Poids"
              value={
                form.weight_kg
              }
              onChange={(
                value
              ) =>
                updateField(
                  "weight_kg",
                  value
                )
              }
              placeholder="Ex : 12.5"
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

            <Field
              label="Adresse / secteur"
              value={
                form.map_address
              }
              onChange={(
                value
              ) =>
                updateField(
                  "map_address",
                  value
                )
              }
            />

            <Field
              label="Lieu de récupération"
              value={
                form.capture_location
              }
              onChange={(
                value
              ) =>
                updateField(
                  "capture_location",
                  value
                )
              }
            />

            <Field
              label="Temps passé dans la rue"
              value={
                form.street_duration
              }
              onChange={(
                value
              ) =>
                updateField(
                  "street_duration",
                  value
                )
              }
            />
          </div>

          <div className="mt-5 space-y-5">
            <TextareaField
              label="Caractère"
              value={
                form.description_character
              }
              onChange={(
                value
              ) =>
                updateField(
                  "description_character",
                  value
                )
              }
            />

            <TextareaField
              label="État de santé"
              value={
                form.health_status
              }
              onChange={(
                value
              ) =>
                updateField(
                  "health_status",
                  value
                )
              }
            />

            <TextareaField
              label="Besoins particuliers"
              value={
                form.special_needs
              }
              onChange={(
                value
              ) =>
                updateField(
                  "special_needs",
                  value
                )
              }
            />

            <TextareaField
              label="Son histoire"
              value={
                form.story
              }
              onChange={(
                value
              ) =>
                updateField(
                  "story",
                  value
                )
              }
            />
          </div>
        </div>

        {/* COMPATIBILITE */}

        <div className="mt-7 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">
            Compatibilités
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <SelectField
              label="Chiens"
              value={
                form.compatible_chiens
              }
              onChange={(
                value
              ) =>
                updateField(
                  "compatible_chiens",
                  value
                )
              }
              options={[
                "Oui",
                "Non",
                "À tester",
                "Inconnu",
              ]}
            />

            <SelectField
              label="Chats"
              value={
                form.compatible_chats
              }
              onChange={(
                value
              ) =>
                updateField(
                  "compatible_chats",
                  value
                )
              }
              options={[
                "Oui",
                "Non",
                "À tester",
                "Inconnu",
              ]}
            />

            <SelectField
              label="Enfants"
              value={
                form.compatible_enfants
              }
              onChange={(
                value
              ) =>
                updateField(
                  "compatible_enfants",
                  value
                )
              }
              options={[
                "Oui",
                "Non",
                "À tester",
                "Inconnu",
              ]}
            />
          </div>
        </div>

        {/* SANTE */}

        <div className="mt-7 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">
            Santé & identification
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <CheckField
              label="Vacciné"
              checked={
                form.vaccinated
              }
              onChange={(
                checked
              ) =>
                updateField(
                  "vaccinated",
                  checked
                )
              }
            />

            <CheckField
              label="Stérilisé"
              checked={
                form.sterilized
              }
              onChange={(
                checked
              ) =>
                updateField(
                  "sterilized",
                  checked
                )
              }
            />

            <CheckField
              label="Identifié / pucé"
              checked={
                form.microchipped
              }
              onChange={(
                checked
              ) =>
                updateField(
                  "microchipped",
                  checked
                )
              }
            />
          </div>
        </div>

        {/* PHOTOS */}

        <div className="mt-7 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">
            Photos
          </h2>

          <p className="mt-2 text-sm text-[#6f5a47]">
            Maximum 5 photos. La première
            sera utilisée comme photo principale.
          </p>

          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d8e9e3] bg-[#f8f4ec] px-6 py-6 font-black">
            <Camera
              size={22}
            />

            Ajouter des photos

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={
                handlePhotos
              }
              className="hidden"
            />
          </label>

          {photoPreviews.length >
            0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {photoPreviews.map(
                (
                  preview,
                  index
                ) => (
                  <div
                    key={
                      `${preview}-${index}`
                    }
                    className="relative overflow-hidden rounded-2xl bg-[#f8f4ec]"
                  >
                    <img
                      src={
                        preview
                      }
                      alt={`Photo ${
                        index +
                        1
                      }`}
                      className="aspect-square h-full w-full object-cover"
                    />

                    {index ===
                      0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#064b42] px-2 py-1 text-xs font-black text-white">
                        Principale
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removePhoto(
                          index
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-white p-2 shadow"
                    >
                      <X
                        size={16}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* PUBLICATION */}

        <div className="mt-7 rounded-3xl bg-white p-6 shadow-sm">
          <label className="flex items-center justify-between gap-5">
            <div>
              <p className="font-black">
                Publier immédiatement
              </p>

              <p className="mt-1 text-sm text-[#6f5a47]">
                Si désactivé, la fiche sera
                créée mais restera non publiée.
              </p>
            </div>

            <input
              type="checkbox"
              checked={
                form.is_published
              }
              onChange={(
                event
              ) =>
                updateField(
                  "is_published",
                  event.target.checked
                )
              }
              className="h-6 w-6"
            />
          </label>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              void saveAnimal()
            }
            className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-8 py-4 text-lg font-black text-white shadow disabled:opacity-50"
          >
            <Save
              size={21}
            />

            {saving
              ? "Création en cours..."
              : "Créer et attribuer l’animal"}
          </button>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              router.push(
                "/admin/animals"
              )
            }
            className="min-h-[56px] rounded-2xl bg-white px-8 py-4 font-black shadow"
          >
            Annuler
          </button>
        </div>

        {!selectedOwnerId && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#fff4e5] p-4 text-[#8b653c]">
            <PawPrint
              size={22}
            />

            <p className="font-bold">
              Sélectionne d&apos;abord le
              profil propriétaire avant
              d&apos;enregistrer.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-black">
        {label}
      </span>

      <input
        type="text"
        value={
          value
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-[#d8e9e3] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-black">
        {label}
      </span>

      <textarea
        rows={4}
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-[#d8e9e3] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-black">
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-[#d8e9e3] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      >
        <option value="">
          Sélectionner
        </option>

        {options.map(
          (
            option
          ) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl bg-[#f8f4ec] p-4 font-black">
      {label}

      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.checked
          )
        }
        className="h-5 w-5"
      />
    </label>
  );
}