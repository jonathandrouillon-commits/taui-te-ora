"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Check,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Siren,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

type Veterinaire = {
  id: string;

  created_at?: string;
  updated_at?: string;

  name: string;
  clinic_name: string | null;

  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;

  island: string | null;
  city: string | null;
  address: string | null;

  latitude: number | null;
  longitude: number | null;

  opening_hours: string | null;

  emergency: boolean;

  notes: string | null;

  photo_url: string | null;

  is_active: boolean;
};

type FormData = {
  name: string;
  clinic_name: string;

  phone: string;
  mobile: string;
  email: string;
  website: string;

  island: string;
  city: string;
  address: string;

  latitude: string;
  longitude: string;

  opening_hours: string;

  emergency: boolean;

  notes: string;

  photo_url: string;

  is_active: boolean;
};

const emptyForm: FormData = {
  name: "",
  clinic_name: "",

  phone: "",
  mobile: "",
  email: "",
  website: "",

  island: "",
  city: "",
  address: "",

  latitude: "",
  longitude: "",

  opening_hours: "",

  emergency: false,

  notes: "",

  photo_url: "",

  is_active: true,
};

export default function AdminVeterinairesPage() {
  const router =
    useRouter();

  const [
    veterinaires,
    setVeterinaires,
  ] =
    useState<Veterinaire[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    formOpen,
    setFormOpen,
  ] =
    useState(false);

  const [
    editingId,
    setEditingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<FormData>(
      emptyForm
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    islandFilter,
    setIslandFilter,
  ] =
    useState("");

  const [
    emergencyFilter,
    setEmergencyFilter,
  ] =
    useState("");

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth
          .getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/login?redirect=/admin/veterinaires"
        );

        return;
      }

      const {
        data:
          profile,
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
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
          profile?.role ||
            ""
        )
          .toLowerCase()
          .trim() !==
        "admin"
      ) {
        router.replace(
          "/"
        );

        return;
      }

      await loadVeterinaires();
    } catch (
      error: any
    ) {
      console.error(
        "Erreur administration vétérinaires :",
        error
      );

      alert(
        error?.message ||
          "Impossible de charger les vétérinaires."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadVeterinaires() {
    const {
      data,
      error,
    } =
      await supabase
        .from("veterinaires")
        .select("*")
        .order(
          "is_active",
          {
            ascending: false,
          }
        )
        .order(
          "island",
          {
            ascending: true,
          }
        )
        .order(
          "city",
          {
            ascending: true,
          }
        )
        .order(
          "name",
          {
            ascending: true,
          }
        );

    if (error) {
      throw error;
    }

    setVeterinaires(
      (data || []) as Veterinaire[]
    );
  }

  function updateField(
    field: keyof FormData,
    value:
      | string
      | boolean
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]:
          value,
      })
    );
  }

  function openAddForm() {
    setEditingId(
      null
    );

    setForm(
      emptyForm
    );

    setFormOpen(
      true
    );

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  function openEditForm(
    item: Veterinaire
  ) {
    setEditingId(
      item.id
    );

    setForm({
      name:
        item.name ||
        "",

      clinic_name:
        item.clinic_name ||
        "",

      phone:
        item.phone ||
        "",

      mobile:
        item.mobile ||
        "",

      email:
        item.email ||
        "",

      website:
        item.website ||
        "",

      island:
        item.island ||
        "",

      city:
        item.city ||
        "",

      address:
        item.address ||
        "",

      latitude:
        item.latitude !==
        null
          ? String(
              item.latitude
            )
          : "",

      longitude:
        item.longitude !==
        null
          ? String(
              item.longitude
            )
          : "",

      opening_hours:
        item.opening_hours ||
        "",

      emergency:
        Boolean(
          item.emergency
        ),

      notes:
        item.notes ||
        "",

      photo_url:
        item.photo_url ||
        "",

      is_active:
        item.is_active !==
        false,
    });

    setFormOpen(
      true
    );

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  function closeForm() {
    setFormOpen(
      false
    );

    setEditingId(
      null
    );

    setForm(
      emptyForm
    );
  }

  async function saveVeterinaire() {
    if (saving) {
      return;
    }

    if (
      !form.name.trim()
    ) {
      alert(
        "Merci de renseigner le nom du vétérinaire."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const latitude =
        form.latitude.trim()
          ? Number(
              form.latitude
                .replace(
                  ",",
                  "."
                )
            )
          : null;

      const longitude =
        form.longitude.trim()
          ? Number(
              form.longitude
                .replace(
                  ",",
                  "."
                )
            )
          : null;

      if (
        latitude !== null &&
        Number.isNaN(
          latitude
        )
      ) {
        alert(
          "Latitude invalide."
        );

        return;
      }

      if (
        longitude !== null &&
        Number.isNaN(
          longitude
        )
      ) {
        alert(
          "Longitude invalide."
        );

        return;
      }

      const payload = {
        name:
          form.name.trim(),

        clinic_name:
          form.clinic_name.trim() ||
          null,

        phone:
          form.phone.trim() ||
          null,

        mobile:
          form.mobile.trim() ||
          null,

        email:
          form.email.trim() ||
          null,

        website:
          form.website.trim() ||
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

        latitude,
        longitude,

        opening_hours:
          form.opening_hours.trim() ||
          null,

        emergency:
          form.emergency,

        notes:
          form.notes.trim() ||
          null,

        photo_url:
          form.photo_url.trim() ||
          null,

        is_active:
          form.is_active,
      };

      if (
        editingId
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "veterinaires"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editingId
            );

        if (error) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from(
              "veterinaires"
            )
            .insert(
              payload
            );

        if (error) {
          throw error;
        }
      }

      await loadVeterinaires();

      closeForm();

      alert(
        editingId
          ? "Vétérinaire modifié."
          : "Vétérinaire ajouté."
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur sauvegarde vétérinaire :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'enregistrer le vétérinaire."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function deleteVeterinaire(
    item: Veterinaire
  ) {
    const firstConfirmation =
      window.confirm(
        `Supprimer définitivement ${
          item.clinic_name ||
          item.name
        } ?`
      );

    if (
      !firstConfirmation
    ) {
      return;
    }

    const secondConfirmation =
      window.confirm(
        "Cette suppression est définitive. Confirmer ?"
      );

    if (
      !secondConfirmation
    ) {
      return;
    }

    try {
      setDeletingId(
        item.id
      );

      const {
        error,
      } =
        await supabase
          .from(
            "veterinaires"
          )
          .delete()
          .eq(
            "id",
            item.id
          );

      if (error) {
        throw error;
      }

      setVeterinaires(
        (previous) =>
          previous.filter(
            (veterinaire) =>
              veterinaire.id !==
              item.id
          )
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur suppression vétérinaire :",
        error
      );

      alert(
        error?.message ||
          "Impossible de supprimer le vétérinaire."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  async function toggleActive(
    item: Veterinaire
  ) {
    try {
      const newValue =
        !item.is_active;

      const {
        error,
      } =
        await supabase
          .from(
            "veterinaires"
          )
          .update({
            is_active:
              newValue,
          })
          .eq(
            "id",
            item.id
          );

      if (error) {
        throw error;
      }

      setVeterinaires(
        (previous) =>
          previous.map(
            (veterinaire) =>
              veterinaire.id ===
              item.id
                ? {
                    ...veterinaire,
                    is_active:
                      newValue,
                  }
                : veterinaire
          )
      );
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible de modifier le statut."
      );
    }
  }

  const islands =
    useMemo(() => {
      return Array.from(
        new Set(
          veterinaires
            .map(
              (item) =>
                item.island
                  ?.trim()
            )
            .filter(
              Boolean
            ) as string[]
        )
      ).sort(
        (
          a,
          b
        ) =>
          a.localeCompare(
            b,
            "fr"
          )
      );
    }, [
      veterinaires,
    ]);

  const filteredVeterinaires =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return veterinaires.filter(
        (item) => {
          if (
            islandFilter &&
            item.island !==
              islandFilter
          ) {
            return false;
          }

          if (
            emergencyFilter ===
              "yes" &&
            !item.emergency
          ) {
            return false;
          }

          if (
            emergencyFilter ===
              "no" &&
            item.emergency
          ) {
            return false;
          }

          if (
            !query
          ) {
            return true;
          }

          const text = [
            item.name,
            item.clinic_name,
            item.city,
            item.island,
            item.address,
            item.phone,
            item.mobile,
            item.email,
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
      veterinaires,
      search,
      islandFilter,
      emergencyFilter,
    ]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ef]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#e2d5c5] border-t-[#064b42]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement des vétérinaires...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/dashboard"
                )
              }
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[#6f665f]"
            >
              <ArrowLeft
                size={18}
              />

              Retour administration
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e3f2ee] text-[#064b42]">
                <Stethoscope
                  size={29}
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#df8995]">
                  Taui Te Ora
                </p>

                <h1 className="text-3xl font-black text-[#064b42] sm:text-4xl">
                  Vétérinaires
                </h1>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={
              openAddForm
            }
            className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-6 py-4 font-black text-white shadow-lg transition active:scale-[.98]"
          >
            <Plus
              size={20}
            />

            Ajouter un vétérinaire
          </button>
        </div>

        {/* =====================================================
            FORMULAIRE
        ====================================================== */}

        {formOpen && (
          <section className="mt-7 rounded-[30px] bg-white p-5 shadow-xl sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#df8995]">
                  Administration
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                  {editingId
                    ? "Modifier le vétérinaire"
                    : "Ajouter un vétérinaire"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eee6] text-[#645e59]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Input
                label="Nom du vétérinaire *"
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
                placeholder="Dr..."
              />

              <Input
                label="Nom de la clinique"
                value={
                  form.clinic_name
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "clinic_name",
                    value
                  )
                }
                placeholder="Clinique vétérinaire..."
              />

              <Input
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
                placeholder="40..."
              />

              <Input
                label="Mobile / urgence"
                value={
                  form.mobile
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "mobile",
                    value
                  )
                }
                placeholder="87..."
              />

              <Input
                label="Email"
                type="email"
                value={
                  form.email
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "email",
                    value
                  )
                }
                placeholder="contact@..."
              />

              <Input
                label="Site internet"
                value={
                  form.website
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "website",
                    value
                  )
                }
                placeholder="https://..."
              />

              <Input
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
                placeholder="Tahiti"
              />

              <Input
                label="Ville / commune"
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
                placeholder="Papeete"
              />

              <div className="md:col-span-2">
                <Input
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
                  placeholder="Adresse complète"
                />
              </div>

              <Input
                label="Latitude"
                value={
                  form.latitude
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "latitude",
                    value
                  )
                }
                placeholder="-17.535..."
              />

              <Input
                label="Longitude"
                value={
                  form.longitude
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "longitude",
                    value
                  )
                }
                placeholder="-149.56..."
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Horaires d'ouverture"
                  value={
                    form.opening_hours
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "opening_hours",
                      value
                    )
                  }
                  placeholder={
                    "Lundi - Vendredi : 8h00 - 17h00\nSamedi : 8h00 - 12h00"
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="URL photo / logo"
                  value={
                    form.photo_url
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "photo_url",
                      value
                    )
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  value={
                    form.notes
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "notes",
                      value
                    )
                  }
                  placeholder="Informations complémentaires..."
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Toggle
                label="Service d'urgence"
                description="Indiquer que ce vétérinaire peut gérer des urgences."
                checked={
                  form.emergency
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "emergency",
                    value
                  )
                }
              />

              <Toggle
                label="Visible sur le site"
                description="Désactiver pour masquer temporairement ce vétérinaire."
                checked={
                  form.is_active
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "is_active",
                    value
                  )
                }
              />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                className="rounded-full bg-[#f3eee9] px-6 py-3 font-black text-[#645e59]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={
                  saveVeterinaire
                }
                disabled={
                  saving
                }
                className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-7 py-3 font-black text-white shadow-lg disabled:opacity-60"
              >
                <Save size={19} />

                {saving
                  ? "Enregistrement..."
                  : editingId
                    ? "Enregistrer les modifications"
                    : "Ajouter le vétérinaire"}
              </button>
            </div>
          </section>
        )}

        {/* =====================================================
            FILTRES
        ====================================================== */}

        <section className="mt-7 rounded-[26px] bg-white p-5 shadow-md">
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-sm font-black text-[#064b42]">
                Rechercher
              </span>

              <div className="relative">
                <Search
                  size={18}
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
                  placeholder="Nom, clinique, ville..."
                  className="w-full rounded-[18px] border border-[#e6dbd0] bg-[#fffaf7] py-3 pl-11 pr-4 outline-none focus:border-[#064b42]"
                />
              </div>
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-[#064b42]">
                Île
              </span>

              <select
                value={
                  islandFilter
                }
                onChange={(
                  event
                ) =>
                  setIslandFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-[18px] border border-[#e6dbd0] bg-[#fffaf7] px-4 py-3 outline-none"
              >
                <option value="">
                  Toutes les îles
                </option>

                {islands.map(
                  (
                    island
                  ) => (
                    <option
                      key={
                        island
                      }
                      value={
                        island
                      }
                    >
                      {island}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-[#064b42]">
                Urgences
              </span>

              <select
                value={
                  emergencyFilter
                }
                onChange={(
                  event
                ) =>
                  setEmergencyFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-[18px] border border-[#e6dbd0] bg-[#fffaf7] px-4 py-3 outline-none"
              >
                <option value="">
                  Tous
                </option>

                <option value="yes">
                  Urgences
                </option>

                <option value="no">
                  Sans urgence
                </option>
              </select>
            </label>
          </div>
        </section>

        {/* =====================================================
            COMPTEUR
        ====================================================== */}

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-white px-4 py-2 font-black text-[#064b42] shadow-sm">
            {
              filteredVeterinaires.length
            }{" "}
            vétérinaire
            {filteredVeterinaires.length >
            1
              ? "s"
              : ""}
          </span>

          <span className="rounded-full bg-red-50 px-4 py-2 font-black text-red-600">
            {
              veterinaires.filter(
                (item) =>
                  item.emergency
              ).length
            }{" "}
            urgence(s)
          </span>
        </div>

        {/* =====================================================
            LISTE
        ====================================================== */}

        <section className="mt-6">
          {filteredVeterinaires.length ===
          0 ? (
            <div className="rounded-[30px] bg-white p-10 text-center shadow-md">
              <Stethoscope
                size={45}
                className="mx-auto text-[#b8aaa0]"
              />

              <p className="mt-4 font-black text-[#064b42]">
                Aucun vétérinaire trouvé.
              </p>

              <button
                type="button"
                onClick={
                  openAddForm
                }
                className="mt-5 rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
              >
                Ajouter un vétérinaire
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {filteredVeterinaires.map(
                (
                  item
                ) => (
                  <article
                    key={
                      item.id
                    }
                    className={`overflow-hidden rounded-[28px] bg-white shadow-lg ${
                      !item.is_active
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#e8f3ef]">
                          {item.photo_url ? (
                            <img
                              src={
                                item.photo_url
                              }
                              alt={
                                item.clinic_name ||
                                item.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Stethoscope
                              size={35}
                              className="text-[#064b42]"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-black text-[#064b42]">
                              {
                                item.clinic_name ||
                                item.name
                              }
                            </h2>

                            {item.emergency && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase text-red-600">
                                <Siren
                                  size={12}
                                />

                                Urgence
                              </span>
                            )}

                            {!item.is_active && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase text-gray-500">
                                Masqué
                              </span>
                            )}
                          </div>

                          {item.clinic_name &&
                            item.name && (
                              <p className="mt-1 font-bold text-[#665e58]">
                                {
                                  item.name
                                }
                              </p>
                            )}

                          {(item.city ||
                            item.island) && (
                            <p className="mt-2 flex items-center gap-1.5 text-sm text-[#6e6965]">
                              <MapPin
                                size={15}
                              />

                              {[
                                item.city,
                                item.island,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " · "
                                )}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 space-y-2">
                        {item.phone && (
                          <p className="flex items-center gap-2 text-sm text-[#5d5955]">
                            <Phone
                              size={16}
                              className="text-[#064b42]"
                            />

                            {
                              item.phone
                            }
                          </p>
                        )}

                        {item.mobile && (
                          <p className="flex items-center gap-2 text-sm text-[#5d5955]">
                            <Phone
                              size={16}
                              className="text-red-500"
                            />

                            {
                              item.mobile
                            }
                          </p>
                        )}

                        {item.email && (
                          <p className="flex items-center gap-2 break-all text-sm text-[#5d5955]">
                            <Mail
                              size={16}
                              className="shrink-0 text-[#064b42]"
                            />

                            {
                              item.email
                            }
                          </p>
                        )}

                        {item.address && (
                          <p className="flex items-start gap-2 text-sm text-[#5d5955]">
                            <MapPin
                              size={16}
                              className="mt-0.5 shrink-0 text-[#064b42]"
                            />

                            {
                              item.address
                            }
                          </p>
                        )}
                      </div>

                      {item.opening_hours && (
                        <div className="mt-4 rounded-[18px] bg-[#fffaf7] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b58b5b]">
                            Horaires
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#5d5955]">
                            {
                              item.opening_hours
                            }
                          </p>
                        </div>
                      )}

                      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              item
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-[16px] bg-[#064b42] px-3 py-3 text-sm font-black text-white"
                        >
                          <Edit3
                            size={16}
                          />

                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(
                              item
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-[16px] bg-[#f2ede7] px-3 py-3 text-sm font-black text-[#645e59]"
                        >
                          {item.is_active ? (
                            <>
                              <X
                                size={16}
                              />
                              Masquer
                            </>
                          ) : (
                            <>
                              <Check
                                size={16}
                              />
                              Publier
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            item.id
                          }
                          onClick={() =>
                            deleteVeterinaire(
                              item
                            )
                          }
                          className="col-span-2 flex items-center justify-center gap-2 rounded-[16px] bg-red-50 px-3 py-3 text-sm font-black text-red-600 disabled:opacity-50 sm:col-span-1"
                        >
                          <Trash2
                            size={16}
                          />

                          {deletingId ===
                          item.id
                            ? "Suppression..."
                            : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#064b42]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 text-[#4d4946] outline-none transition focus:border-[#064b42] focus:ring-2 focus:ring-[#064b42]/10"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
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
      <span className="mb-2 block text-sm font-black text-[#064b42]">
        {label}
      </span>

      <textarea
        rows={4}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full resize-none rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 text-[#4d4946] outline-none transition focus:border-[#064b42] focus:ring-2 focus:ring-[#064b42]/10"
      />
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !checked
        )
      }
      className={`flex items-center justify-between gap-4 rounded-[20px] border-2 p-4 text-left transition ${
        checked
          ? "border-[#064b42] bg-[#edf7f4]"
          : "border-[#e8ded5] bg-[#fffaf7]"
      }`}
    >
      <div>
        <p className="font-black text-[#064b42]">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#064b42]"
            : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </span>
    </button>
  );
}