"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  island?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;

  adopter_experience?: string | null;
  current_animals?: string | null;
  adoption_for?: string | null;
  children_age?: string | null;
  garden_type?: string | null;
  ideal_age?: string | null;
  ideal_sex?: string | null;
  ideal_size?: string | null;
  ideal_activity?: string | null;
  ideal_breed?: string | null;
  hypoallergenic?: string | null;
  cleanliness?: string | null;
  special_needs?: string | null;
};

type AdoptionRequest = {
  id: string;
  owner_id?: string | null;
  requester_id?: string | null;
  animal_id?: string | null;
  status?: string | null;
  match_score?: number | null;
  match_level?: string | null;
};

type Animal = {
  id: string;
  animal_name?: string | null;
  animal_type?: string | null;
  age_label?: string | null;
  animal_photos?: {
    id?: string;
    photo_url?: string | null;
    is_cover?: boolean | null;
    sort_order?: number | null;
  }[] | null;
};

const ALLOWED_ROLES = new Set([
  "association",
  "refuge",
  "fourriere",
  "benevole",
  "admin",
]);

export default function AdoptantPublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const adoptantId = Array.isArray(params.id)
    ? params.id[0]
    : String(params.id || "");

  const requestId = searchParams.get("request");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [request, setRequest] = useState<AdoptionRequest | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);

  useEffect(() => {
    if (adoptantId) {
      loadProfile();
    }
  }, [adoptantId, requestId]);

  async function loadProfile() {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace(
          "/login?redirect=" +
            encodeURIComponent(
              `/adoptant/${adoptantId}${
                requestId ? `?request=${requestId}` : ""
              }`
            )
        );
        return;
      }

      const { data: viewer, error: viewerError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (viewerError) throw viewerError;

      const viewerRole = String(viewer?.role || "")
        .trim()
        .toLowerCase();

      if (!ALLOWED_ROLES.has(viewerRole)) {
        throw new Error(
          "Vous n'êtes pas autorisé à consulter ce profil adoptant."
        );
      }

      let requestQuery = supabase
        .from("adoption_requests")
        .select(
          "id, owner_id, requester_id, animal_id, status, match_score, match_level"
        )
        .eq("requester_id", adoptantId);

      if (requestId) {
        requestQuery = requestQuery.eq("id", requestId);
      }

      if (viewerRole !== "admin") {
        requestQuery = requestQuery.eq("owner_id", user.id);
      }

      const {
        data: requestData,
        error: requestError,
      } = await requestQuery
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError) throw requestError;

      if (!requestData) {
        throw new Error(
          "Ce profil n'est accessible que lorsqu'une demande d'adoption concerne l'un de vos animaux."
        );
      }

      setRequest(requestData as AdoptionRequest);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          role,
          first_name,
          last_name,
          birth_date,
          phone,
          email,
          avatar_url,
          island,
          city,
          address,
          postal_code,
          adopter_experience,
          current_animals,
          adoption_for,
          children_age,
          garden_type,
          ideal_age,
          ideal_sex,
          ideal_size,
          ideal_activity,
          ideal_breed,
          hypoallergenic,
          cleanliness,
          special_needs
        `)
        .eq("id", adoptantId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        throw new Error("Profil adoptant introuvable.");
      }

      setProfile(profileData as Profile);

      if (requestData.animal_id) {
        const { data: animalData, error: animalError } = await supabase
          .from("animals")
          .select(`
            id,
            animal_name,
            animal_type,
            age_label,
            animal_photos (
              id,
              photo_url,
              is_cover,
              sort_order
            )
          `)
          .eq("id", requestData.animal_id)
          .maybeSingle();

        if (animalError) {
          console.error("Erreur animal :", animalError);
        } else {
          setAnimal((animalData as Animal | null) || null);
        }
      }
    } catch (error: any) {
      console.error("Erreur profil adoptant :", error);
      setErrorMessage(
        error?.message || "Impossible de charger le profil adoptant."
      );
    } finally {
      setLoading(false);
    }
  }

  const fullName = useMemo(() => {
    if (!profile) return "Adoptant";

    return (
      `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
      "Adoptant"
    );
  }, [profile]);

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-[#f8f4ec] p-8 text-center font-bold text-[#064b42]">
        Chargement du profil adoptant...
      </main>
    );
  }

  if (errorMessage || !profile || !request) {
    return (
      <main className="min-h-[100dvh] bg-[#f8f4ec] p-6">
        <div className="mx-auto max-w-xl rounded-[28px] bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-[#064b42]">
            Profil indisponible
          </h1>

          <p className="mt-4 text-[#6f5a47]">
            {errorMessage || "Profil adoptant introuvable."}
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            Retour
          </button>
        </div>
      </main>
    );
  }

  const animalPhoto = getAnimalPhoto(animal);

  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] px-4 py-8 pb-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 rounded-full bg-white px-5 py-3 font-black text-[#064b42] shadow"
        >
          ← Retour
        </button>

        <section className="rounded-[30px] bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={fullName}
                className="h-28 w-28 rounded-full object-cover shadow"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#f8f4ec] text-5xl">
                👤
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9c7b54]">
                Profil adoptant
              </p>

              <h1 className="mt-1 text-3xl font-black text-[#064b42]">
                {fullName}
              </h1>

              <p className="mt-2 text-[#6f5a47]">
                {[profile.city, profile.island]
                  .filter(Boolean)
                  .join(" · ") || "Localisation non renseignée"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {typeof request.match_score === "number" && (
                  <span className="rounded-full bg-[#e8f5f1] px-4 py-2 text-sm font-black text-[#064b42]">
                    ❤️ Compatibilité {request.match_score} %
                  </span>
                )}

                <span className="rounded-full bg-[#f8f4ec] px-4 py-2 text-sm font-black text-[#6f5a47]">
                  {getStatusLabel(request.status)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {animal && (
          <section className="mt-6 rounded-[30px] bg-white p-5 shadow">
            <h2 className="text-xl font-black text-[#064b42]">
              Demande concernant
            </h2>

            <div className="mt-4 flex items-center gap-4 rounded-[22px] bg-[#f8f4ec] p-4">
              {animalPhoto ? (
                <img
                  src={animalPhoto}
                  alt={animal.animal_name || "Animal"}
                  className="h-20 w-20 rounded-[18px] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-[18px] bg-white text-3xl">
                  🐾
                </div>
              )}

              <div>
                <h3 className="text-xl font-black text-[#2f241c]">
                  {animal.animal_name || "Animal"}
                </h3>

                <p className="mt-1 text-sm text-[#6f5a47]">
                  {[animal.animal_type, animal.age_label]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
          <h2 className="text-xl font-black text-[#064b42]">
            Informations personnelles
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info title="Âge" value={formatAge(profile.birth_date)} />
            <Info title="Téléphone" value={profile.phone} />
            <Info title="Email" value={profile.email} />
            <Info
              title="Adresse"
              value={[
                profile.address,
                profile.postal_code,
                profile.city,
                profile.island,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          </div>
        </section>

        <section className="mt-6 rounded-[30px] bg-white p-6 shadow">
          <h2 className="text-xl font-black text-[#064b42]">
            Questionnaire adoptant
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info
              title="Expérience avec les animaux"
              value={profile.adopter_experience}
            />

            <Info
              title="Animaux actuels"
              value={profile.current_animals}
            />

            <Info
              title="Adoption pour"
              value={profile.adoption_for}
            />

            <Info
              title="Enfants"
              value={profile.children_age}
            />

            <Info
              title="Jardin / extérieur"
              value={profile.garden_type}
            />

            <Info
              title="Âge souhaité"
              value={profile.ideal_age}
            />

            <Info
              title="Sexe souhaité"
              value={profile.ideal_sex}
            />

            <Info
              title="Taille souhaitée"
              value={profile.ideal_size}
            />

            <Info
              title="Activité souhaitée"
              value={profile.ideal_activity}
            />

            <Info
              title="Race souhaitée"
              value={profile.ideal_breed}
            />

            <Info
              title="Hypoallergénique"
              value={profile.hypoallergenic}
            />

            <Info
              title="Propreté"
              value={profile.cleanliness}
            />
          </div>

          <div className="mt-3">
            <Info
              title="Besoins particuliers acceptés"
              value={profile.special_needs}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-[20px] bg-[#faf7f2] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#b58b5b]">
        {title}
      </p>

      <p className="mt-2 whitespace-pre-wrap font-semibold text-[#064b42]">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}

function formatAge(
  birthDate?: string | null
) {
  if (!birthDate) {
    return "Non renseigné";
  }

  const birth =
    new Date(birthDate);

  if (
    Number.isNaN(
      birth.getTime()
    )
  ) {
    return "Non renseigné";
  }

  const today =
    new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const month =
    today.getMonth() -
    birth.getMonth();

  if (
    month < 0 ||
    (
      month === 0 &&
      today.getDate() <
        birth.getDate()
    )
  ) {
    age -= 1;
  }

  return `${age} ans`;
}

function getStatusLabel(
  status?: string | null
) {
  switch (
    String(
      status || "pending"
    ).toLowerCase()
  ) {
    case "meeting":
      return "🤝 Rencontre";
    case "accepted":
      return "✅ Adoption validée";
    case "rejected":
    case "refused":
      return "❌ Demande refusée";
    case "cancelled":
      return "Demande annulée";
    case "pending":
    default:
      return "⏳ En attente";
  }
}

function getAnimalPhoto(
  animal: Animal | null
) {
  if (!animal) {
    return "";
  }

  const photos =
    Array.isArray(
      animal.animal_photos
    )
      ? animal.animal_photos
      : [];

  const cover =
    photos.find(
      (photo) =>
        photo.is_cover
    ) ||
    photos
      .slice()
      .sort(
        (a, b) =>
          Number(
            a.sort_order ||
              0
          ) -
          Number(
            b.sort_order ||
              0
          )
      )[0];

  return (
    cover?.photo_url ||
    ""
  );
}