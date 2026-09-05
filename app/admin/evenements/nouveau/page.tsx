"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ImagePlus,
  Save,
  UploadCloud,
} from "lucide-react";

import {
  eventService,
} from "../../../services/event.service";

import { supabase } from "../../../lib/supabase";

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

const initialForm: FormState = {
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

export default function NewEventPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [previewUrl, setPreviewUrl] =
    useState("");

  useEffect(() => {
    async function initialize() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace(
            "/login?redirect=/admin/evenements/nouveau"
          );

          return;
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

        const role =
          String(
            profile?.role || ""
          )
            .trim()
            .toLowerCase();

        if (
          ![
            "admin",
            "administrateur",
          ].includes(role)
        ) {
          router.replace("/");
          return;
        }
      } catch (error) {
        console.error(
          "Erreur accès création événement :",
          error
        );

        router.replace("/");
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, [router]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);

      const localPreview =
        URL.createObjectURL(file);

      setPreviewUrl(localPreview);

      const uploaded =
        await eventService.uploadImage(
          file
        );

      updateField(
        "image_url",
        uploaded.publicUrl
      );
    } catch (error: unknown) {
      console.error(
        "Erreur upload affiche événement :",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'affiche."
      );

      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    let facebookShareWindow:
      Window | null = null;

    if (saving) {
      return;
    }

    if (!form.title.trim()) {
      alert(
        "Le titre de l'événement est obligatoire."
      );

      return;
    }

    if (!form.start_date) {
      alert(
        "La date de début est obligatoire."
      );

      return;
    }

    try {
      setSaving(true);

      const created =
        await eventService.create({
          title:
            form.title,

          event_type:
            form.event_type,

          description:
            form.description,

          start_date:
            form.start_date,

          end_date:
            form.end_date || null,

          start_time:
            form.start_time || null,

          end_time:
            form.end_time || null,

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
        });

      alert(
        "Événement créé avec succès."
      );

      router.replace(
        `/admin/evenements/${created.id}/edit`
      );

      router.refresh();
    } catch (error: unknown) {
      console.error(
        "Erreur création événement :",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Impossible de créer l'événement."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#fbf7ef]
        "
      >
        <p
          className="
            font-black
            text-[#064b42]
          "
        >
          Chargement...
        </p>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#fbf7ef]
        px-4
        pb-24
        pt-24
        text-[#064b42]
        sm:px-8
      "
    >
      <section
        className="
          mx-auto
          max-w-5xl
        "
      >
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/evenements"
            )
          }
          className="
            mb-6
            flex
            items-center
            gap-2
            font-black
          "
        >
          <ArrowLeft size={20} />

          Retour aux événements
        </button>

        <div>
          <p
            className="
              text-xs
              font-black
              uppercase
              tracking-[0.22em]
              text-[#df8995]
            "
          >
            Administration
          </p>

          <h1
            className="
              mt-1
              text-4xl
              font-black
              sm:text-5xl
            "
          >
            Créer un événement
          </h1>

          <p
            className="
              mt-2
              max-w-2xl
              text-[#756d67]
            "
          >
            Ajoutez une journée animale,
            une collecte, une tombola,
            une journée adoption ou tout
            autre événement solidaire.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="
            mt-8
            space-y-6
          "
        >
          <Section title="Informations principales">
            <div
              className="
                grid
                gap-4
                md:grid-cols-2
              "
            >
              <Field
                label="Titre *"
                value={form.title}
                onChange={(value) =>
                  updateField(
                    "title",
                    value
                  )
                }
                placeholder="Ex : Grande collecte de croquettes"
              />

              <SelectField
                label="Type d'événement"
                value={
                  form.event_type
                }
                onChange={(value) =>
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
                "
              >
                Description
              </span>

              <textarea
                value={
                  form.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                rows={7}
                placeholder="Présentez l'événement..."
                className="
                  w-full
                  rounded-2xl
                  border
                  border-[#eadfd8]
                  bg-white
                  px-4
                  py-3
                  text-base
                  outline-none
                  focus:border-[#064b42]
                "
              />
            </label>
          </Section>

          <Section title="Affiche / visuel">
            <div
              className="
                grid
                gap-5
                md:grid-cols-[1fr_280px]
              "
            >
              <div>
                <label
                  className="
                    flex
                    min-h-[150px]
                    cursor-pointer
                    flex-col
                    items-center
                    justify-center
                    rounded-[24px]
                    border-2
                    border-dashed
                    border-[#d9cfc2]
                    bg-white
                    p-6
                    text-center
                    transition
                    hover:border-[#064b42]
                  "
                >
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
                        size={36}
                      />

                      <p
                        className="
                          mt-3
                          font-black
                        "
                      >
                        Envoi de l'affiche...
                      </p>
                    </>
                  ) : (
                    <>
                      <ImagePlus
                        size={36}
                      />

                      <p
                        className="
                          mt-3
                          font-black
                        "
                      >
                        Ajouter une affiche
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-gray-500
                        "
                      >
                        JPG, PNG, WEBP ou GIF · 8 Mo max
                      </p>
                    </>
                  )}
                </label>
              </div>

              <div
                className="
                  overflow-hidden
                  rounded-[24px]
                  border
                  border-[#eadfd8]
                  bg-[#f4eee5]
                "
              >
                {previewUrl ||
                form.image_url ? (
                  <img
                    src={
                      previewUrl ||
                      form.image_url
                    }
                    alt="Aperçu de l'affiche"
                    className="
                      aspect-[4/5]
                      h-full
                      w-full
                      object-cover
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      aspect-[4/5]
                      items-center
                      justify-center
                      p-6
                      text-center
                      text-sm
                      font-bold
                      text-gray-400
                    "
                  >
                    Aperçu de l'affiche
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Date et horaires">
            <div
              className="
                grid
                gap-4
                md:grid-cols-2
              "
            >
              <DateField
                label="Date de début *"
                value={
                  form.start_date
                }
                onChange={(value) =>
                  updateField(
                    "start_date",
                    value
                  )
                }
              />

              <DateField
                label="Date de fin"
                value={
                  form.end_date
                }
                onChange={(value) =>
                  updateField(
                    "end_date",
                    value
                  )
                }
              />

              <TimeField
                label="Heure de début"
                value={
                  form.start_time
                }
                onChange={(value) =>
                  updateField(
                    "start_time",
                    value
                  )
                }
              />

              <TimeField
                label="Heure de fin"
                value={
                  form.end_time
                }
                onChange={(value) =>
                  updateField(
                    "end_time",
                    value
                  )
                }
              />
            </div>
          </Section>

          <Section title="Lieu">
            <div
              className="
                grid
                gap-4
                md:grid-cols-2
              "
            >
              <Field
                label="Nom du lieu"
                value={
                  form.location_name
                }
                onChange={(value) =>
                  updateField(
                    "location_name",
                    value
                  )
                }
                placeholder="Ex : Place To'ata"
              />

              <Field
                label="Commune"
                value={
                  form.city
                }
                onChange={(value) =>
                  updateField(
                    "city",
                    value
                  )
                }
                placeholder="Ex : Papeete"
              />

              <Field
                label="Île"
                value={
                  form.island
                }
                onChange={(value) =>
                  updateField(
                    "island",
                    value
                  )
                }
                placeholder="Ex : Tahiti"
              />

              <Field
                label="Adresse"
                value={
                  form.address
                }
                onChange={(value) =>
                  updateField(
                    "address",
                    value
                  )
                }
                placeholder="Adresse complète"
              />
            </div>
          </Section>

          <Section title="Organisateur et contact">
            <div
              className="
                grid
                gap-4
                md:grid-cols-2
              "
            >
              <Field
                label="Organisateur"
                value={
                  form.organizer_name
                }
                onChange={(value) =>
                  updateField(
                    "organizer_name",
                    value
                  )
                }
                placeholder="Association ou organisme"
              />

              <Field
                label="Nom du contact"
                value={
                  form.contact_name
                }
                onChange={(value) =>
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
                onChange={(value) =>
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
                onChange={(value) =>
                  updateField(
                    "contact_email",
                    value
                  )
                }
              />

              <div
                className="
                  md:col-span-2
                "
              >
                <Field
                  label="Lien externe"
                  value={
                    form.external_url
                  }
                  onChange={(value) =>
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

          <Section title="Tarif">
            <label
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                bg-white
                p-4
              "
            >
              <input
                type="checkbox"
                checked={
                  form.is_free
                }
                onChange={(event) =>
                  updateField(
                    "is_free",
                    event.target.checked
                  )
                }
                className="
                  h-5
                  w-5
                "
              />

              <span
                className="
                  font-black
                "
              >
                Événement gratuit
              </span>
            </label>

            {!form.is_free && (
              <div
                className="
                  mt-4
                "
              >
                <Field
                  label="Tarif"
                  value={
                    form.price_label
                  }
                  onChange={(value) =>
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

          <Section title="Publication">
            <div
              className="
                grid
                gap-3
                md:grid-cols-2
              "
            >
              <label
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  bg-white
                  p-4
                "
              >
                <input
                  type="checkbox"
                  checked={
                    form.is_published
                  }
                  onChange={(event) =>
                    updateField(
                      "is_published",
                      event.target.checked
                    )
                  }
                  className="
                    h-5
                    w-5
                  "
                />

                <div>
                  <p
                    className="
                      font-black
                    "
                  >
                    Publier immédiatement
                  </p>

                  <p
                    className="
                      text-sm
                      text-gray-500
                    "
                  >
                    Sinon l'événement restera en brouillon.
                  </p>
                </div>
              </label>

              <label
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  bg-white
                  p-4
                "
              >
                <input
                  type="checkbox"
                  checked={
                    form.facebook_share_enabled
                  }
                  onChange={(event) =>
                    updateField(
                      "facebook_share_enabled",
                      event.target.checked
                    )
                  }
                  className="
                    h-5
                    w-5
                  "
                />

                <div>
                  <p
                    className="
                      font-black
                    "
                  >
                    Partage Facebook
                  </p>

                  <p
                    className="
                      text-sm
                      text-gray-500
                    "
                  >
                    Afficher le bouton de partage sur la page publique.
                  </p>
                </div>
              </label>
            </div>
          </Section>

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:justify-end
            "
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/evenements"
                )
              }
              className="
                rounded-2xl
                border
                border-[#d9cfc2]
                bg-white
                px-6
                py-4
                font-black
              "
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                uploading
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-[#064b42]
                px-7
                py-4
                font-black
                text-white
                disabled:opacity-50
              "
            >
              <Save size={20} />

              {saving
                ? "Création..."
                : "Créer l'événement"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-[28px]
        border
        border-[#eadfd8]
        bg-[#fffdf9]
        p-5
        shadow-sm
        sm:p-6
      "
    >
      <h2
        className="
          mb-5
          text-xl
          font-black
          text-[#064b42]
        "
      >
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
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
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
        "
      >
        {label}
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="
          min-h-[48px]
          w-full
          rounded-2xl
          border
          border-[#eadfd8]
          bg-white
          px-4
          py-3
          text-base
          outline-none
          focus:border-[#064b42]
        "
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
  options: Array<{
    value: string;
    label: string;
  }>;
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
        "
      >
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          min-h-[48px]
          w-full
          rounded-2xl
          border
          border-[#eadfd8]
          bg-white
          px-4
          py-3
          text-base
          outline-none
          focus:border-[#064b42]
        "
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

function DateField({
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
        "
      >
        {label}
      </span>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          min-h-[48px]
          w-full
          rounded-2xl
          border
          border-[#eadfd8]
          bg-white
          px-4
          py-3
          text-base
          outline-none
          focus:border-[#064b42]
        "
      />
    </label>
  );
}

function TimeField({
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
        "
      >
        {label}
      </span>

      <input
        type="time"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          min-h-[48px]
          w-full
          rounded-2xl
          border
          border-[#eadfd8]
          bg-white
          px-4
          py-3
          text-base
          outline-none
          focus:border-[#064b42]
        "
      />
    </label>
  );
}