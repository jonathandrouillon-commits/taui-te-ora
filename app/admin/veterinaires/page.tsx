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
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (
        profileError
      ) {
        throw profileError;
      }

      const role =
        String(
          profile?.role ||
            ""
        )
          .trim()
          .toLowerCase();

      if (
        role !==
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
    const confirmation =
      window.confirm(
        `Supprimer définitivement ${
          item.clinic_name ||
          item.name
        } ?`
      );

    if (
      !confirmation
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
            (
              veterinaire
            ) =>
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
            (
              veterinaire
            ) =>
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
              (
                item
              ) =>
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
        (
          item
        ) => {
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
                  Administration
                </p>

                <h1 className="text-3xl font-black text-[#064b42] sm:text-4xl">
                  Gérer les vétérinaires
                </h1>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={
              openAddForm
            }
            className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-6 py-4 font-black text-white shadow-lg"
          >
            <Plus
              size={20}
            />

            Ajouter un vétérinaire
          </button>
        </div>

        {formOpen && (
          <section className="mt-7 rounded-[30px] bg-white p-5 shadow-xl sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-[#064b42]">
                {editingId
                  ? "Modifier le vétérinaire"
                  : "Ajouter un vétérinaire"}
              </h2>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eee6]"
              >
                <X
                  size={20}
                />
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
              />

              <Input
                label="Ville"
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
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Horaires"
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
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Toggle
                label="Urgences"
                description="Ce vétérinaire accepte les urgences."
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
                label="Visible"
                description="Afficher ce vétérinaire sur le site public."
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
                <Save
                  size={19}
                />

                {saving
                  ? "Enregistrement..."
                  : editingId
                    ? "Enregistrer les modifications"
                    : "Ajouter le vétérinaire"}
              </button>
            </div>
          </section>
        )}

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
                  className="w-full rounded-[18px] border border-[#e6dbd0] bg-[#fffaf7] py-3 pl-11 pr-4"
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
                className="w-full rounded-[18px] border border-[#e6dbd0] bg-[#fffaf7] px-4 py-3"
              >
                <option value="">
                  Toutes
                </option>

                {islands.map(
                  (
                    island
                  ) => (
                    <option
                      key={
                        island
                      }
                    >
                      {
                        island
                      }
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
                className="w-full rounded-[18px] border border-[#e6dbd0] bg-[#fffaf7] px-4 py-3"
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

        <section className="mt-6">
          {filteredVeterinaires.length ===
          0 ? (
            <div className="rounded-[30px] bg-white p-10 text-center shadow-md">
              <Stethoscope
                size={45}
                className="mx-auto text-[#b8aaa0]"
              />

              <p className="mt-4 font-black text-[#064b42]">
                Aucun vétérinaire.
              </p>
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
                    className="rounded-[28px] bg-white p-5 shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#e8f3ef]">
                        {item.photo_url ? (
                          <img
                            src={
                              item.photo_url
                            }
                            alt={
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
                        <h2 className="text-xl font-black text-[#064b42]">
                          {
                            item.clinic_name ||
                            item.name
                          }
                        </h2>

                        {item.clinic_name && (
                          <p className="mt-1 font-bold text-[#665e58]">
                            {
                              item.name
                            }
                          </p>
                        )}

                        {(item.city ||
                          item.island) && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
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

                        {item.emergency && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[10px] font-black uppercase text-red-600">
                            <Siren
                              size={12}
                            />

                            Urgence
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {item.phone && (
                        <p className="flex items-center gap-2 text-sm">
                          <Phone
                            size={16}
                          />

                          {
                            item.phone
                          }
                        </p>
                      )}

                      {item.email && (
                        <p className="flex items-center gap-2 break-all text-sm">
                          <Mail
                            size={16}
                          />

                          {
                            item.email
                          }
                        </p>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
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
                        onClick={() =>
                          deleteVeterinaire(
                            item
                          )
                        }
                        disabled={
                          deletingId ===
                          item.id
                        }
                        className="flex items-center justify-center gap-2 rounded-[16px] bg-red-50 px-3 py-3 text-sm font-black text-red-600 disabled:opacity-50"
                      >
                        <Trash2
                          size={16}
                        />

                        {deletingId ===
                        item.id
                          ? "..."
                          : "Supprimer"}
                      </button>
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <label>
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
        className="w-full rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 outline-none"
      />
    </label>
  );
}

function Textarea({
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
    <label>
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
        className="w-full resize-none rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 outline-none"
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
      className={`flex items-center justify-between gap-4 rounded-[20px] border-2 p-4 text-left ${
        checked
          ? "border-[#064b42] bg-[#edf7f4]"
          : "border-[#e8ded5] bg-[#fffaf7]"
      }`}
    >
      <div>
        <p className="font-black text-[#064b42]">
          {label}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {
            description
          }
        </p>
      </div>

      <span
        className={`relative h-7 w-12 rounded-full ${
          checked
            ? "bg-[#064b42]"
            : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </span>
    </button>
  );
}