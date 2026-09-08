"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  PawPrint,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type SterilizationStatus =
  | "oui"
  | "en_cours"
  | "non";

type IdentificationType =
  | "puce"
  | "tatouage";

export default function AjouterCompagnonPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [userId, setUserId] =
    useState("");

  const [name, setName] =
    useState("");

  const [species, setSpecies] =
    useState("chien");

  const [breed, setBreed] =
    useState("");

  const [sex, setSex] =
    useState("male");

  const [birthDate, setBirthDate] =
    useState("");

  const [color, setColor] =
    useState("");

  const [weight, setWeight] =
    useState("");

  const [story, setStory] =
    useState("");

  const [character, setCharacter] =
    useState("");

  const [
    identificationType,
    setIdentificationType,
  ] =
    useState<IdentificationType>(
      "puce"
    );

  const [
    identificationNumber,
    setIdentificationNumber,
  ] =
    useState("");

  const [
    sterilizationStatus,
    setSterilizationStatus,
  ] =
    useState<SterilizationStatus>(
      "oui"
    );

  const [
    sterilizationDate,
    setSterilizationDate,
  ] =
    useState("");

  const [
    sterilizationNote,
    setSterilizationNote,
  ] =
    useState("");

  const [photoFile, setPhotoFile] =
    useState<File | null>(null);

  const [
    photoPreview,
    setPhotoPreview,
  ] =
    useState("");

  /* =========================================================
     SESSION
  ========================================================= */

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const {
          data: { user },
          error,
        } =
          await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        if (!user) {
          router.replace(
            "/login?redirect=" +
              encodeURIComponent(
                "/mes-compagnons/ajouter"
              )
          );

          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error(
          "Erreur session Mes Compagnons :",
          error
        );

        if (active) {
          router.replace(
            "/login?redirect=" +
              encodeURIComponent(
                "/mes-compagnons/ajouter"
              )
          );
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [router]);

  /* =========================================================
     PHOTO PREVIEW
  ========================================================= */

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }

    const preview =
      URL.createObjectURL(
        photoFile
      );

    setPhotoPreview(preview);

    return () => {
      URL.revokeObjectURL(
        preview
      );
    };
  }, [photoFile]);

  /* =========================================================
     VALIDATION
  ========================================================= */

  const canSubmit =
    useMemo(() => {
      if (!userId) {
        return false;
      }

      if (!name.trim()) {
        return false;
      }

      if (
        !identificationNumber.trim()
      ) {
        return false;
      }

      if (
        sterilizationStatus ===
        "non"
      ) {
        return false;
      }

      if (
        sterilizationStatus ===
          "en_cours" &&
        !sterilizationDate
      ) {
        return false;
      }

      return true;
    }, [
      userId,
      name,
      identificationNumber,
      sterilizationStatus,
      sterilizationDate,
    ]);

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      setPhotoFile(null);
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Merci de sélectionner une image."
      );

      event.target.value = "";
      return;
    }

    const maximumSize =
      10 * 1024 * 1024;

    if (
      file.size > maximumSize
    ) {
      alert(
        "La photo ne doit pas dépasser 10 Mo."
      );

      event.target.value = "";
      return;
    }

    setPhotoFile(file);
  }

  function validateForm() {
    if (!userId) {
      alert(
        "Vous devez être connecté pour ajouter un compagnon."
      );

      return false;
    }

    if (!name.trim()) {
      alert(
        "Merci d'indiquer le nom de votre compagnon."
      );

      return false;
    }

    if (
      !identificationNumber.trim()
    ) {
      alert(
        "Le numéro de puce ou de tatouage est obligatoire."
      );

      return false;
    }

    if (
      sterilizationStatus ===
      "non"
    ) {
      alert(
        "Pour être ajouté à Taui Te Ora, votre compagnon doit être stérilisé/castré ou avoir une stérilisation en cours."
      );

      return false;
    }

    if (
      sterilizationStatus ===
        "en_cours" &&
      !sterilizationDate
    ) {
      alert(
        "Merci d'indiquer la date prévue de stérilisation ou castration."
      );

      return false;
    }

    return true;
  }

  /* =========================================================
     UPLOAD PHOTO
  ========================================================= */

  async function uploadPhoto() {
    if (
      !photoFile ||
      !userId
    ) {
      return "";
    }

    const extension =
      photoFile.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const safeExtension =
      extension.replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg";

    const fileName =
      `${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    const path =
      `companions/${userId}/${fileName}`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("animals")
        .upload(
          path,
          photoFile,
          {
            cacheControl:
              "3600",
            upsert: false,
          }
        );

    if (uploadError) {
      throw new Error(
        "Impossible d'envoyer la photo : " +
          uploadError.message
      );
    }

    const { data } =
      supabase.storage
        .from("animals")
        .getPublicUrl(path);

    return (
      data.publicUrl || ""
    );
  }

  /* =========================================================
     ENREGISTREMENT
  ========================================================= */

  async function handleSubmit() {
    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      let photoUrl = "";

      if (photoFile) {
        photoUrl =
          await uploadPhoto();
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("companions")
          .insert({
            owner_id:
              userId,

            name:
              name.trim(),

            species,

            breed:
              breed.trim() ||
              null,

            sex,

            birth_date:
              birthDate ||
              null,

            color:
              color.trim() ||
              null,

            weight:
              weight.trim() ||
              null,

            character:
              character.trim() ||
              null,

            story:
              story.trim() ||
              null,

            photo_url:
              photoUrl ||
              null,

            identification_type:
              identificationType,

            identification_number:
              identificationNumber
                .trim(),

            sterilization_status:
              sterilizationStatus,

            sterilization_date:
              sterilizationStatus ===
                "en_cours"
                ? sterilizationDate ||
                  null
                : null,

            sterilization_note:
              sterilizationStatus ===
                "en_cours"
                ? sterilizationNote
                    .trim() ||
                  null
                : null,
          })
          .select("id")
          .single();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "Le compagnon a été enregistré mais aucun identifiant n'a été retourné."
        );
      }

      alert(
        `${name.trim()} fait maintenant partie de vos compagnons 🐾`
      );

      router.push(
        "/mes-compagnons"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Erreur ajout compagnon :",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue.";

      alert(
        "Impossible d'ajouter votre compagnon.\n\n" +
          message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING SESSION
  ========================================================= */

  if (checkingSession) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5ead8] px-4">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-6 pb-28 text-[#3b2417]">
      <section className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/mes-compagnons"
            )
          }
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow"
        >
          <ArrowLeft
            size={17}
          />
          Retour
        </button>

        <div className="rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] p-5 shadow-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ef919b] text-white shadow">
              <PawPrint
                size={28}
              />
            </div>

            <h1 className="mt-4 text-3xl font-black text-[#064b42] sm:text-4xl">
              Ajouter un compagnon
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#6f625a]">
              Créez son profil
              Taui Te Ora pour
              les balades, la
              communauté et pour
              pouvoir signaler
              rapidement sa
              disparition.
            </p>
          </div>

          <div className="mt-8 space-y-6">

            {/* PHOTO */}

            <div className="rounded-[26px] bg-white p-5 shadow">
              <h2 className="text-xl font-black text-[#064b42]">
                Photo
              </h2>

              <p className="mt-1 text-sm text-[#6f625a]">
                Ajoutez une photo
                récente et facilement
                reconnaissable.
              </p>

              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[26px] bg-[#f8f4ec] shadow-inner">
                  {photoPreview ? (
                    <img
                      src={
                        photoPreview
                      }
                      alt="Aperçu"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera
                      size={36}
                      className="text-[#b8aaa0]"
                    />
                  )}
                </div>

                <label className="cursor-pointer rounded-full bg-[#064b42] px-5 py-3 text-center text-sm font-black text-white shadow">
                  Choisir une photo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handlePhotoChange
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* INFOS */}

            <div className="rounded-[26px] bg-white p-5 shadow">
              <h2 className="text-xl font-black text-[#064b42]">
                Informations principales
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Nom *
                  </span>

                  <input
                    value={name}
                    onChange={(
                      event
                    ) =>
                      setName(
                        event.target
                          .value
                      )
                    }
                    placeholder="Nom de votre compagnon"
                    className="input"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Espèce *
                  </span>

                  <select
                    value={
                      species
                    }
                    onChange={(
                      event
                    ) =>
                      setSpecies(
                        event.target
                          .value
                      )
                    }
                    className="input"
                  >
                    <option value="chien">
                      Chien
                    </option>

                    <option value="chat">
                      Chat
                    </option>

                    <option value="cheval">
                      Cheval
                    </option>

                    <option value="autre">
                      Autre
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Sexe *
                  </span>

                  <select
                    value={sex}
                    onChange={(
                      event
                    ) =>
                      setSex(
                        event.target
                          .value
                      )
                    }
                    className="input"
                  >
                    <option value="male">
                      Mâle
                    </option>

                    <option value="female">
                      Femelle
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Date de naissance
                  </span>

                  <input
                    type="date"
                    value={
                      birthDate
                    }
                    onChange={(
                      event
                    ) =>
                      setBirthDate(
                        event.target
                          .value
                      )
                    }
                    className="input"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Race
                  </span>

                  <input
                    value={breed}
                    onChange={(
                      event
                    ) =>
                      setBreed(
                        event.target
                          .value
                      )
                    }
                    placeholder="Race ou croisé"
                    className="input"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Couleur
                  </span>

                  <input
                    value={color}
                    onChange={(
                      event
                    ) =>
                      setColor(
                        event.target
                          .value
                      )
                    }
                    placeholder="Noir, blanc, fauve..."
                    className="input"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Poids
                  </span>

                  <input
                    value={weight}
                    onChange={(
                      event
                    ) =>
                      setWeight(
                        event.target
                          .value
                      )
                    }
                    placeholder="Ex. 18 kg"
                    className="input"
                  />
                </label>
              </div>
            </div>

            {/* IDENTIFICATION */}

            <div className="rounded-[26px] bg-white p-5 shadow">
              <h2 className="text-xl font-black text-[#064b42]">
                Identification
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-[#6f625a]">
                L'identification
                permettra notamment de
                retrouver immédiatement
                les informations utiles
                si votre compagnon
                disparaît.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Type
                    d'identification *
                  </span>

                  <select
                    value={
                      identificationType
                    }
                    onChange={(
                      event
                    ) =>
                      setIdentificationType(
                        event.target
                          .value as IdentificationType
                      )
                    }
                    className="input"
                  >
                    <option value="puce">
                      Puce électronique
                    </option>

                    <option value="tatouage">
                      Tatouage
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Numéro
                    d'identification *
                  </span>

                  <input
                    value={
                      identificationNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setIdentificationNumber(
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      identificationType ===
                      "puce"
                        ? "Numéro de puce"
                        : "Numéro de tatouage"
                    }
                    className="input"
                  />
                </label>
              </div>
            </div>

            {/* STERILISATION */}

            <div className="rounded-[26px] bg-white p-5 shadow">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={24}
                  className="mt-1 shrink-0 text-[#064b42]"
                />

                <div>
                  <h2 className="text-xl font-black text-[#064b42]">
                    Stérilisation /
                    Castration
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-[#6f625a]">
                    Pour rejoindre Mes
                    Compagnons,
                    l'animal doit être
                    stérilisé/castré ou
                    avoir une démarche
                    déjà en cours.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    setSterilizationStatus(
                      "oui"
                    )
                  }
                  className={`rounded-[22px] border-2 p-4 text-left transition ${
                    sterilizationStatus ===
                    "oui"
                      ? "border-[#6ba98f] bg-[#eaf5f1]"
                      : "border-[#e8ddd5] bg-white"
                  }`}
                >
                  <CheckCircle2
                    size={22}
                    className="text-[#5d9d83]"
                  />

                  <div className="mt-2 font-black text-[#064b42]">
                    Oui
                  </div>

                  <div className="mt-1 text-xs text-[#6f625a]">
                    Déjà stérilisé ou
                    castré
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSterilizationStatus(
                      "en_cours"
                    )
                  }
                  className={`rounded-[22px] border-2 p-4 text-left transition ${
                    sterilizationStatus ===
                    "en_cours"
                      ? "border-[#dca55a] bg-[#fff4df]"
                      : "border-[#e8ddd5] bg-white"
                  }`}
                >
                  <Clock3
                    size={22}
                    className="text-[#c7872f]"
                  />

                  <div className="mt-2 font-black text-[#064b42]">
                    En cours
                  </div>

                  <div className="mt-1 text-xs text-[#6f625a]">
                    Rendez-vous ou
                    démarche prévue
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSterilizationStatus(
                      "non"
                    )
                  }
                  className={`rounded-[22px] border-2 p-4 text-left transition ${
                    sterilizationStatus ===
                    "non"
                      ? "border-[#df8995] bg-[#fce8ec]"
                      : "border-[#e8ddd5] bg-white"
                  }`}
                >
                  <XCircle
                    size={22}
                    className="text-[#df8995]"
                  />

                  <div className="mt-2 font-black text-[#064b42]">
                    Non
                  </div>

                  <div className="mt-1 text-xs text-[#6f625a]">
                    Ajout non autorisé
                  </div>
                </button>
              </div>

              {sterilizationStatus ===
                "en_cours" && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-black text-[#064b42]">
                      Date prévue *
                    </span>

                    <input
                      type="date"
                      value={
                        sterilizationDate
                      }
                      onChange={(
                        event
                      ) =>
                        setSterilizationDate(
                          event.target
                            .value
                        )
                      }
                      className="input"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-[#064b42]">
                      Commentaire
                    </span>

                    <input
                      value={
                        sterilizationNote
                      }
                      onChange={(
                        event
                      ) =>
                        setSterilizationNote(
                          event.target
                            .value
                        )
                      }
                      placeholder="Ex. rendez-vous vétérinaire pris"
                      className="input"
                    />
                  </label>
                </div>
              )}

              {sterilizationStatus ===
                "non" && (
                <div className="mt-5 rounded-[20px] bg-[#fce8ec] p-4 text-sm font-bold leading-relaxed text-[#8a5660]">
                  Cet animal ne peut
                  pas être ajouté à
                  Mes Compagnons tant
                  qu'une stérilisation
                  ou castration n'est
                  pas réalisée ou en
                  cours.
                </div>
              )}
            </div>

            {/* HISTOIRE */}

            <div className="rounded-[26px] bg-white p-5 shadow">
              <h2 className="text-xl font-black text-[#064b42]">
                Caractère & histoire
              </h2>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Son caractère
                  </span>

                  <textarea
                    value={
                      character
                    }
                    onChange={(
                      event
                    ) =>
                      setCharacter(
                        event.target
                          .value
                      )
                    }
                    placeholder="Calme, joueur, sportif, timide, sociable..."
                    rows={4}
                    className="input resize-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Son histoire
                  </span>

                  <textarea
                    value={story}
                    onChange={(
                      event
                    ) =>
                      setStory(
                        event.target
                          .value
                      )
                    }
                    placeholder="Racontez son histoire..."
                    rows={6}
                    className="input resize-none"
                  />
                </label>
              </div>
            </div>

            {/* SUBMIT */}

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                !canSubmit ||
                saving
              }
              className="w-full rounded-full bg-[#064b42] py-4 text-lg font-black text-white shadow-xl transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? "Enregistrement..."
                : "Ajouter mon compagnon"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}