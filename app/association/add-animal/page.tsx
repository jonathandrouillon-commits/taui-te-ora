"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { animalService } from "../../services/animal.service";
import { photoService } from "../../services/photo.service";
import { videoService } from "../../services/video.service";
import { supabase } from "../../lib/supabase";

import ProgressBar from "./ProgressBar";
import Step1General from "./Step1General";
import Step2Photos from "./Step2Photos";
import Step3Health from "./Step3Health";
import Step4Character from "./Step4Character";
import Step5Story from "./Step5Story";
import Step6Location from "./Step6Location";
import Step7Preview from "./Step7Preview";

type PublisherRole =
  | "association"
  | "refuge"
  | "benevole"
  | "fourriere"
  | "admin";

const ALLOWED_ROLES: PublisherRole[] = [
  "association",
  "refuge",
  "benevole",
  "fourriere",
  "admin",
];

const ROLE_LABELS: Record<PublisherRole, string> = {
  association: "Association",
  refuge: "Refuge / SIGFA",
  benevole: "Bénévole indépendant",
  fourriere: "Fourrière",
  admin: "Administration",
};

export default function AddAnimalPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [vigilancePoints, setVigilancePoints] = useState<string[]>([]);

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<PublisherRole | null>(null);
  const [publisherName, setPublisherName] = useState("");

  const [animal, setAnimal] = useState({
    animal_name: "",
    animal_type: "Chien",
    breed: "",
    sex: "Femelle",
    age_label: "",
    size_label: "",
    weight_kg: "",
    island: "",
    city: "",
    capture_location: "",
    street_duration_number: "",
    street_duration_unit: "jours",
    description_character: "",
    compatible_chiens: "",
    compatible_chats: "",
    compatible_enfants: "",
    energy_level: "",
    housing_need: "",
    alone_tolerance: "",
    adopter_experience_required: "",
    education_level: "",
    human_contact: "",
    daily_activity_need: "",
    ideal_family: "",
    story: "",
    health_status: "",
    vaccinated: false,
    sterilized: false,
    microchipped: false,
    is_published: false,
  });

  const checkAccess = useCallback(async () => {
    try {
      setCheckingAccess(true);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace(
          `/login?redirect=${encodeURIComponent(
            "/association/add-animal"
          )}`
        );

        return;
      }

      /*
       * La source de vérité pour les droits est la table profiles.
       * On ne se base plus sur user_metadata pour autoriser l'accès.
       */
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, role, first_name, last_name, organization_name, email, approval_status, is_active, is_verified"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileData) {
        alert(
          "Votre profil utilisateur est introuvable."
        );

        router.replace("/");
        return;
      }

      const userRole =
        String(profileData.role || "")
          .trim()
          .toLowerCase();

      const approvalStatus =
        String(
          profileData.approval_status ||
            "pending"
        )
          .trim()
          .toLowerCase();

      /*
       * Fonctionnement Taui Te Ora :
       *
       * - pending   : accès autorisé
       * - approved  : accès autorisé + structure vérifiée
       * - rejected  : accès refusé
       * - suspended : accès refusé
       * - is_active false : accès refusé
       *
       * is_verified est uniquement un indicateur de vérification.
       * Il ne bloque pas l'utilisation de la plateforme.
       */
      if (
        !ALLOWED_ROLES.includes(
          userRole as PublisherRole
        ) ||
        profileData.is_active === false ||
        approvalStatus === "rejected" ||
        approvalStatus === "suspended"
      ) {
        alert(
          "Votre compte ne permet pas actuellement d'ajouter des animaux."
        );

        router.replace("/");
        return;
      }

      const validRole =
        userRole as PublisherRole;

      setUserId(user.id);
      setRole(validRole);

      const organizationName =
        profileData.organization_name ||
        user.user_metadata?.organization_name ||
        "";

      const fullName =
        user.user_metadata?.full_name ||
        [
          profileData.first_name ||
            user.user_metadata?.first_name,
          profileData.last_name ||
            user.user_metadata?.last_name,
        ]
          .filter(Boolean)
          .join(" ");

      setPublisherName(
        organizationName ||
          fullName ||
          profileData.email ||
          user.email ||
          ROLE_LABELS[validRole]
      );
    } catch (error) {
      console.error(
        "Erreur vérification accès ajout animal :",
        error
      );

      router.replace("/");
    } finally {
      setCheckingAccess(false);
    }
  }, [router]);

  function updateField<
    K extends keyof typeof animal
  >(
    field: K,
    value: (typeof animal)[K]
  ) {
    setAnimal((previousAnimal) => ({
      ...previousAnimal,
      [field]: value,
    }));
  }

  function updateCharacterField(
    field: keyof typeof animal | "vigilance_points",
    value: string | string[]
  ) {
    if (field === "vigilance_points") {
      setVigilancePoints(
        Array.isArray(value) ? value : []
      );
      return;
    }

    if (Array.isArray(value)) {
      return;
    }

    updateField(field, value);
  }

  function validateAnimal() {
    if (!animal.animal_name.trim()) {
      alert(
        "Merci d’indiquer le nom de l’animal."
      );

      setStep(1);

      return false;
    }

    if (!animal.animal_type.trim()) {
      alert(
        "Merci d’indiquer le type d’animal."
      );

      setStep(1);

      return false;
    }

    if (!animal.sex.trim()) {
      alert(
        "Merci d’indiquer le sexe de l’animal."
      );

      setStep(1);

      return false;
    }

    if (!animal.island.trim()) {
      alert(
        "Merci d’indiquer l’île."
      );

      setStep(6);

      return false;
    }

    return true;
  }

  function getDashboardPath() {
    switch (role) {
      case "association":
        return "/association/dashboard";

      case "refuge":
        return "/refuge/dashboard";

      case "benevole":
        return "/benevole/dashboard";

      case "fourriere":
        return "/fourriere/dashboard";

      case "admin":
        return "/admin/dashboard";

      default:
        return "/";
    }
  }

  function getAnimalsPath() {
    /*
     * Pour l'instant tous les comptes éditeurs
     * utilisent la page de gestion existante.
     *
     * On pourra ensuite la transformer en
     * /publisher/animals si souhaité.
     */
    return "/association/animals";
  }

  async function saveAnimal(
    publish: boolean
  ) {
    try {
      if (!validateAnimal()) {
        return;
      }

      if (!userId || !role) {
        alert(
          "Votre session n'est plus valide. Merci de vous reconnecter."
        );

        router.push("/login");

        return;
      }

      setSaving(true);

      const streetDuration =
        animal.street_duration_number
          ? `${animal.street_duration_number} ${animal.street_duration_unit}`
          : null;

      /*
       * IMPORTANT :
       *
       * Je conserve ici exactement les champs que
       * ton animalService.create accepte déjà.
       *
       * La liaison avec userId / créateur sera ajoutée
       * dans animal.service.ts après vérification de
       * sa structure actuelle.
       */
      const createdAnimal =
        await animalService.create({
          animal_name:
            animal.animal_name,

          animal_type:
            animal.animal_type,

          breed:
            animal.breed || null,

          sex:
            animal.sex,

          age_label:
            animal.age_label || null,

          size_label:
            animal.size_label || null,

          weight_kg:
            animal.weight_kg
              ? Number(animal.weight_kg)
              : null,

          island:
            animal.island || null,

          city:
            animal.city || null,

          capture_location:
            animal.capture_location ||
            null,

          street_duration:
            streetDuration,

          description_character:
            animal.description_character ||
            null,

          compatible_chiens:
            animal.compatible_chiens ||
            null,

          compatible_chats:
            animal.compatible_chats ||
            null,

          compatible_enfants:
            animal.compatible_enfants ||
            null,

          energy_level:
            animal.energy_level || null,

          housing_need:
            animal.housing_need || null,

          alone_tolerance:
            animal.alone_tolerance || null,

          adopter_experience_required:
            animal.adopter_experience_required || null,

          education_level:
            animal.education_level || null,

          human_contact:
            animal.human_contact || null,

          daily_activity_need:
            animal.daily_activity_need || null,

          vigilance_points:
            vigilancePoints,

          ideal_family:
            animal.ideal_family || null,

          story:
            animal.story || null,

          health_status:
            animal.health_status || null,

          vaccinated:
            animal.vaccinated,

          sterilized:
            animal.sterilized,

          microchipped:
            animal.microchipped,

          is_published:
            publish,
        });

      if (photos.length > 0) {
        await photoService.uploadMany(
          photos,
          createdAnimal.id
        );
      }

      if (video) {
        await videoService.upload(
          video,
          createdAnimal.id
        );
      }

      alert(
        publish
          ? "Animal publié avec succès."
          : "Animal enregistré en brouillon."
      );

      router.push(
        getAnimalsPath()
      );
    } catch (error: unknown) {
      console.error(
        "Erreur enregistrement animal :",
        error
      );

      alert(
        error instanceof Error ? error.message :
          "Erreur lors de l’enregistrement de l’animal."
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void checkAccess());
  }, [checkAccess]);

  if (checkingAccess) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ef] px-5">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

          <p className="mt-4 font-bold text-[#667568]">
            Vérification de votre compte...
          </p>
        </div>
      </main>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 py-6 text-[#064b42] sm:p-8">
      <section className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="rounded-[28px] bg-white p-5 shadow-md sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
                Taui Te Ora
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-5xl">
                Ajouter un animal
              </h1>

              <p className="mt-2 text-gray-500">
                Créez une fiche animal complète pour l’adoption.
              </p>
            </div>

            <div className="rounded-[20px] bg-[#f8f1ea] px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wide text-[#a98b73]">
                Compte
              </p>

              <p className="mt-1 font-black text-[#064b42]">
                {ROLE_LABELS[role]}
              </p>

              {publisherName && (
                <p className="mt-1 max-w-[240px] truncate text-sm text-[#746c64]">
                  {publisherName}
                </p>
              )}
            </div>

          </div>
        </div>

        <ProgressBar step={step} />

        <div className="mt-8 rounded-[32px] bg-white p-5 shadow-xl sm:p-8">

          {step === 1 && (
            <Step1General
              animal={animal}
              updateField={updateField}
            />
          )}

          {step === 2 && (
            <Step2Photos
              photos={photos}
              setPhotos={setPhotos}
              video={video}
              setVideo={setVideo}
            />
          )}

          {step === 3 && (
            <Step3Health
              animal={animal}
              updateField={updateField}
            />
          )}

          {step === 4 && (
            <Step4Character
              animal={{
                ...animal,
                vigilance_points: vigilancePoints,
              }}
              updateField={updateCharacterField}
            />
          )}

          {step === 5 && (
            <Step5Story
              animal={animal}
              updateField={updateField}
            />
          )}

          {step === 6 && (
            <Step6Location
              animal={animal}
              updateField={updateField}
            />
          )}

          {step === 7 && (
            <Step7Preview
              animal={animal}
              photos={photos}
            />
          )}

          {/* NAVIGATION ÉTAPES */}

          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                step === 1
                  ? router.push(
                      getDashboardPath()
                    )
                  : setStep(
                      (currentStep) =>
                        currentStep - 1
                    )
              }
              className="rounded-2xl bg-gray-100 px-6 py-4 font-black disabled:opacity-60"
            >
              {step === 1
                ? "Annuler"
                : "Retour"}
            </button>

            {step < 7 ? (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setStep(
                    (currentStep) =>
                      currentStep + 1
                  )
                }
                className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white disabled:opacity-60"
              >
                Suivant
              </button>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    saveAnimal(false)
                  }
                  className="rounded-2xl bg-gray-100 px-6 py-4 font-black disabled:opacity-60"
                >
                  {saving
                    ? "Sauvegarde..."
                    : "Brouillon"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    saveAnimal(true)
                  }
                  className="rounded-2xl bg-[#064b42] px-6 py-4 font-black text-white disabled:opacity-60"
                >
                  {saving
                    ? "Publication..."
                    : "Publier"}
                </button>

              </div>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}