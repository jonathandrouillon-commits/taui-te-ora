"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "../../../../lib/supabase";

type AnimalStatus =
  | "available"
  | "adopted"
  | "archive";

type AnimalForm = {
  reference_number: string;
  animal_name: string;
  animal_type: string;
  age_label: string;
  sex: string;
  breed: string;
  size_label: string;
  association_name: string;
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
  status: string;
  compatible_chiens: string;
  compatible_chats: string;
  compatible_enfants: string;
  is_published: boolean;
  is_adopted: boolean;
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
};

const EMPTY_FORM: AnimalForm = {
  reference_number: "",
  animal_name: "",
  animal_type: "",
  age_label: "",
  sex: "",
  breed: "",
  size_label: "",
  association_name: "",
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
  status: "available",
  compatible_chiens: "",
  compatible_chats: "",
  compatible_enfants: "",
  is_published: false,
  is_adopted: false,
  vaccinated: false,
  sterilized: false,
  microchipped: false,
};

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();

  const animalId =
    params.animalId as string;

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState<AnimalForm>(
      EMPTY_FORM
    );

  const checkAdminAndLoadAnimal =
    useCallback(async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace(
            `/login?redirect=/admin/animals/${animalId}/edit`
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

        if (
          String(
            profile?.role || ""
          )
            .trim()
            .toLowerCase() !==
          "admin"
        ) {
          router.replace("/");
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from("animals")
            .select("*")
            .eq("id", animalId)
            .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          alert(
            "Animal introuvable."
          );

          router.replace(
            "/admin/animals"
          );
          return;
        }

        setForm({
          reference_number:
            data.reference_number ||
            "",
          animal_name:
            data.animal_name || "",
          animal_type:
            data.animal_type || "",
          age_label:
            data.age_label || "",
          sex:
            data.sex || "",
          breed:
            data.breed || "",
          size_label:
            data.size_label || "",
          association_name:
            data.association_name ||
            "",
          street_duration:
            data.street_duration ||
            "",
          capture_location:
            data.capture_location ||
            "",
          island:
            data.island || "",
          city:
            data.city || "",
          map_address:
            data.map_address || "",
          description_character:
            data.description_character ||
            "",
          health_status:
            data.health_status || "",
          special_needs:
            data.special_needs || "",
          story:
            data.story || "",
          weight_kg:
            data.weight_kg !==
              null &&
            data.weight_kg !==
              undefined
              ? String(
                  data.weight_kg
                )
              : "",
          status:
            data.status ||
            "available",
          compatible_chiens:
            data.compatible_chiens ||
            "",
          compatible_chats:
            data.compatible_chats ||
            "",
          compatible_enfants:
            data.compatible_enfants ||
            "",
          is_published:
            !!data.is_published,
          is_adopted:
            !!data.is_adopted,
          vaccinated:
            !!data.vaccinated,
          sterilized:
            !!data.sterilized,
          microchipped:
            !!data.microchipped,
        });
      } catch (error: unknown) {
        console.error(
          "Erreur chargement animal :",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Impossible de charger cet animal."
        );

        router.replace(
          "/admin/animals"
        );
      } finally {
        setLoading(false);
      }
    }, [animalId, router]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void checkAdminAndLoadAnimal();
        },
        0
      );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    checkAdminAndLoadAnimal,
  ]);

  function updateField(
    name: keyof AnimalForm,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function changeStatus(
    status: AnimalStatus
  ) {
    setForm((previous) => {
      if (
        status === "adopted"
      ) {
        return {
          ...previous,
          status: "adopted",
          is_adopted: true,
          is_published: false,
        };
      }

      if (
        status === "archive"
      ) {
        return {
          ...previous,
          status: "archive",
          is_adopted: false,
          is_published: false,
        };
      }

      return {
        ...previous,
        status: "available",
        is_adopted: false,
        is_published: false,
      };
    });
  }

  function togglePublication() {
    if (
      form.is_adopted ||
      form.status === "adopted"
    ) {
      alert(
        "Un animal adopté ne peut pas être publié."
      );
      return;
    }

    if (
      form.status === "archive"
    ) {
      alert(
        "Un animal archivé doit d'abord être réactivé."
      );
      return;
    }

    setForm((previous) => ({
      ...previous,
      is_published:
        !previous.is_published,
    }));
  }

  async function saveAnimal() {
    if (!form.animal_name.trim()) {
      alert(
        "Le nom de l'animal est obligatoire."
      );
      return;
    }

    const weight =
      form.weight_kg.trim();

    if (
      weight &&
      (!Number.isFinite(
        Number(weight)
      ) ||
        Number(weight) < 0)
    ) {
      alert(
        "Le poids doit être un nombre valide."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw (
          userError ||
          new Error(
            "Utilisateur non connecté."
          )
        );
      }

      const normalizedStatus =
        form.is_adopted
          ? "adopted"
          : form.status ===
              "archive"
            ? "archive"
            : "available";

      const published =
        normalizedStatus ===
          "available" &&
        form.is_published;

      const { error } =
        await supabase
          .from("animals")
          .update({
            reference_number:
              form.reference_number.trim(),
            animal_name:
              form.animal_name.trim(),
            animal_type:
              form.animal_type.trim(),
            age_label:
              form.age_label.trim(),
            sex:
              form.sex.trim(),
            breed:
              form.breed.trim(),
            size_label:
              form.size_label.trim(),
            association_name:
              form.association_name.trim(),
            street_duration:
              form.street_duration.trim(),
            capture_location:
              form.capture_location.trim(),
            island:
              form.island.trim(),
            city:
              form.city.trim(),
            map_address:
              form.map_address.trim(),
            description_character:
              form.description_character.trim(),
            health_status:
              form.health_status.trim(),
            special_needs:
              form.special_needs.trim(),
            story:
              form.story.trim(),
            weight_kg: weight
              ? Number(weight)
              : null,
            status:
              normalizedStatus,
            compatible_chiens:
              form.compatible_chiens.trim(),
            compatible_chats:
              form.compatible_chats.trim(),
            compatible_enfants:
              form.compatible_enfants.trim(),
            is_published:
              published,
            is_adopted:
              normalizedStatus ===
              "adopted",
            vaccinated:
              form.vaccinated,
            sterilized:
              form.sterilized,
            microchipped:
              form.microchipped,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", animalId);

      if (error) {
        throw error;
      }

      alert(
        "Profil animal mis à jour."
      );

      router.push(
        "/admin/animals"
      );
    } catch (error: unknown) {
      console.error(
        "Erreur enregistrement animal :",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
        <p className="font-bold text-[#064b42]">
          Chargement du profil animal...
        </p>
      </main>
    );
  }

  const currentStatus:
    AnimalStatus =
      form.is_adopted ||
      form.status === "adopted"
        ? "adopted"
        : form.status ===
            "archive"
          ? "archive"
          : "available";

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 pb-16 pt-24 text-[#064b42] sm:px-8">
      <section className="mx-auto max-w-6xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/animals"
            )
          }
          className="mb-6 flex items-center gap-2 font-black"
        >
          <ArrowLeft size={20} />
          Retour aux animaux
        </button>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b68b2f]">
            Administration
          </p>

          <h1 className="mt-1 text-4xl font-black sm:text-5xl">
            Modifier le profil animal
          </h1>

          <p className="mt-2 text-[#6f5a47]">
            Gestion complète des informations,
            de la publication et du statut.
          </p>
        </div>

        <Section
          title="Informations principales"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Référence"
              value={
                form.reference_number
              }
              onChange={(value) =>
                updateField(
                  "reference_number",
                  value
                )
              }
            />

            <Input
              label="Nom de l'animal"
              value={
                form.animal_name
              }
              onChange={(value) =>
                updateField(
                  "animal_name",
                  value
                )
              }
            />

            <Input
              label="Type"
              value={
                form.animal_type
              }
              onChange={(value) =>
                updateField(
                  "animal_type",
                  value
                )
              }
            />

            <Input
              label="Âge"
              value={
                form.age_label
              }
              onChange={(value) =>
                updateField(
                  "age_label",
                  value
                )
              }
            />

            <Input
              label="Sexe"
              value={form.sex}
              onChange={(value) =>
                updateField(
                  "sex",
                  value
                )
              }
            />

            <Input
              label="Race"
              value={form.breed}
              onChange={(value) =>
                updateField(
                  "breed",
                  value
                )
              }
            />

            <Input
              label="Taille"
              value={
                form.size_label
              }
              onChange={(value) =>
                updateField(
                  "size_label",
                  value
                )
              }
            />

            <Input
              label="Poids kg"
              value={
                form.weight_kg
              }
              onChange={(value) =>
                updateField(
                  "weight_kg",
                  value
                )
              }
            />
          </div>
        </Section>

        <Section
          title="Structure et localisation"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Structure"
              value={
                form.association_name
              }
              onChange={(value) =>
                updateField(
                  "association_name",
                  value
                )
              }
            />

            <Input
              label="Île"
              value={form.island}
              onChange={(value) =>
                updateField(
                  "island",
                  value
                )
              }
            />

            <Input
              label="Commune"
              value={form.city}
              onChange={(value) =>
                updateField(
                  "city",
                  value
                )
              }
            />

            <Input
              label="Adresse carte"
              value={
                form.map_address
              }
              onChange={(value) =>
                updateField(
                  "map_address",
                  value
                )
              }
            />

            <Input
              label="Lieu de capture"
              value={
                form.capture_location
              }
              onChange={(value) =>
                updateField(
                  "capture_location",
                  value
                )
              }
            />

            <Input
              label="Temps dans la rue"
              value={
                form.street_duration
              }
              onChange={(value) =>
                updateField(
                  "street_duration",
                  value
                )
              }
            />
          </div>
        </Section>

        <Section
          title="Description complète"
        >
          <div className="space-y-5">
            <Textarea
              label="Caractère"
              value={
                form.description_character
              }
              onChange={(value) =>
                updateField(
                  "description_character",
                  value
                )
              }
            />

            <Textarea
              label="Histoire"
              value={form.story}
              onChange={(value) =>
                updateField(
                  "story",
                  value
                )
              }
            />

            <Textarea
              label="état de santé"
              value={
                form.health_status
              }
              onChange={(value) =>
                updateField(
                  "health_status",
                  value
                )
              }
            />

            <Textarea
              label="Besoins particuliers"
              value={
                form.special_needs
              }
              onChange={(value) =>
                updateField(
                  "special_needs",
                  value
                )
              }
            />
          </div>
        </Section>

        <Section
          title="Compatibilités et santé"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Compatible chiens"
              value={
                form.compatible_chiens
              }
              onChange={(value) =>
                updateField(
                  "compatible_chiens",
                  value
                )
              }
            />

            <Input
              label="Compatible chats"
              value={
                form.compatible_chats
              }
              onChange={(value) =>
                updateField(
                  "compatible_chats",
                  value
                )
              }
            />

            <Input
              label="Compatible enfants"
              value={
                form.compatible_enfants
              }
              onChange={(value) =>
                updateField(
                  "compatible_enfants",
                  value
                )
              }
            />

            <BooleanSelect
              label="Vacciné"
              value={
                form.vaccinated
              }
              onChange={(value) =>
                updateField(
                  "vaccinated",
                  value
                )
              }
            />

            <BooleanSelect
              label="Stérilisé"
              value={
                form.sterilized
              }
              onChange={(value) =>
                updateField(
                  "sterilized",
                  value
                )
              }
            />

            <BooleanSelect
              label="Pucé"
              value={
                form.microchipped
              }
              onChange={(value) =>
                updateField(
                  "microchipped",
                  value
                )
              }
            />
          </div>
        </Section>

        <Section
          title="Statut et publication"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <StatusButton
              active={
                currentStatus ===
                "available"
              }
              title="Disponible"
              description="Animal actif, publiable."
              onClick={() =>
                changeStatus(
                  "available"
                )
              }
            />

            <StatusButton
              active={
                currentStatus ===
                "adopted"
              }
              title="Adopté"
              description="Retiré automatiquement des annonces."
              onClick={() =>
                changeStatus(
                  "adopted"
                )
              }
            />

            <StatusButton
              active={
                currentStatus ===
                "archive"
              }
              title="Archivé"
              description="Conservé dans l'historique."
              onClick={() =>
                changeStatus(
                  "archive"
                )
              }
            />
          </div>

          <div className="mt-6 rounded-3xl border border-[#eadfce] bg-[#faf7f2] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-black">
                  Publication publique
                </p>

                <p className="mt-1 text-sm text-[#6f5a47]">
                  {form.is_published
                    ? "Cet animal est actuellement visible sur TAUI TE ORA."
                    : "Cet animal n'est pas visible dans les annonces publiques."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  togglePublication
                }
                disabled={
                  currentStatus !==
                  "available"
                }
                className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-40 ${
                  form.is_published
                    ? "bg-amber-100 text-amber-800"
                    : "bg-[#064b42] text-white"
                }`}
              >
                {form.is_published ? (
                  <>
                    <EyeOff
                      size={18}
                    />
                    Dépublier
                  </>
                ) : (
                  <>
                    <Eye
                      size={18}
                    />
                    Publier
                  </>
                )}
              </button>
            </div>
          </div>
        </Section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={saveAnimal}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-8 py-4 font-black text-white shadow disabled:opacity-50"
          >
            <Save size={19} />

            {saving
              ? "Enregistrement..."
              : "Enregistrer les modifications"}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/animal/${animalId}`
              )
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-black text-[#064b42] shadow"
          >
            <CheckCircle2
              size={19}
            />
            Voir la fiche
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/animals"
              )
            }
            className="rounded-2xl bg-white px-8 py-4 font-black text-gray-600 shadow"
          >
            Annuler
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          La suppression définitive n&apos;est plus proposée ici.
          Utilisez l&apos;archivage pour conserver l&apos;historique des
          adoptions, conversations et données liées à l&apos;animal.
        </div>
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
    <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-black text-[#2f241c]">
        {title}
      </h2>

      {children}
    </section>
  );
}

function Input({
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
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </div>
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
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        rows={5}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}

function BooleanSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">
        {label}
      </label>

      <select
        value={
          value
            ? "true"
            : "false"
        }
        onChange={(event) =>
          onChange(
            event.target.value ===
              "true"
          )
        }
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      >
        <option value="true">
          Oui
        </option>

        <option value="false">
          Non
        </option>
      </select>
    </div>
  );
}

function StatusButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition ${
        active
          ? "border-[#064b42] bg-[#064b42] text-white"
          : "border-[#eadfce] bg-[#faf7f2] text-[#064b42]"
      }`}
    >
      <p className="font-black">
        {title}
      </p>

      <p
        className={`mt-1 text-sm ${
          active
            ? "text-white/80"
            : "text-[#6f5a47]"
        }`}
      >
        {description}
      </p>
    </button>
  );
}
