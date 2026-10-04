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
  Eye,
  EyeOff,
  Mail,
  PawPrint,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../lib/supabase";

const PHOTO_BUCKET =
  "animals";

type Companion = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  color: string | null;
  weight: string | null;
  character: string | null;
  story: string | null;
  photo_url: string | null;
  identification_type: string | null;
  identification_number: string | null;
  sterilization_status: string | null;
  sterilization_date: string | null;
  sterilization_note: string | null;
  is_public: boolean;
  is_deceased: boolean;
  death_date: string | null;
  created_at: string;
  updated_at?: string | null;
};

type Profile = Record<
  string,
  any
> & {
  id: string;
};

type CompanionForm = {
  owner_id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  birth_date: string;
  color: string;
  weight: string;
  character: string;
  story: string;
  identification_type: string;
  identification_number: string;
  sterilization_status: string;
  sterilization_date: string;
  sterilization_note: string;
  is_public: boolean;
  is_deceased: boolean;
  death_date: string;
};

const EMPTY_FORM:
  CompanionForm = {
  owner_id: "",
  name: "",
  species: "",
  breed: "",
  sex: "",
  birth_date: "",
  color: "",
  weight: "",
  character: "",
  story: "",
  identification_type: "",
  identification_number: "",
  sterilization_status: "",
  sterilization_date: "",
  sterilization_note: "",
  is_public: false,
  is_deceased: false,
  death_date: "",
};

/* =========================================================
   PROFILS
========================================================= */

function getProfileName(
  profile?: Profile | null
) {
  if (!profile) {
    return "Utilisateur inconnu";
  }

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

  const firstName =
    String(
      profile.first_name ||
        profile.firstname ||
        ""
    ).trim();

  const lastName =
    String(
      profile.last_name ||
        profile.lastname ||
        ""
    ).trim();

  const complete =
    `${firstName} ${lastName}`.trim();

  if (complete) {
    return complete;
  }

  const displayName =
    String(
      profile.display_name ||
        profile.full_name ||
        profile.name ||
        ""
    ).trim();

  return (
    displayName ||
    "Utilisateur"
  );
}

function getProfileEmail(
  profile?: Profile | null
) {
  if (!profile) {
    return "";
  }

  return String(
    profile.email ||
      profile.contact_email ||
      profile.email_address ||
      ""
  ).trim();
}

function getProfilePhone(
  profile?: Profile | null
) {
  if (!profile) {
    return "";
  }

  return String(
    profile.phone ||
      profile.phone_number ||
      profile.telephone ||
      profile.mobile ||
      profile.mobile_phone ||
      ""
  ).trim();
}

function getProfileRole(
  profile?: Profile | null
) {
  if (!profile) {
    return "Compte inconnu";
  }

  const role =
    String(
      profile.role ||
        profile.account_type ||
        profile.profile_type ||
        ""
    )
      .trim()
      .toLowerCase();

  switch (role) {
    case "admin":
      return "Administrateur";

    case "association":
      return "Association";

    case "adoptant":
      return "Adoptant";

    case "benevole":
    case "bénévole":
      return "Bénévole";

    case "famille_accueil":
    case "famille d'accueil":
    case "foster":
      return "Famille d’accueil";

    default:
      return role
        ? role
        : "Utilisateur";
  }
}

/* =========================================================
   DATE CIVILE
========================================================= */

function normalizeDateInput(
  value: string | null
) {
  if (!value) {
    return "";
  }

  return String(value)
    .trim()
    .slice(0, 10);
}

function calculateAge(
  value: string | null
) {
  const normalized =
    normalizeDateInput(
      value
    );

  if (!normalized) {
    return "";
  }

  const match =
    normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return "";
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const today =
    new Date();

  let years =
    today.getFullYear() -
    year;

  let months =
    today.getMonth() -
    (month - 1);

  if (
    today.getDate() <
    day
  ) {
    months--;
  }

  if (
    months < 0
  ) {
    years--;
    months += 12;
  }

  if (
    years > 0
  ) {
    return `${years} an${
      years > 1
        ? "s"
        : ""
    }`;
  }

  if (
    months > 0
  ) {
    return `${months} mois`;
  }

  return "Moins d'un mois";
}

