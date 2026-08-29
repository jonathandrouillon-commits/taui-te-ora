"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  eventService,
} from "../../../../services/event.service";

import {
  supabase,
} from "../../../../lib/supabase";

type FormState = {
  title: string;
  event_type: string;

  description: string;

  start_date: string;
  end_date: string;

  start_time: string;
  end_time: string;

  location_name: string;
  island: string;
  city: string;
  address: string;

  organizer_name: string;

  contact_name: string;
  contact_phone: string;
  contact_email: string;

  external_url: string;

  image_url: string;

  is_free: boolean;
  price_label: string;

  is_published: boolean;

  facebook_share_enabled: boolean;
};

const emptyForm: FormState = {
  title: "",
  event_type: "autre",

  description: "",

  start_date: "",
  end_date: "",

  start_time: "",
  end_time: "",

  location_name: "",
  island: "",
  city: "",
  address: "",

  organizer_name: "",

  contact_name: "",
  contact_phone: "",
  contact_email: "",

  external_url: "",

  image_url: "",

  is_free: true,
  price_label: "",

  is_published: false,

  facebook_share_enabled: true,
};

export default function EditEventPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const eventId =
    String(
      params?.eventId || ""
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      emptyForm
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (!eventId) {
        return;
      }

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

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace(
            `/login?redirect=/admin/evenements/${eventId}/edit`
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

        const role =
          String(
            profile?.role ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          ![
            "admin",
            "administrateur",
          ].includes(
            role
          )
        ) {
          router.replace(
            "/"
          );

          return;
        }

        const event =
          await eventService.getByIdAdmin(
            eventId
          );

        if (!active) {
          return;
        }

        setForm({
          title:
            event.title ||
            "",

          event_type:
            event.event_type ||
            "autre",

          description:
            event.description ||
            "",

          start_date:
            event.start_date ||
            "",

          end_date:
            event.end_date ||
            "",

          start_time:
            event.start_time
              ? event.start_time.slice(
                  0,
                  5
                )
              : "",

          end_time:
            event.end_time
              ? event.end_time.slice(
                  0,
                  5
                )
              : "",

          location_name:
            event.location_name ||
            "",

          island:
            event.island ||
            "",

          city:
            event.city ||
            "",

          address:
            event.address ||
            "",

          organizer_name:
            event.organizer_name ||
            "",

          contact_name:
            event.contact_name ||
            "",

          contact_phone:
            event.contact_phone ||
            "",

          contact_email:
            event.contact_email ||
            "",

          external_url:
            event.external_url ||
            "",

          image_url:
            event.image_url ||
            "",

          is_free:
            event.is_free !==
            false,

          price_label:
            event.price_label ||
            "",

          is_published:
            event.is_published ===
            true,

          facebook_share_enabled:
            event.facebook_share_enabled !==
            false,
        });

        setPreviewUrl(
          event.image_url ||
            ""
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Erreur chargement événement :",
          error
        );

        alert(
          error instanceof
            Error
            ? error.message
            : "Impossible de charger l'événement."
        );

        router.replace(
          "/admin/evenements"
        );
      } finally {
        if (active) {
          setLoading(
            false
          );
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [
    eventId,
    router,
  ]);

  /* =========================================================
     CHAMP
  ========================================================= */

  function updateField<
    K extends keyof FormState
  >(
    field: K,
    value: FormState[K]
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  /* =========================================================
     NOUVELLE AFFICHE
  ========================================================= */

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(
        true
      );

      const localPreview =
        URL.createObjectURL(
          file
        );

      setPreviewUrl(
        localPreview
      );

      const uploaded =
        await eventService.uploadImage(
          file
        );

      updateField(
        "image_url",
        uploaded.publicUrl
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur upload affiche :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible d'envoyer l'affiche."
      );

      setPreviewUrl(
        form.image_url
      );
    } finally {
      setUploading(
        false
      );
    }
  }

  /* =========================================================
     RETIRER L'AFFICHE DE L'EVENEMENT
  ========================================================= */

  function removeImage() {
    const confirmed =
      window.confirm(
        "Retirer l'affiche de cet événement ?"
      );

    if (!confirmed) {
      return;
    }

    updateField(
      "image_url",
      ""
    );

    setPreviewUrl(
      ""
    );
  }

  /* =========================================================
     ENREGISTRER
  ========================================================= */

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      saving ||
      uploading
    ) {
      return;
    }

    if (
      !form.title.trim()
    ) {
      alert(
        "Le titre de l'événement est obligatoire."
      );

      return;
    }

    if (
      !form.start_date
    ) {
      alert(
        "La date de début est obligatoire."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      await eventService.update(
        eventId,
        {
          title:
            form.title,

          event_type:
            form.event_type,

          description:
            form.description,

          start_date:
            form.start_date,

          end_date:
            form.end_date ||
            null,

          start_time:
            form.start_time ||
            null,

          end_time:
            form.end_time ||
            null,

          location_name:
            form.location_name,

          island:
            form.island,

          city:
            form.city,

          address:
            form.address,

          organizer_name:
            form.organizer_name,

          contact_name:
            form.contact_name,

          contact_phone:
            form.contact_phone,

          contact_email:
            form.contact_email,

          external_url:
            form.external_url,

          image_url:
            form.image_url,

          is_free:
            form.is_free,

          price_label:
            form.price_label,

          is_published:
            form.is_published,

          facebook_share_enabled:
            form.facebook_share_enabled,
        }
      );

      alert(
        "Événement enregistré."
      );

      router.refresh();
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur modification événement :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible d'enregistrer l'événement."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =========================================================
     SUPPRIMER
  ========================================================= */

  async function deleteEvent() {
    const first =
      window.confirm(
        `Supprimer définitivement "${form.title}" ?`
      );

    if (!first) {
      return;
    }

    const second =
      window.confirm(
        "Cette action est définitive. Confirmer la suppression ?"
      );

    if (!second) {
      return;
    }

    try {
      setDeleting(
        true
      );

      await eventService.delete(
        eventId
      );

      alert(
        "Événement supprimé."
      );

      router.replace(
        "/admin/evenements"
      );

      router.refresh();
    } catch (
      error: unknown
    ) {
      console.error(
        "Erreur suppression événement :",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Impossible de supprimer l'événement."
      );
    } finally {
      setDeleting(
        false
      );
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef]">
        <p className="font-black text-[#064b42]">
          Chargement de
          l&apos;événement...
        </p>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-4 pb-24 pt-24 text-[#064b42] sm:px-8">
      <section className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/evenements"
            )
          }
          className="mb-6 flex items-center gap-2 font-black"
        >
          <ArrowLeft
            size={20}
          />

          Retour aux événements
        </button>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
              Administration
            </p>

            <h1 className="mt-1 text-4xl font-black sm:text-5xl">
              Modifier l&apos;événement
            </h1>

            <p className="mt-2 text-[#756d67]">
              Modifiez les informations,
              l&apos;affiche et la publication.
            </p>
          </div>

          {form.is_published && (
            <button
              type="button"
              onClick={() =>
                window.open(
                  `/evenements/${eventId}`,
                  "_blank"
                )
              }
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black shadow-sm"
            >
              <ExternalLink
                size={18}
              />

              Voir la page publique
            </button>
          )}
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-8 space-y-6"
        >

          <Section title="Informations principales">

            <div className="grid gap-4 md:grid-cols-2">

              <Field
                label="Titre *"
                value={
                  form.title
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "title",
                    value
                  )
                }
              />

              <SelectField
                label="Type d'événement"
                value={
                  form.event_type
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "event_type",
                    value
                  )
                }
                options={[
                  {
                    value:
                      "journee_animaux",
                    label:
                      "Journée des animaux",
                  },
                  {
                    value:
                      "collecte_croquettes",
                    label:
                      "Collecte de croquettes",
                  },
                  {
                    value:
                      "tombola",
                    label:
                      "Tombola",
                  },
                  {
                    value:
                      "journee_adoption",
                    label:
                      "Journée adoption",
                  },
                  {
                    value:
                      "sterilisation_solidaire",
                    label:
                      "Stérilisation solidaire",
                  },
                  {
                    value:
                      "collecte_dons",
                    label:
                      "Collecte de dons",
                  },
                  {
                    value:
                      "evenement_association",
                    label:
                      "Événement association",
                  },
                  {
                    value:
                      "autre",
                    label:
                      "Autre",
                  },
                ]}
              />

            </div>

            <label className="mt-4 block">

              <span className="mb-2 block text-sm font-black">
                Description
              </span>

              <textarea
                value={
                  form.description
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                rows={8}
                className="w-full rounded-2xl border border-[#eadfd8] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
              />

            </label>

          </Section>

          {/* AFFICHE */}

          <Section title="Affiche / visuel">

            <div className="grid gap-5 md:grid-cols-[1fr_300px]">

              <div className="space-y-4">

                <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#d9cfc2] bg-white p-6 text-center hover:border-[#064b42]">

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={
                      handleImageChange
                    }
                    className="hidden"
                  />

                  {uploading ? (
                    <>
                      <UploadCloud
                        size={38}
                      />

                      <p className="mt-3 font-black">
                        Envoi en cours...
                      </p>
                    </>
                  ) : (
                    <>
                      <ImagePlus
                        size={38}
                      />

                      <p className="mt-3 font-black">
                        Remplacer l&apos;affiche
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        JPG, PNG, WEBP ou GIF
                      </p>
                    </>
                  )}

                </label>

                {form.image_url && (
                  <button
                    type="button"
                    onClick={
                      removeImage
                    }
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-black text-red-700"
                  >
                    Retirer l&apos;affiche
                  </button>
                )}

              </div>

              <div className="overflow-hidden rounded-[24px] border border-[#eadfd8] bg-[#f4eee5]">

                {previewUrl ? (
                  <img
                    src={
                      previewUrl
                    }
                    alt="Affiche événement"
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center p-6 text-center font-bold text-gray-400">
                    Aucune affiche
                  </div>
                )}

              </div>

            </div>

          </Section>

          {/* DATE */}

          <Section title="Date et horaires">

            <div className="grid gap-4 md:grid-cols-2">

              <InputField
                type="date"
                label="Date de début *"
                value={
                  form.start_date
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "start_date",
                    value
                  )
                }
              />

              <InputField
                type="date"
                label="Date de fin"
                value={
                  form.end_date
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "end_date",
                    value
                  )
                }
              />

              <InputField
                type="time"
                label="Heure de début"
                value={
                  form.start_time
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "start_time",
                    value
                  )
                }
              />

              <InputField
                type="time"
                label="Heure de fin"
                value={
                  form.end_time
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "end_time",
                    value
                  )
                }
              />

            </div>

          </Section>

          {/* LIEU */}

          <Section title="Lieu">

            <div className="grid gap-4 md:grid-cols-2">

              <Field
                label="Nom du lieu"
                value={
                  form.location_name
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "location_name",
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

          </Section>

          {/* ORGANISATEUR */}

          <Section title="Organisateur et contact">

            <div className="grid gap-4 md:grid-cols-2">

              <Field
                label="Organisateur"
                value={
                  form.organizer_name
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "organizer_name",
                    value
                  )
                }
              />

              <Field
                label="Nom du contact"
                value={
                  form.contact_name
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "contact_name",
                    value
                  )
                }
              />

              <Field
                label="Téléphone"
                value={
                  form.contact_phone
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "contact_phone",
                    value
                  )
                }
              />

              <Field
                label="Email"
                value={
                  form.contact_email
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "contact_email",
                    value
                  )
                }
              />

              <div className="md:col-span-2">

                <Field
                  label="Lien externe"
                  value={
                    form.external_url
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "external_url",
                      value
                    )
                  }
                  placeholder="https://..."
                />

              </div>

            </div>

          </Section>

          {/* TARIF */}

          <Section title="Tarif">

            <label className="flex items-center gap-3 rounded-2xl bg-white p-4">

              <input
                type="checkbox"
                checked={
                  form.is_free
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "is_free",
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />

              <span className="font-black">
                Événement gratuit
              </span>

            </label>

            {!form.is_free && (
              <div className="mt-4">

                <Field
                  label="Tarif"
                  value={
                    form.price_label
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "price_label",
                      value
                    )
                  }
                  placeholder="Ex : 1 000 XPF"
                />

              </div>
            )}

          </Section>

          {/* PUBLICATION */}

          <Section title="Publication">

            <div className="grid gap-3 md:grid-cols-2">

              <label className="flex items-center gap-3 rounded-2xl bg-white p-4">

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
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-black">
                    Événement publié
                  </p>

                  <p className="text-sm text-gray-500">
                    Visible par tous les utilisateurs.
                  </p>
                </div>

              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-white p-4">

                <input
                  type="checkbox"
                  checked={
                    form.facebook_share_enabled
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "facebook_share_enabled",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-black">
                    Partage Facebook
                  </p>

                  <p className="text-sm text-gray-500">
                    Autoriser le bouton de partage.
                  </p>
                </div>

              </label>

            </div>

          </Section>

          {/* ENREGISTRER */}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/evenements"
                )
              }
              className="rounded-2xl border border-[#d9cfc2] bg-white px-6 py-4 font-black"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                uploading
              }
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-7 py-4 font-black text-white disabled:opacity-50"
            >
              <Save
                size={20}
              />

              {saving
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>

          </div>

        </form>

        {/* DANGER */}

        <section className="mt-12 rounded-[28px] border-2 border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-black text-red-800">
            Zone dangereuse
          </h2>

          <p className="mt-2 text-sm text-red-700">
            La suppression d&apos;un événement est définitive.
          </p>

          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              deleteEvent
            }
            className="mt-5 flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-50"
          >
            <Trash2
              size={18}
            />

            {deleting
              ? "Suppression..."
              : "Supprimer définitivement"}
          </button>

        </section>

      </section>
    </main>
  );
}

/* =========================================================
   COMPOSANTS
========================================================= */

function Section({
  title,
  children,
}: {
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#eadfd8] bg-[#fffdf9] p-5 shadow-sm sm:p-6">

      <h2 className="mb-5 text-xl font-black text-[#064b42]">
        {title}
      </h2>

      {children}

    </section>
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
  onChange:
    (value: string) =>
      void;
  placeholder?: string;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-black">
        {label}
      </span>

      <input
        type="text"
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
        placeholder={
          placeholder
        }
        className="min-h-[48px] w-full rounded-2xl border border-[#eadfd8] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
      />

    </label>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type:
    | "date"
    | "time";
  value: string;
  onChange:
    (value: string) =>
      void;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-black">
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
        className="min-h-[48px] w-full rounded-2xl border border-[#eadfd8] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
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
  onChange:
    (value: string) =>
      void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-black">
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
        className="min-h-[48px] w-full rounded-2xl border border-[#eadfd8] bg-white px-4 py-3 outline-none focus:border-[#064b42]"
      >
        {options.map(
          (option) => (
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