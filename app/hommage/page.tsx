"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  Heart,
  ImagePlus,
  Mail,
  PawPrint,
  Send,
  X,
} from "lucide-react";

import TauiPageBackground from "../components/ui/TauiPageBackground";
import { supabase } from "../lib/supabase";

const KALI_DISAPPEARANCE_DATE = "2025-03-19";

type Hommage = {
  id: string;
  animal_name: string;
  animal_type: string | null;
  birth_date: string | null;
  death_date: string | null;
  tribute_text: string;
  submitter_name: string | null;
  photo_url: string | null;
  approved_at: string | null;
  created_at: string;
};

type FormState = {
  animal_name: string;
  animal_type: string;
  birth_date: string;
  death_date: string;
  tribute_text: string;
  submitter_name: string;
  submitter_email: string;
};

const EMPTY_FORM: FormState = {
  animal_name: "",
  animal_type: "",
  birth_date: "",
  death_date: "",
  tribute_text: "",
  submitter_name: "",
  submitter_email: "",
};

function calculateDaysWithoutKali() {
  const tahitiDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [currentYear, currentMonth, currentDay] = tahitiDate
    .split("-")
    .map(Number);

  const [kaliYear, kaliMonth, kaliDay] = KALI_DISAPPEARANCE_DATE
    .split("-")
    .map(Number);

  const currentUTC = Date.UTC(
    currentYear,
    currentMonth - 1,
    currentDay
  );

  const kaliUTC = Date.UTC(
    kaliYear,
    kaliMonth - 1,
    kaliDay
  );

  const difference = currentUTC - kaliUTC;

  return Math.max(
    0,
    Math.floor(difference / (1000 * 60 * 60 * 24))
  );
}