/* =========================================================
   STORAGE
========================================================= */

function getStoragePathFromUrl(
  photoUrl: string | null
) {
  if (!photoUrl) {
    return null;
  }

  try {
    const decoded =
      decodeURIComponent(
        photoUrl
      );

    const publicMarker =
      `/storage/v1/object/public/${PHOTO_BUCKET}/`;

    const signedMarker =
      `/storage/v1/object/sign/${PHOTO_BUCKET}/`;

    if (
      decoded.includes(
        publicMarker
      )
    ) {
      return (
        decoded
          .split(
            publicMarker
          )[1]
          ?.split("?")[0] ||
        null
      );
    }

    if (
      decoded.includes(
        signedMarker
      )
    ) {
      return (
        decoded
          .split(
            signedMarker
          )[1]
          ?.split("?")[0] ||
        null
      );
    }

    return null;
  } catch {
    return null;
  }
}

function getFileExtension(
  file: File
) {
  const extension =
    file.name
      .toLowerCase()
      .split(".")
      .pop();

  if (
    extension &&
    [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "heic",
      "heif",
    ].includes(
      extension
    )
  ) {
    return extension;
  }

  return "jpg";
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminCompanionsPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    companions,
    setCompanions,
  ] =
    useState<
      Companion[]
    >([]);

  const [
    profiles,
    setProfiles,
  ] =
    useState<
      Profile[]
    >([]);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    showDeceased,
    setShowDeceased,
  ] =
    useState(true);

  const [
    actionId,
    setActionId,
  ] =
    useState<
      string | null
    >(null);

  const [
    pendingPhotos,
    setPendingPhotos,
  ] = useState<Record<string, File>>({});

  const [
    pendingPhotoPreviews,
    setPendingPhotoPreviews,
  ] = useState<Record<string, string>>({});

  const [
    editing,
    setEditing,
  ] =
    useState<
      Companion | null
    >(null);

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<
      CompanionForm
    >(
      EMPTY_FORM
    );

  /* =======================================================
     PROFIL PAR ID
  ======================================================= */

  const profileMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          Profile
        >();

      profiles.forEach(
        (
          profile
        ) => {
          if (
            profile.id
          ) {
            map.set(
              profile.id,
              profile
            );
          }
        }
      );

      return map;
    }, [profiles]);

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  const loadData =
    useCallback(
      async () => {
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
          router.replace(
            "/login?redirect=/admin/companions"
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

        const [
          companionsResult,
          profilesResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "companions"
              )
              .select(`
                id,
                owner_id,
                name,
                species,
                breed,
                sex,
                birth_date,
                color,
                weight,
                character,
                story,
                photo_url,
                identification_type,
                identification_number,
                sterilization_status,
                sterilization_date,
                sterilization_note,
                is_public,
                is_deceased,
                death_date,
                created_at,
                updated_at
              `)
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "profiles"
              )
              .select("*"),
          ]);

        if (
          companionsResult.error
        ) {
          throw companionsResult.error;
        }

        if (
          profilesResult.error
        ) {
          throw profilesResult.error;
        }

        setCompanions(
          (
            companionsResult.data ||
            []
          ) as Companion[]
        );

        setProfiles(
          (
            profilesResult.data ||
            []
          ) as Profile[]
        );
      },
      [router]
    );

  useEffect(() => {
    let active =
      true;

    async function initialize() {
      try {
        setLoading(
          true
        );

        await loadData();
      } catch (
        error
      ) {
        console.error(
          "Erreur admin compagnons :",
          error
        );

        if (
          active
        ) {
          alert(
            error instanceof
              Error
              ? error.message
              : "Impossible de charger les compagnons."
          );
        }
      } finally {
        if (
          active
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void initialize();

    return () => {
      active =
        false;
    };
  }, [loadData]);

  /* =======================================================
     FILTRE
  ======================================================= */

  const filteredCompanions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return companions.filter(
        (
          companion
        ) => {
          if (
            !showDeceased &&
            companion.is_deceased
          ) {
            return false;
          }

          if (
            !query
          ) {
            return true;
          }

          const owner =
            profileMap.get(
              companion.owner_id
            );

          const haystack =
            [
              companion.name,
              companion.species,
              companion.breed,
              companion.sex,
              companion.identification_number,
              getProfileName(
                owner
              ),
              getProfileEmail(
                owner
              ),
              getProfilePhone(
                owner
              ),
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLowerCase();

          return haystack.includes(
            query
          );
        }
      );
    }, [
      companions,
      profileMap,
      search,
      showDeceased,
    ]);

  /* =======================================================
     FORMULAIRE
  ======================================================= */

  function updateField<
    K extends keyof CompanionForm
  >(
    key: K,
    value:
      CompanionForm[K]
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

  function openCreate() {
    setEditing(
      null
    );

    setForm(
      EMPTY_FORM
    );

    setCreating(
      true
    );
  }

  function openEdit(
    companion: Companion
  ) {
    setCreating(
      false
    );

    setEditing(
      companion
    );

    setForm({
      owner_id:
        companion.owner_id ||
        "",

      name:
        companion.name ||
        "",

      species:
        companion.species ||
        "",

      breed:
        companion.breed ||
        "",

      sex:
        companion.sex ||
        "",

      birth_date:
        normalizeDateInput(
          companion.birth_date
        ),

      color:
        companion.color ||
        "",

      weight:
        companion.weight ||
        "",

      character:
        companion.character ||
        "",

      story:
        companion.story ||
        "",

      identification_type:
        companion.identification_type ||
        "",

      identification_number:
        companion.identification_number ||
        "",

      sterilization_status:
        companion.sterilization_status ||
        "",

      sterilization_date:
        normalizeDateInput(
          companion.sterilization_date
        ),

      sterilization_note:
        companion.sterilization_note ||
        "",

      is_public:
        !!companion.is_public,

      is_deceased:
        !!companion.is_deceased,

      death_date:
        normalizeDateInput(
          companion.death_date
        ),
    });
  }

  function closeModal() {
    setEditing(
      null
    );

    setCreating(
      false
    );

    setForm(
      EMPTY_FORM
    );
  }

  /* =======================================================
     ENREGISTRER
  ======================================================= */

  async function saveCompanion() {
    if (
      !form.owner_id
    ) {
      alert(
        "Sélectionnez un propriétaire."
      );

      return;
    }

    if (
      !form.name.trim()
    ) {
      alert(
        "Le nom du compagnon est obligatoire."
      );

      return;
    }

    if (
      !form.species.trim()
    ) {
      alert(
        "L'espèce est obligatoire."
      );

      return;
    }

    try {
      setActionId(
        editing?.id ||
          "create"
      );

      const values = {
        owner_id:
          form.owner_id,

        name:
          form.name.trim(),

        species:
          form.species.trim(),

        breed:
          form.breed.trim() ||
          null,

        sex:
          form.sex.trim() ||
          null,

        birth_date:
          form.birth_date ||
          null,

        color:
          form.color.trim() ||
          null,

        weight:
          form.weight.trim() ||
          null,

        character:
          form.character.trim() ||
          null,

        story:
          form.story.trim() ||
          null,

        identification_type:
          form.identification_type ||
          null,

        identification_number:
          form.identification_number.trim() ||
          null,

        sterilization_status:
          form.sterilization_status ||
          null,

        sterilization_date:
          form.sterilization_date ||
          null,

        sterilization_note:
          form.sterilization_note.trim() ||
          null,

        is_public:
          form.is_public,

        is_deceased:
          form.is_deceased,

        death_date:
          form.is_deceased
            ? form.death_date ||
              null
            : null,

        updated_at:
          new Date().toISOString(),
      };

      if (
        editing
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "companions"
            )
            .update(
              values
            )
            .eq(
              "id",
              editing.id
            );

        if (
          error
        ) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from(
              "companions"
            )
            .insert({
              ...values,

              created_at:
                new Date().toISOString(),
            });

        if (
          error
        ) {
          throw error;
        }
      }

      await loadData();

      closeModal();
    } catch (
      error
    ) {
      console.error(
        "Erreur sauvegarde compagnon :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible d'enregistrer le compagnon."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =======================================================
     PUBLIC / PRIVE
  ======================================================= */

  async function toggleVisibility(
    companion: Companion
  ) {
    try {
      setActionId(
        companion.id
      );

      const {
        error,
      } =
        await supabase
          .from(
            "companions"
          )
          .update({
            is_public:
              !companion.is_public,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            companion.id
          );

      if (
        error
      ) {
        throw error;
      }

      await loadData();
    } catch (
      error
    ) {
      console.error(
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Modification impossible."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =======================================================
     PHOTO
  ======================================================= */

  function changePhoto(
    companion: Companion,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Sélectionnez une image.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert("Photo trop lourde. Maximum 15 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const preview = typeof reader.result === "string" ? reader.result : "";
      setPendingPhotos((previous) => ({ ...previous, [companion.id]: file }));
      setPendingPhotoPreviews((previous) => ({ ...previous, [companion.id]: preview }));
    };
    reader.onerror = () => alert("Impossible de lire cette image.");
    reader.readAsDataURL(file);
  }

  function cancelPendingPhoto(companionId: string) {
    setPendingPhotos((previous) => {
      const next = { ...previous };
      delete next[companionId];
      return next;
    });
    setPendingPhotoPreviews((previous) => {
      const next = { ...previous };
      delete next[companionId];
      return next;
    });
  }

  async function savePhoto(companion: Companion) {
    const file = pendingPhotos[companion.id];
    if (!file) {
      alert("Choisissez d'abord une photo.");
      return;
    }

    try {
      setActionId(companion.id);
      const extension = getFileExtension(file);
      const path = `companions/${companion.owner_id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      const newUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from("companions")
        .update({ photo_url: newUrl, updated_at: new Date().toISOString() })
        .eq("id", companion.id);

      if (updateError) {
        await supabase.storage.from(PHOTO_BUCKET).remove([path]);
        throw updateError;
      }

      const oldPath = getStoragePathFromUrl(companion.photo_url);
      if (oldPath && oldPath !== path) {
        const { error: removeError } = await supabase.storage.from(PHOTO_BUCKET).remove([oldPath]);
        if (removeError) console.warn("Ancienne photo non supprimée :", removeError);
      }

      cancelPendingPhoto(companion.id);
      await loadData();
      alert("Photo sauvegardée.");
    } catch (error) {
      console.error("Erreur sauvegarde photo :", error);
      alert(error instanceof Error ? error.message : "Impossible de sauvegarder la photo.");
    } finally {
      setActionId(null);
    }
  }

  async function deletePhoto(
    companion: Companion
  ) {
    if (
      !companion.photo_url
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Supprimer la photo de ${companion.name} ?`
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setActionId(
        companion.id
      );

      const oldPath =
        getStoragePathFromUrl(
          companion.photo_url
        );

      const {
        error,
      } =
        await supabase
          .from(
            "companions"
          )
          .update({
            photo_url:
              null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            companion.id
          );

      if (
        error
      ) {
        throw error;
      }

      if (
        oldPath
      ) {
        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              PHOTO_BUCKET
            )
            .remove([
              oldPath,
            ]);

        if (
          storageError
        ) {
          console.warn(
            storageError
          );
        }
      }

      await loadData();
    } catch (
      error
    ) {
      console.error(
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible de supprimer la photo."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =======================================================
     SUPPRESSION COMPAGNON
  ======================================================= */

  async function deleteCompanion(
    companion: Companion
  ) {
    const first =
      window.confirm(
        `Supprimer définitivement ${companion.name} ?`
      );

    if (!first) {
      return;
    }

    const second =
      window.confirm(
        "Cette action est définitive. Confirmer une seconde fois ?"
      );

    if (
      !second
    ) {
      return;
    }

    try {
      setActionId(
        companion.id
      );

      const oldPath =
        getStoragePathFromUrl(
          companion.photo_url
        );

      const {
        error,
      } =
        await supabase
          .from(
            "companions"
          )
          .delete()
          .eq(
            "id",
            companion.id
          );

      if (
        error
      ) {
        throw error;
      }

      if (
        oldPath
      ) {
        await supabase.storage
          .from(
            PHOTO_BUCKET
          )
          .remove([
            oldPath,
          ]);
      }

      await loadData();
    } catch (
      error
    ) {
      console.error(
        "Erreur suppression compagnon :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible de supprimer le compagnon."
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e7d8c6] border-t-[#064b42]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement des compagnons...
          </p>

        </div>

      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 pb-20 pt-24 text-[#064b42] sm:px-8">

      <section className="mx-auto max-w-7xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/dashboard"
            )
          }
          className="mb-6 flex items-center gap-2 font-black"
        >
          <ArrowLeft
            size={20}
          />

          Retour dashboard
        </button>

        {/* HEADER */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b68b2f]">
              Administration
            </p>

            <h1 className="mt-1 text-4xl font-black sm:text-5xl">
              Tous les Compagnons
            </h1>

            <p className="mt-2 text-[#6f5a47]">
              Gestion des compagnons enregistrés par les utilisateurs de Taui Te Ora.
            </p>

          </div>

          <button
            type="button"
            onClick={
              openCreate
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white shadow"
          >
            <Plus
              size={19}
            />

            Ajouter un compagnon
          </button>

        </div>

        {/* STATISTIQUES */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <Stat
            label="Compagnons"
            value={
              companions.length
            }
          />

          <Stat
            label="Publics"
            value={
              companions.filter(
                (
                  item
                ) =>
                  item.is_public
              ).length
            }
          />

          <Stat
            label="Utilisateurs concernés"
            value={
              new Set(
                companions.map(
                  (
                    item
                  ) =>
                    item.owner_id
                )
              ).size
            }
          />

        </div>

        {/* RECHERCHE */}

        <div className="mt-6 rounded-3xl border border-[#eadfce] bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

            <div className="relative flex-1">

              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Rechercher un animal, propriétaire, email, téléphone..."
                className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] py-4 pl-12 pr-4 font-bold outline-none"
              />

            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-[#faf7f2] px-4 py-3 font-bold">

              <input
                type="checkbox"
                checked={
                  showDeceased
                }
                onChange={(
                  event
                ) =>
                  setShowDeceased(
                    event.target.checked
                  )
                }
              />

              Afficher les compagnons décédés

            </label>

          </div>

          <p className="mt-4 text-sm font-bold text-[#6f5a47]">
            {
              filteredCompanions.length
            } compagnon
            {
              filteredCompanions.length >
              1
                ? "s"
                : ""
            } affiché
            {
              filteredCompanions.length >
              1
                ? "s"
                : ""
            }
          </p>

        </div>

        {/* LISTE */}

        <div className="mt-8 space-y-5">

          {filteredCompanions.length ===
          0 ? (

            <div className="rounded-3xl bg-white p-10 text-center shadow">

              <PawPrint
                size={42}
                className="mx-auto text-[#df8995]"
              />

              <h2 className="mt-4 text-2xl font-black">
                Aucun compagnon
              </h2>

            </div>

          ) : (

            filteredCompanions.map(
              (
                companion
              ) => {
                const owner =
                  profileMap.get(
                    companion.owner_id
                  );

                const ownerName =
                  getProfileName(
                    owner
                  );

                const email =
                  getProfileEmail(
                    owner
                  );

                const phone =
                  getProfilePhone(
                    owner
                  );

                const role =
                  getProfileRole(
                    owner
                  );

                const age =
                  calculateAge(
                    companion.birth_date
                  );

                const processing =
                  actionId ===
                  companion.id;

                return (
                  <article
                    key={
                      companion.id
                    }
                    className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white shadow-sm"
                  >

                    <div className="grid lg:grid-cols-[230px_1fr]">

                      {/* PHOTO */}

                      <div className="relative min-h-[230px] bg-[#f3eee5]">

                        {(pendingPhotoPreviews[companion.id] || companion.photo_url) ? (

                          <img
                            src={
                              pendingPhotoPreviews[companion.id] || companion.photo_url || ""
                            }
                            alt={
                              companion.name
                            }
                            className="h-full min-h-[230px] w-full object-cover"
                          />

                        ) : (

                          <div className="flex h-full min-h-[230px] items-center justify-center">

                            <PawPrint
                              size={64}
                              className="text-[#d8c7b4]"
                            />

                          </div>

                        )}

                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">

                          <label
                            htmlFor={`photo-${companion.id}`}
                            className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black shadow"
                          >

                            <Camera
                              size={15}
                            />

                            {companion.photo_url
                              ? "Changer"
                              : "Ajouter"}

                          </label>

                          <input
                            id={`photo-${companion.id}`}
                            type="file"
                            accept="image/*"
                            disabled={
                              processing
                            }
                            onChange={(
                              event
                            ) =>
                              changePhoto(
                                companion,
                                event
                              )
                            }
                            className="hidden"
                          />

                          {pendingPhotos[companion.id] && (
                            <>
                              <button
                                type="button"
                                disabled={processing}
                                onClick={() => void savePhoto(companion)}
                                className="flex items-center gap-2 rounded-full bg-[#064b42] px-3 py-2 text-xs font-black text-white shadow disabled:opacity-50"
                              >
                                {processing ? "Sauvegarde..." : "Sauvegarder la photo"}
                              </button>
                              <button
                                type="button"
                                disabled={processing}
                                onClick={() => cancelPendingPhoto(companion.id)}
                                className="flex items-center gap-2 rounded-full bg-[#f8f4ec] px-3 py-2 text-xs font-black text-[#064b42] shadow disabled:opacity-50"
                              >
                                Annuler
                              </button>
                            </>
                          )}

                          {companion.photo_url && (

                            <button
                              type="button"
                              disabled={
                                processing
                              }
                              onClick={() =>
                                deletePhoto(
                                  companion
                                )
                              }
                              className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-2 text-xs font-black text-white shadow"
                            >
                              <Trash2
                                size={14}
                              />

                              Photo
                            </button>

                          )}

                        </div>

                      </div>

                      {/* CONTENU */}

                      <div className="p-6">

                        <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">

                          <div>

                            <div className="flex flex-wrap items-center gap-3">

                              <h2 className="text-3xl font-black text-[#2f241c]">
                                {
                                  companion.name
                                }
                              </h2>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  companion.is_public
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {companion.is_public
                                  ? "Public"
                                  : "Privé"}
                              </span>

                              {companion.is_deceased && (

                                <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-black text-white">
                                  Décédé
                                </span>

                              )}

                            </div>

                            <p className="mt-2 font-bold text-[#6f5a47]">

                              {companion.species ||
                                "Espèce inconnue"}

                              {companion.sex
                                ? ` • ${companion.sex}`
                                : ""}

                              {age
                                ? ` • ${age}`
                                : ""}

                              {companion.breed
                                ? ` • ${companion.breed}`
                                : ""}

                            </p>

                          </div>

                          {/* ACTIONS */}

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              disabled={
                                processing
                              }
                              onClick={() =>
                                toggleVisibility(
                                  companion
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-[#f8f4ec] px-4 py-3 font-black"
                            >

                              {companion.is_public ? (
                                <EyeOff
                                  size={17}
                                />
                              ) : (
                                <Eye
                                  size={17}
                                />
                              )}

                              {companion.is_public
                                ? "Rendre privé"
                                : "Rendre public"}

                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  companion
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-[#9c7b54] px-4 py-3 font-black text-white"
                            >
                              <Pencil
                                size={17}
                              />

                              Modifier
                            </button>

                            <button
                              type="button"
                              disabled={
                                processing
                              }
                              onClick={() =>
                                deleteCompanion(
                                  companion
                                )
                              }
                              className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700"
                            >
                              <Trash2
                                size={17}
                              />

                              Supprimer
                            </button>

                          </div>

                        </div>

                        {/* PROPRIETAIRE */}

                        <div className="mt-6 rounded-2xl bg-[#f8f4ec] p-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#064b42] shadow-sm">

                              <User
                                size={20}
                              />

                            </div>

                            <div>

                              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#9c7b54]">
                                Propriétaire
                              </p>

                              <p className="text-lg font-black text-[#2f241c]">
                                {
                                  ownerName
                                }
                              </p>

                              <p className="text-sm font-bold text-[#6f5a47]">
                                {
                                  role
                                }
                              </p>

                            </div>

                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">

                            {email ? (

                              <a
                                href={`mailto:${email}`}
                                className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#064b42] shadow-sm"
                              >
                                <Mail
                                  size={17}
                                />

                                {email}
                              </a>

                            ) : (

                              <span className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-400">
                                Email non renseigné
                              </span>

                            )}

                            {phone ? (

                              <a
                                href={`tel:${phone}`}
                                className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#064b42] shadow-sm"
                              >
                                <Phone
                                  size={17}
                                />

                                {phone}
                              </a>

                            ) : (

                              <span className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-400">
                                Téléphone non renseigné
                              </span>

                            )}

                          </div>

                        </div>

                        {/* DETAILS */}

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                          <Info
                            label="Identification"
                            value={
                              companion.identification_number
                                ? `${
                                    companion.identification_type ===
                                    "tatouage"
                                      ? "Tatouage"
                                      : "Puce"
                                  } ${companion.identification_number}`
                                : "Non renseignée"
                            }
                          />

                          <Info
                            label="Stérilisation"
                            value={
                              companion.sterilization_status ||
                              "Non renseignée"
                            }
                          />

                          <Info
                            label="Couleur"
                            value={
                              companion.color ||
                              "Non renseignée"
                            }
                          />

                        </div>

                      </div>

                    </div>

                  </article>
                );
              }
            )

          )}

        </div>

      </section>

      {/* =====================================================
          MODAL CREATION / MODIFICATION
      ====================================================== */}

      {(creating ||
        editing) && (

        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10">

          <div className="w-full max-w-4xl rounded-[32px] bg-white p-6 shadow-2xl sm:p-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df8995]">
                  Administration
                </p>

                <h2 className="mt-1 text-3xl font-black text-[#064b42]">
                  {editing
                    ? "Modifier le compagnon"
                    : "Ajouter un compagnon"}
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-full bg-[#f8f4ec] p-3"
              >
                <X
                  size={20}
                />
              </button>

            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">

              <FormSelect
                label="Propriétaire"
                value={
                  form.owner_id
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "owner_id",
                    value
                  )
                }
                options={
                  profiles
                    .map(
                      (
                        profile
                      ) => ({
                        value:
                          profile.id,

                        label:
                          `${getProfileName(
                            profile
                          )} — ${getProfileRole(
                            profile
                          )}`,
                      })
                    )
                    .sort(
                      (
                        a,
                        b
                      ) =>
                        a.label.localeCompare(
                          b.label,
                          "fr"
                        )
                    )
                }
              />

              <FormInput
                label="Nom"
                value={
                  form.name
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "name",
                    value
                  )
                }
              />

              <FormSelect
                label="Espèce"
                value={
                  form.species
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "species",
                    value
                  )
                }
                options={[
                  {
                    value:
                      "chien",
                    label:
                      "Chien",
                  },
                  {
                    value:
                      "chat",
                    label:
                      "Chat",
                  },
                  {
                    value:
                      "cheval",
                    label:
                      "Cheval",
                  },
                  {
                    value:
                      "oiseau",
                    label:
                      "Oiseau",
                  },
                  {
                    value:
                      "autre",
                    label:
                      "Autre",
                  },
                ]}
              />

              <FormInput
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

              <FormSelect
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
                  {
                    value:
                      "male",
                    label:
                      "Mâle",
                  },
                  {
                    value:
                      "female",
                    label:
                      "Femelle",
                  },
                ]}
              />

              <FormInput
                label="Date de naissance"
                type="date"
                value={
                  form.birth_date
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "birth_date",
                    value
                  )
                }
              />

              <FormInput
                label="Couleur"
                value={
                  form.color
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "color",
                    value
                  )
                }
              />

              <FormInput
                label="Poids"
                value={
                  form.weight
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "weight",
                    value
                  )
                }
              />

              <FormSelect
                label="Identification"
                value={
                  form.identification_type
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "identification_type",
                    value
                  )
                }
                options={[
                  {
                    value:
                      "puce",
                    label:
                      "Puce",
                  },
                  {
                    value:
                      "tatouage",
                    label:
                      "Tatouage",
                  },
                ]}
              />

              <FormInput
                label="Numéro d'identification"
                value={
                  form.identification_number
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "identification_number",
                    value
                  )
                }
              />

              <FormSelect
                label="Stérilisation"
                value={
                  form.sterilization_status
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "sterilization_status",
                    value
                  )
                }
                options={[
                  {
                    value:
                      "oui",
                    label:
                      "Oui",
                  },
                  {
                    value:
                      "non",
                    label:
                      "Non",
                  },
                  {
                    value:
                      "en_cours",
                    label:
                      "En cours",
                  },
                ]}
              />

              <FormInput
                label="Date de stérilisation"
                type="date"
                value={
                  form.sterilization_date
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "sterilization_date",
                    value
                  )
                }
              />

            </div>

            <div className="mt-5">

              <FormTextarea
                label="Caractère"
                value={
                  form.character
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "character",
                    value
                  )
                }
              />

            </div>

            <div className="mt-5">

              <FormTextarea
                label="Histoire"
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

            <div className="mt-5">

              <FormTextarea
                label="Note stérilisation"
                value={
                  form.sterilization_note
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "sterilization_note",
                    value
                  )
                }
              />

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <label className="flex items-center justify-between rounded-2xl bg-[#f8f4ec] p-4 font-black">

                Visible dans la communauté

                <input
                  type="checkbox"
                  checked={
                    form.is_public
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "is_public",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5"
                />

              </label>

              <label className="flex items-center justify-between rounded-2xl bg-[#f8f4ec] p-4 font-black">

                Compagnon décédé

                <input
                  type="checkbox"
                  checked={
                    form.is_deceased
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "is_deceased",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5"
                />

              </label>

            </div>

            {form.is_deceased && (

              <div className="mt-5">

                <FormInput
                  label="Date de décès"
                  type="date"
                  value={
                    form.death_date
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "death_date",
                      value
                    )
                  }
                />

              </div>

            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                disabled={
                  !!actionId
                }
                onClick={
                  saveCompanion
                }
                className="rounded-2xl bg-[#064b42] px-7 py-4 font-black text-white disabled:opacity-50"
              >
                {actionId
                  ? "Enregistrement..."
                  : editing
                    ? "Enregistrer les modifications"
                    : "Créer le compagnon"}
              </button>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-2xl bg-[#f8f4ec] px-7 py-4 font-black text-[#064b42]"
              >
                Annuler
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Stat({
  label,
  value,
}: {
  label:
    string;
  value:
    number;
}) {
  return (
    <div className="rounded-3xl border border-[#eadfce] bg-white p-5 shadow-sm">

      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9c7b54]">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black text-[#064b42]">
        {value}
      </p>

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label:
    string;
  value:
    string;
}) {
  return (
    <div className="rounded-2xl bg-[#faf7f2] p-4">

      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#9c7b54]">
        {label}
      </p>

      <p className="mt-1 font-bold text-[#2f241c]">
        {value}
      </p>

    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label:
    string;
  value:
    string;
  onChange:
    (
      value:
        string
    ) => void;
  type?:
    string;
}) {
  return (
    <label className="block">

      <span className="mb-2 block font-black text-[#064b42]">
        {label}
      </span>

      <input
        type={
          type
        }
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
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />

    </label>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
}: {
  label:
    string;
  value:
    string;
  onChange:
    (
      value:
        string
    ) => void;
}) {
  return (
    <label className="block">

      <span className="mb-2 block font-black text-[#064b42]">
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
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />

    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label:
    string;
  value:
    string;
  onChange:
    (
      value:
        string
    ) => void;
  options:
    Array<{
      value:
        string;
      label:
        string;
    }>;
}) {
  return (
    <label className="block">

      <span className="mb-2 block font-black text-[#064b42]">
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
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
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
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>

          )
        )}

      </select>

    </label>
  );
}