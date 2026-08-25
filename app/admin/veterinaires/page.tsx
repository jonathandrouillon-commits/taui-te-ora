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
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

type Veterinaire = {
  id: string;
  island: string | null;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active?: boolean | null;
};

type FormData = {
  island: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
};

const emptyForm: FormData = {
  island: "",
  name: "",
  city: "",
  address: "",
  phone: "",
  email: "",
};

export default function AdminVeterinairesPage() {
  const router = useRouter();

  const [
    veterinaires,
    setVeterinaires,
  ] = useState<Veterinaire[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null
  );

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState<FormData>(
    emptyForm
  );

  const [
    search,
    setSearch,
  ] = useState("");

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

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
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
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
        role !== "admin"
      ) {
        router.replace("/");
        return;
      }

      await loadVeterinaires();
    } catch (error: any) {
      console.error(
        "Erreur admin vétérinaires :",
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
        .select(
          `
            id,
            island,
            name,
            city,
            address,
            phone,
            email,
            is_active
          `
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
    value: string
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  function openAddForm() {
    setEditingId(null);

    setForm(
      emptyForm
    );

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openEditForm(
    item: Veterinaire
  ) {
    setEditingId(
      item.id
    );

    setForm({
      island:
        item.island || "",

      name:
        item.name || "",

      city:
        item.city || "",

      address:
        item.address || "",

      phone:
        item.phone || "",

      email:
        item.email || "",
    });

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveVeterinaire() {
    if (saving) {
      return;
    }

    if (
      !form.name.trim()
    ) {
      alert(
        "Le nom du vétérinaire ou de la clinique est obligatoire."
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        island:
          form.island.trim() ||
          null,

        name:
          form.name.trim(),

        city:
          form.city.trim() ||
          null,

        address:
          form.address.trim() ||
          null,

        phone:
          form.phone.trim() ||
          null,

        email:
          form.email.trim() ||
          null,

        is_active: true,
      };

      if (editingId) {
        const {
          error,
        } =
          await supabase
            .from("veterinaires")
            .update(payload)
            .eq(
              "id",
              editingId
            );

        if (error) {
          throw error;
        }

        alert(
          "Contact vétérinaire modifié."
        );
      } else {
        const {
          error,
        } =
          await supabase
            .from("veterinaires")
            .insert(payload);

        if (error) {
          throw error;
        }

        alert(
          "Contact vétérinaire ajouté."
        );
      }

      await loadVeterinaires();

      closeForm();
    } catch (error: any) {
      console.error(
        "Erreur sauvegarde vétérinaire :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'enregistrer le contact."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteVeterinaire(
    item: Veterinaire
  ) {
    const confirmed =
      window.confirm(
        `Supprimer définitivement "${item.name}" ?`
      );

    if (!confirmed) {
      return;
    }

    const confirmedAgain =
      window.confirm(
        "Cette suppression est définitive. Confirmer ?"
      );

    if (
      !confirmedAgain
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
          .from("veterinaires")
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

      alert(
        "Contact vétérinaire supprimé."
      );
    } catch (error: any) {
      console.error(
        "Erreur suppression vétérinaire :",
        error
      );

      alert(
        error?.message ||
          "Impossible de supprimer le contact."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredVeterinaires =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return veterinaires;
      }

      return veterinaires.filter(
        (item) => {
          const searchable =
            [
              item.island,
              item.name,
              item.city,
              item.address,
              item.phone,
              item.email,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      veterinaires,
      search,
    ]);

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-[100dvh]
          items-center
          justify-center
          bg-[#fbf7ef]
        "
      >
        <div
          className="
            text-center
          "
        >
          <div
            className="
              mx-auto
              h-12
              w-12
              animate-spin
              rounded-full
              border-4
              border-[#e2d5c5]
              border-t-[#064b42]
            "
          />

          <p
            className="
              mt-4
              font-black
              text-[#064b42]
            "
          >
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-[100dvh]
        bg-[#fbf7ef]
        px-4
        pb-24
        pt-6
        sm:px-6
      "
    >
      <section
        className="
          mx-auto
          max-w-6xl
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/dashboard"
                )
              }
              className="
                mb-4
                flex
                items-center
                gap-2
                text-sm
                font-black
                text-[#6f665f]
              "
            >
              <ArrowLeft
                size={18}
              />

              Retour administration
            </button>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-[#e3f2ee]
                  text-[#064b42]
                "
              >
                <Stethoscope
                  size={28}
                />
              </div>

              <div>
                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-[#df8995]
                  "
                >
                  Administration
                </p>

                <h1
                  className="
                    text-3xl
                    font-black
                    text-[#064b42]
                  "
                >
                  Contacts vétérinaires
                </h1>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={
              openAddForm
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-full
              bg-[#064b42]
              px-6
              py-4
              font-black
              text-white
              shadow-lg
            "
          >
            <Plus
              size={20}
            />

            Ajouter
          </button>
        </div>

        {/* FORMULAIRE */}

        {formOpen && (
          <section
            className="
              mt-7
              rounded-[30px]
              bg-white
              p-5
              shadow-xl
              sm:p-7
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <h2
                className="
                  text-2xl
                  font-black
                  text-[#064b42]
                "
              >
                {editingId
                  ? "Modifier le contact"
                  : "Ajouter un contact"}
              </h2>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-[#f5eee6]
                "
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div
              className="
                mt-6
                grid
                gap-5
                md:grid-cols-2
              "
            >
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
                label="Nom *"
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

              <div
                className="
                  md:col-span-2
                "
              >
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

              <div
                className="
                  md:col-span-2
                "
              >
                <Input
                  label="Mail"
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
              </div>
            </div>

            <div
              className="
                mt-7
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:justify-end
              "
            >
              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                className="
                  rounded-full
                  bg-[#f3eee9]
                  px-6
                  py-3
                  font-black
                  text-[#645e59]
                "
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
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-[#064b42]
                  px-7
                  py-3
                  font-black
                  text-white
                  shadow-lg
                  disabled:opacity-60
                "
              >
                <Save
                  size={18}
                />

                {saving
                  ? "Enregistrement..."
                  : editingId
                    ? "Enregistrer les modifications"
                    : "Ajouter le contact"}
              </button>
            </div>
          </section>
        )}

        {/* RECHERCHE */}

        <section
          className="
            mt-7
            rounded-[24px]
            bg-white
            p-4
            shadow-md
          "
        >
          <label>
            <span
              className="
                mb-2
                block
                text-sm
                font-black
                text-[#064b42]
              "
            >
              Rechercher
            </span>

            <div
              className="
                relative
              "
            >
              <Search
                size={18}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
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
                placeholder="Nom, île, ville, téléphone..."
                className="
                  w-full
                  rounded-[18px]
                  border
                  border-[#e5d9cf]
                  bg-[#fffaf7]
                  py-3
                  pl-11
                  pr-4
                  outline-none
                "
              />
            </div>
          </label>
        </section>

        {/* LISTE */}

        <div
          className="
            mt-5
            font-black
            text-[#064b42]
          "
        >
          {
            filteredVeterinaires.length
          }{" "}
          contact
          {filteredVeterinaires.length >
          1
            ? "s"
            : ""}
        </div>

        <section
          className="
            mt-5
            grid
            gap-5
            md:grid-cols-2
          "
        >
          {filteredVeterinaires.map(
            (
              item
            ) => (
              <article
                key={
                  item.id
                }
                className="
                  rounded-[28px]
                  bg-white
                  p-5
                  shadow-lg
                "
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    {item.island && (
                      <span
                        className="
                          rounded-full
                          bg-[#e8f4f1]
                          px-3
                          py-1
                          text-xs
                          font-black
                          uppercase
                          text-[#064b42]
                        "
                      >
                        {
                          item.island
                        }
                      </span>
                    )}

                    <h2
                      className="
                        mt-3
                        text-xl
                        font-black
                        text-[#064b42]
                      "
                    >
                      {
                        item.name
                      }
                    </h2>
                  </div>

                  <Stethoscope
                    size={26}
                    className="
                      text-[#df8995]
                    "
                  />
                </div>

                <div
                  className="
                    mt-5
                    space-y-3
                    text-sm
                    text-gray-700
                  "
                >
                  {item.city && (
                    <p
                      className="
                        flex
                        gap-2
                      "
                    >
                      <MapPin
                        size={16}
                      />

                      {
                        item.city
                      }
                    </p>
                  )}

                  {item.address && (
                    <p
                      className="
                        flex
                        gap-2
                      "
                    >
                      <MapPin
                        size={16}
                      />

                      {
                        item.address
                      }
                    </p>
                  )}

                  {item.phone && (
                    <p
                      className="
                        flex
                        gap-2
                      "
                    >
                      <Phone
                        size={16}
                      />

                      {
                        item.phone
                      }
                    </p>
                  )}

                  {item.email && (
                    <p
                      className="
                        flex
                        gap-2
                        break-all
                      "
                    >
                      <Mail
                        size={16}
                      />

                      {
                        item.email
                      }
                    </p>
                  )}
                </div>

                <div
                  className="
                    mt-6
                    grid
                    grid-cols-2
                    gap-3
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(
                        item
                      )
                    }
                    className="
                      flex
                      items-center
                      justify-center
                      gap-2
                      rounded-[16px]
                      bg-[#064b42]
                      px-4
                      py-3
                      font-black
                      text-white
                    "
                  >
                    <Edit3
                      size={17}
                    />

                    Modifier
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
                    className="
                      flex
                      items-center
                      justify-center
                      gap-2
                      rounded-[16px]
                      bg-red-50
                      px-4
                      py-3
                      font-black
                      text-red-600
                      disabled:opacity-50
                    "
                  >
                    <Trash2
                      size={17}
                    />

                    {deletingId ===
                    item.id
                      ? "Suppression..."
                      : "Supprimer"}
                  </button>
                </div>
              </article>
            )
          )}
        </section>
      </section>
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
    <label
      className="
        block
      "
    >
      <span
        className="
          mb-2
          block
          text-sm
          font-black
          text-[#064b42]
        "
      >
        {label}
      </span>

      <input
        type={type}
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
        className="
          w-full
          rounded-[18px]
          border
          border-[#ded4c5]
          bg-[#fffaf7]
          px-4
          py-3
          outline-none
          focus:border-[#064b42]
        "
      />
    </label>
  );
}