function formatDate(date: string | null) {
  if (!date) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function HommagePage() {
  const [daysWithoutKali, setDaysWithoutKali] =
    useState<number | null>(null);

  const [hommages, setHommages] =
    useState<Hommage[]>([]);

  const [loadingHommages, setLoadingHommages] =
    useState(true);

  const [formOpen, setFormOpen] =
    useState(false);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [photo, setPhoto] =
    useState<File | null>(null);

  const [photoPreview, setPhotoPreview] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function updateCounter() {
      setDaysWithoutKali(calculateDaysWithoutKali());
    }

    updateCounter();

    const interval =
      window.setInterval(
        updateCounter,
        60 * 1000
      );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    void loadApprovedHommages();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  async function loadApprovedHommages() {
    try {
      setLoadingHommages(true);

      const {
        data,
        error,
      } = await supabase
        .from("hommages")
        .select(
          `
            id,
            animal_name,
            animal_type,
            birth_date,
            death_date,
            tribute_text,
            submitter_name,
            photo_url,
            approved_at,
            created_at
          `
        )
        .eq("status", "approved")
        .order("approved_at", {
          ascending: false,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setHommages(
        (data || []) as Hommage[]
      );
    } catch (error: any) {
      console.error(
        "Erreur chargement hommages :",
        error
      );
    } finally {
      setLoadingHommages(false);
    }
  }

  function updateForm(
    field: keyof FormState,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function selectPhoto(
    file: File | null
  ) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(
        "Merci de sélectionner une image."
      );
      return;
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      alert(
        "La photo ne doit pas dépasser 8 Mo."
      );
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    setPhoto(file);

    setPhotoPreview(
      URL.createObjectURL(file)
    );
  }

  function removePhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    setPhoto(null);
    setPhotoPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    removePhoto();
  }

  function closeForm() {
    if (submitting) return;

    setFormOpen(false);
  }

  async function uploadPhoto() {
    if (!photo) {
      return null;
    }

    const extension =
      photo.name.split(".").pop() ||
      "jpg";

    const randomId =
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    const filePath =
      `${randomId}.${extension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("hommages")
      .upload(
        filePath,
        photo,
        {
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("hommages")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async function submitHommage() {
    if (submitting) return;

    if (!form.animal_name.trim()) {
      alert(
        "Merci d'indiquer le nom de votre animal."
      );
      return;
    }

    if (!form.tribute_text.trim()) {
      alert(
        "Merci d'écrire votre hommage."
      );
      return;
    }

    if (!form.submitter_email.trim()) {
      alert(
        "Merci d'indiquer votre adresse e-mail."
      );
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      const photoUrl =
        await uploadPhoto();

      const {
        error,
      } = await supabase
        .from("hommages")
        .insert({
          user_id:
            user?.id || null,

          animal_name:
            form.animal_name.trim(),

          animal_type:
            form.animal_type.trim() ||
            null,

          birth_date:
            form.birth_date ||
            null,

          death_date:
            form.death_date ||
            null,

          tribute_text:
            form.tribute_text.trim(),

          submitter_name:
            form.submitter_name.trim() ||
            null,

          submitter_email:
            form.submitter_email.trim(),

          photo_url:
            photoUrl,

          status:
            "pending",
        });

      if (error) {
        throw error;
      }

      resetForm();
      setFormOpen(false);

      setSuccessMessage(
        "Votre hommage a bien été envoyé. Il sera publié après validation par Taui Te Ora."
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 7000);
    } catch (error: any) {
      console.error(
        "Erreur envoi hommage :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'envoyer votre hommage."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const sortedHommages =
    useMemo(
      () => hommages,
      [hommages]
    );

  return (
    <TauiPageBackground showKali={false}>
      <section className="mx-auto max-w-5xl px-4 pb-28 pt-10">
        {successMessage && (
          <div className="mx-auto mb-6 max-w-3xl rounded-[24px] border border-green-200 bg-green-50 px-5 py-4 text-center font-bold text-green-800 shadow-lg">
            {successMessage}
          </div>
        )}

        <div className="overflow-hidden rounded-[40px] border border-white/80 bg-white/85 shadow-2xl backdrop-blur-md">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#064b42] via-[#09675a] to-[#0a796b] px-6 py-12 text-center text-white">
            <div className="pointer-events-none absolute -left-20 top-4 h-64 w-64 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-white/5" />

            <div className="relative">
              <div className="mx-auto h-72 w-72 overflow-hidden rounded-full border-8 border-white shadow-2xl ring-4 ring-[#d6b382]/50 md:h-80 md:w-80">
                <img
                  src="/kali-hommage.jpg"
                  alt="Kali"
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-[#f1d8b4]">
                TAUI TE ORA
              </p>

              <h1 className="mt-3 text-5xl font-black md:text-7xl">
                Hommage à Kali
              </h1>

              <p className="mt-5 text-2xl font-black text-[#f1d8b4] md:text-4xl">
                {daysWithoutKali === null
                  ? "..."
                  : daysWithoutKali}{" "}
                jours sans toi
              </p>

              <p className="mt-3 text-sm font-semibold text-white/70">
                Disparue le 19 mars 2025
              </p>
            </div>
          </div>

          <div className="px-6 py-10 text-center md:px-14 md:py-14">
            <p className="text-3xl font-black leading-tight text-[#064b42] md:text-5xl">
              Oui, je te choisis encore.
            </p>

            <div className="mx-auto my-8 h-px max-w-md bg-gradient-to-r from-transparent via-[#b58b5b] to-transparent" />

            <div className="mx-auto max-w-3xl space-y-6 text-lg leading-9 text-gray-700">
              <p>
                Hey toi, oui toi. Change rien. On recommence tout.
              </p>

              <p>
                Je reprendrais les promenades, les silences, les regards et
                chaque instant passé à tes côtés.
              </p>

              <p>
                Je reprendrais même les jours difficiles, parce qu&apos;ils
                seraient encore des jours avec toi.
              </p>

              <p className="text-2xl font-black italic text-[#8d673d]">
                Allez viens, on recommence tout.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-3xl rounded-[30px] bg-[#f8f4ec] p-7 shadow-inner md:p-10">
              <div className="text-5xl">
                🐾
              </div>

              <h2 className="mt-5 text-3xl font-black text-[#064b42]">
                De ton absence est née une mission
              </h2>

              <p className="mt-5 text-lg leading-8 text-gray-700">
                TAUI TE ORA et Les Veilleurs de Kali portent ton souvenir.
                Chaque animal retrouvé, protégé ou adopté est une manière de
                continuer à te chercher autrement.
              </p>

              <p className="mt-6 font-black text-[#b58b5b]">
                On ne sauvera pas le monde, mais on sauvera le leur.
              </p>
            </div>

            <p className="mt-10 text-xl font-black text-[#064b42]">
              Pour toujours, Kali.
            </p>
          </div>
        </div>

        <section className="mt-10 overflow-hidden rounded-[36px] border border-white/80 bg-white/90 p-6 text-center shadow-xl backdrop-blur-md md:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fde7e9] text-[#df8995]">
            <Heart
              size={32}
              fill="currentColor"
            />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#b58b5b]">
            À leur mémoire
          </p>

          <h2 className="mt-2 text-3xl font-black text-[#064b42] md:text-4xl">
            Vous aussi, rendez-lui hommage
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
            Partagez une photo et quelques mots pour garder une trace de votre
            compagnon. Chaque hommage est relu avant d&apos;être publié sur
            Taui Te Ora.
          </p>

          <button
            type="button"
            onClick={() =>
              setFormOpen(true)
            }
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#df8995] px-7 py-3.5 font-black text-white shadow-lg transition hover:bg-[#d67684] active:scale-[0.98]"
          >
            <PawPrint
              size={19}
            />

            Rendre hommage à mon animal
          </button>
        </section>

        <section className="mt-10">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b58b5b]">
              Souvenirs partagés
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#064b42] md:text-4xl">
              Leurs histoires restent avec nous
            </h2>
          </div>

          {loadingHommages ? (
            <div className="mt-8 rounded-[30px] bg-white/90 p-8 text-center shadow-lg">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#eadfd8] border-t-[#064b42]" />

              <p className="mt-4 font-bold text-[#064b42]">
                Chargement des hommages...
              </p>
            </div>
          ) : sortedHommages.length === 0 ? (
            <div className="mt-8 rounded-[30px] bg-white/90 p-8 text-center shadow-lg">
              <PawPrint
                size={40}
                className="mx-auto text-[#df8995]"
              />

              <p className="mt-4 font-bold text-[#064b42]">
                Les premiers hommages seront bientôt publiés ici.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {sortedHommages.map(
                (hommage) => (
                  <article
                    key={hommage.id}
                    className="overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-xl backdrop-blur-md"
                  >
                    {hommage.photo_url ? (
                      <div className="h-72 overflow-hidden bg-[#eadfce]">
                        <img
                          src={hommage.photo_url}
                          alt={hommage.animal_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-gradient-to-br from-[#f8e5e8] to-[#e6f2ee]">
                        <PawPrint
                          size={58}
                          className="text-[#df8995]"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-black text-[#064b42]">
                            {hommage.animal_name}
                          </h3>

                          {hommage.animal_type && (
                            <p className="mt-1 text-sm font-bold text-[#b58b5b]">
                              {hommage.animal_type}
                            </p>
                          )}
                        </div>

                        <Heart
                          size={24}
                          className="text-[#df8995]"
                          fill="currentColor"
                        />
                      </div>

                      {(hommage.birth_date ||
                        hommage.death_date) && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                          <CalendarDays
                            size={16}
                          />

                          <span>
                            {hommage.birth_date
                              ? formatDate(
                                  hommage.birth_date
                                )
                              : "Date de naissance inconnue"}

                            {" — "}

                            {hommage.death_date
                              ? formatDate(
                                  hommage.death_date
                                )
                              : "Toujours dans nos cœurs"}
                          </span>
                        </div>
                      )}

                      <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-gray-700">
                        {hommage.tribute_text}
                      </p>

                      {hommage.submitter_name && (
                        <p className="mt-5 text-sm font-black italic text-[#8d673d]">
                          — {hommage.submitter_name}
                        </p>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-[500] overflow-y-auto bg-black/45 px-3 py-6 backdrop-blur-sm">
          <button
            type="button"
            onClick={closeForm}
            aria-label="Fermer"
            className="fixed inset-0 h-full w-full"
          />

          <div className="relative z-10 mx-auto w-full max-w-2xl overflow-hidden rounded-[32px] bg-[#fffaf7] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#eadfd8] px-5 py-5 sm:px-7">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#df8995]">
                  Taui Te Ora
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                  Rendre hommage à mon animal
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#064b42] shadow"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div className="max-h-[78dvh] overflow-y-auto px-5 py-6 sm:px-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nom de l'animal *"
                  value={form.animal_name}
                  onChange={(value) =>
                    updateForm(
                      "animal_name",
                      value
                    )
                  }
                  placeholder="Ex. Kali"
                />

                <Field
                  label="Type d'animal"
                  value={form.animal_type}
                  onChange={(value) =>
                    updateForm(
                      "animal_type",
                      value
                    )
                  }
                  placeholder="Chien, chat, cheval..."
                />

                <DateField
                  label="Date de naissance"
                  value={form.birth_date}
                  onChange={(value) =>
                    updateForm(
                      "birth_date",
                      value
                    )
                  }
                />

                <DateField
                  label="Date de décès / disparition"
                  value={form.death_date}
                  onChange={(value) =>
                    updateForm(
                      "death_date",
                      value
                    )
                  }
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block font-black text-[#064b42]">
                  Votre hommage *
                </label>

                <textarea
                  value={form.tribute_text}
                  onChange={(event) =>
                    updateForm(
                      "tribute_text",
                      event.target.value
                    )
                  }
                  rows={8}
                  maxLength={3000}
                  placeholder="Racontez son histoire, un souvenir, quelques mots pour lui..."
                  className="w-full resize-y rounded-[20px] border border-[#e5d8cd] bg-white px-4 py-3 leading-7 outline-none transition focus:border-[#df8995]"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.tribute_text.length}/3000
                </p>
              </div>

              <div className="mt-5">
                <p className="mb-2 font-black text-[#064b42]">
                  Photo
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    selectPhoto(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="relative overflow-hidden rounded-[24px] bg-[#eadfce]">
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="h-72 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-red-600 shadow"
                    >
                      <X
                        size={20}
                      />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#d9cec5] bg-white px-5 py-6 text-[#726961] transition hover:border-[#df8995]"
                  >
                    <ImagePlus
                      size={36}
                      className="text-[#df8995]"
                    />

                    <span className="mt-3 font-black text-[#064b42]">
                      Ajouter une photo
                    </span>

                    <span className="mt-1 text-xs text-gray-500">
                      JPG, PNG, WEBP — 8 Mo maximum
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Votre nom"
                  value={form.submitter_name}
                  onChange={(value) =>
                    updateForm(
                      "submitter_name",
                      value
                    )
                  }
                  placeholder="Optionnel"
                />

                <Field
                  label="Votre e-mail *"
                  value={form.submitter_email}
                  onChange={(value) =>
                    updateForm(
                      "submitter_email",
                      value
                    )
                  }
                  placeholder="vous@email.com"
                  type="email"
                  icon={
                    <Mail
                      size={16}
                    />
                  }
                />
              </div>

              <div className="mt-6 rounded-[20px] bg-[#f8f4ec] p-4 text-sm leading-6 text-[#6f665f]">
                Votre hommage ne sera pas publié immédiatement. Il sera d&apos;abord
                relu et validé par l&apos;administration de Taui Te Ora.
              </div>

              <button
                type="button"
                onClick={submitHommage}
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#064b42] px-6 py-4 font-black text-white shadow-lg transition hover:bg-[#08695d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send
                  size={18}
                />

                {submitting
                  ? "Envoi en cours..."
                  : "Envoyer mon hommage"}
              </button>
            </div>
          </div>
        </div>
      )}
    </TauiPageBackground>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block font-black text-[#064b42]">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          className={`w-full rounded-[18px] border border-[#e5d8cd] bg-white py-3 outline-none transition focus:border-[#df8995] ${
            icon
              ? "pl-11 pr-4"
              : "px-4"
          }`}
        />
      </div>
    </div>
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
    <div>
      <label className="mb-2 block font-black text-[#064b42]">
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-[18px] border border-[#e5d8cd] bg-white px-4 py-3 outline-none transition focus:border-[#df8995]"
      />
    </div>
  );
}