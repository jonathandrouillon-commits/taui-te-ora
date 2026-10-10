"use client";



import {

  useCallback,

  useEffect,

  useState,

} from "react";



import { useRouter } from "next/navigation";



import { supabase } from "../../../lib/supabase";



import ProgressBar from "../../../association/add-animal/ProgressBar";

import Step1General from "../../../association/add-animal/Step1General";

import Step2Photos from "../../../association/add-animal/Step2Photos";

import Step3Health from "../../../association/add-animal/Step3Health";

import Step4Character from "../../../association/add-animal/Step4Character";

import Step5Story from "../../../association/add-animal/Step5Story";

import Step6Location from "../../../association/add-animal/Step6Location";

import Step7Preview from "../../../association/add-animal/Step7Preview";



type Profile = {

  id: string;

  role?: string | null;

  first_name?: string | null;

  last_name?: string | null;

  organization_name?: string | null;

  display_name?: string | null;

  full_name?: string | null;

  email?: string | null;

};

function profileLabel(p: Profile) {

  return p.organization_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.display_name || p.full_name || p.email || p.id;

}



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



type SiblingGroupOption = {

  id: string;

  label: string;

};



const ROLE_LABELS: Record<PublisherRole, string> = {

  association: "Association",

  refuge: "Refuge / SIGFA",

  benevole: "Bénévole indépendant",

  fourriere: "Fourrière",

  admin: "Administration",

};



export default function AdminCreateAnimalPage() {

  const router = useRouter();



  const [step, setStep] = useState(1);

  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [ownerId, setOwnerId] = useState("");

  const [ownerSearch, setOwnerSearch] = useState("");

  const [loadError, setLoadError] = useState("");

  const [saving, setSaving] = useState(false);

  const [checkingAccess, setCheckingAccess] =

    useState(true);



  const [photos, setPhotos] = useState<File[]>([]);

  const [video, setVideo] = useState<File | null>(

    null

  );



  const [

    vigilancePoints,

    setVigilancePoints,

  ] = useState<string[]>([]);



  const [userId, setUserId] = useState("");

  const [role, setRole] =

    useState<PublisherRole | null>(null);



  const [

    publisherName,

    setPublisherName,

  ] = useState("");



  const [

    siblingGroups,

    setSiblingGroups,

  ] = useState<SiblingGroupOption[]>([]);



  const [

    facebookShareAnimalId,

    setFacebookShareAnimalId,

  ] = useState<string | null>(null);



  const [

    facebookShareAnimalName,

    setFacebookShareAnimalName,

  ] = useState("");



  const [animal, setAnimal] = useState({

    animal_name: "",

    animal_type: "Chien",

    breed: "",

    sex: "Femelle",

    age_label: "",

    size_label: "",

    weight_kg: "",

    sibling_group_id: "",

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

            "/admin/animals/create"

          )}`

        );



        return;

      }



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



      const userRole = String(

        profileData.role || ""

      )

        .trim()

        .toLowerCase();



      const approvalStatus = String(

        profileData.approval_status || "pending"

      )

        .trim()

        .toLowerCase();



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



      if (userRole !== "admin") {

        router.replace("/admin");

        return;

      }

      // Lecture serveur : l'API vérifie le rôle admin et utilise la clé
      // service_role côté serveur pour éviter les blocages RLS.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Session expirée. Merci de vous reconnecter.");
      }
      const profilesResponse = await fetch("/api/admin/animals", {
        method: "GET",
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const profilesResult = await profilesResponse.json();
      if (!profilesResponse.ok) {
        throw new Error(profilesResult?.error || "Impossible de charger les profils.");
      }
      setProfiles((profilesResult.profiles || []) as Profile[]);
      setOwnerId(user.id);

      const validRole =

        userRole as PublisherRole;



      setUserId(user.id);

      setRole(validRole);



      const {

        data: siblingRows,

        error: siblingRowsError,

      } = await supabase

        .from("animals")

        .select(

          "animal_name, sibling_group_id, created_at"

        )

        .eq("owner_id", user.id)

        .not("sibling_group_id", "is", null)

        .order("created_at", {

          ascending: true,

        });



      if (siblingRowsError) {

        console.error(

          "Erreur chargement des fratries :",

          siblingRowsError

        );

      } else {

        const groups = new Map<

          string,

          string[]

        >();



        for (const row of siblingRows || []) {

          const groupId = String(

            row.sibling_group_id || ""

          ).trim();



          if (!groupId) {

            continue;

          }



          const names =

            groups.get(groupId) || [];



          const animalName = String(

            row.animal_name || ""

          ).trim();



          if (

            animalName &&

            !names.includes(animalName)

          ) {

            names.push(animalName);

          }



          groups.set(groupId, names);

        }



        setSiblingGroups(

          Array.from(

            groups.entries()

          ).map(

            ([id, names], index) => ({

              id,

              label:

                names.length > 0

                  ? `Fratrie : ${names

                      .slice(0, 3)

                      .join(", ")}${

                      names.length > 3

                        ? "…"

                        : ""

                    }`

                  : `Fratrie ${index + 1}`,

            })

          )

        );

      }



      const organizationName =

        profileData.organization_name ||

        user.user_metadata

          ?.organization_name ||

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

      console.error("Erreur chargement admin :", error);

      setLoadError(error instanceof Error ? error.message : "Erreur de chargement des profils.");

    } finally {

      setCheckingAccess(false);

    }

  }, [router]);



  function updateField<

    K extends keyof typeof animal,

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

    field:

      | keyof typeof animal

      | "vigilance_points",

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

    if (!ownerId) {

      alert("Sélectionne le profil auquel appartient cet animal.");

      setStep(1);

      return false;

    }

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

      alert("Merci d’indiquer l’île.");



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

    return "/admin/animals";

  }



  function buildFacebookShareUrl(

    animalId: string

  ) {

    const publicAnimalUrl =

      `https://www.taui-te-ora.com/animal/${encodeURIComponent(

        animalId

      )}?adoption=1`;



    return (

      "https://www.facebook.com/sharer/sharer.php?u=" +

      encodeURIComponent(publicAnimalUrl)

    );

  }



  function closeShareModal() {

    setFacebookShareAnimalId(null);

    setFacebookShareAnimalName("");



    router.push(getAnimalsPath());

  }



  function shareOnPersonalFacebook() {

    if (!facebookShareAnimalId) {

      return;

    }



    const shareUrl =

      buildFacebookShareUrl(

        facebookShareAnimalId

      );



    window.open(

      shareUrl,

      "_blank",

      "noopener,noreferrer"

    );



    setFacebookShareAnimalId(null);

    setFacebookShareAnimalName("");



    router.push(getAnimalsPath());

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



      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) throw new Error("Session administrateur expirée.");

      const body = new FormData();

      body.append("owner_id", ownerId);

      body.append("animal_name", animal.animal_name);

      body.append("animal_type", animal.animal_type);

      body.append("street_duration", streetDuration || "");

      for (const [key, value] of Object.entries(animal)) {

        if (["animal_name", "animal_type", "street_duration_number", "street_duration_unit", "is_published"].includes(key)) continue;

        body.append(key, String(value));

      }

      body.append("vigilance_points", JSON.stringify(vigilancePoints));

      body.append("is_published", String(publish));

      for (const photo of photos) body.append("photos", photo);

      if (video) body.append("video", video);

      const response = await fetch("/api/admin/animals", {

        method: "POST",

        headers: { Authorization: `Bearer ${session.access_token}` },

        body,

      });

      const result = await response.json();

      if (!response.ok || !result?.animal?.id) {

        throw new Error(result?.error || "Impossible d'enregistrer l'animal.");

      }

      const createdAnimal = result.animal as { id: string };

      if (publish) {

        setFacebookShareAnimalId(

          createdAnimal.id

        );



        setFacebookShareAnimalName(

          animal.animal_name

        );



        return;

      }



      alert(

        "Animal enregistré en brouillon."

      );



      router.push(getAnimalsPath());

    } catch (error: unknown) {

      console.error(

        "Erreur enregistrement animal COMPLETE :",

        error

      );



      const supabaseError =

        error as {

          code?: string;

          message?: string;

          details?: string;

          hint?: string;

        };



      const errorLines = [

        supabaseError.code

          ? `Code : ${supabaseError.code}`

          : null,



        supabaseError.message

          ? `Message : ${supabaseError.message}`

          : null,



        supabaseError.details

          ? `Détails : ${supabaseError.details}`

          : null,



        supabaseError.hint

          ? `Aide : ${supabaseError.hint}`

          : null,

      ].filter(Boolean);



      alert(

        errorLines.length > 0

          ? errorLines.join("\n")

          : "Erreur inconnue lors de l’enregistrement de l’animal."

      );

    } finally {

      setSaving(false);

    }

  }



  useEffect(() => {

    queueMicrotask(() => {

      void checkAccess();

    });

  }, [checkAccess]);



  if (checkingAccess) {

    return (

      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ef] px-5">

        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />



          <p className="mt-4 font-bold text-[#667568]">

            Vérification de votre

            compte...

          </p>

        </div>

      </main>

    );

  }



  if (loadError) {

    return <main className="min-h-screen bg-[#fbf7ef] p-8 text-red-700">{loadError}</main>;

  }

  if (!role) return null;



  return (

    <>

      <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 py-6 text-[#064b42] sm:p-8">

        <section className="mx-auto max-w-5xl">

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

                  Créez une fiche animal

                  complète pour

                  l’adoption.

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



          <div className="mt-5 rounded-[28px] bg-white p-5 shadow-md sm:p-6">

            <label className="block text-sm font-black text-[#064b42]">À quel profil appartient cet animal ? *</label>

            <input className="input mt-3 w-full" placeholder="Rechercher une association, un refuge, un bénévole ou un profil..."

              value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)} />

            <select className="input mt-3 w-full" value={ownerId} onChange={e => setOwnerId(e.target.value)}>

              <option value="">Choisir le propriétaire / responsable</option>

              {profiles.filter(profile => !ownerSearch || `${profileLabel(profile)} ${profile.role || ""} ${profile.email || ""}`.toLowerCase().includes(ownerSearch.toLowerCase()) || profile.id === ownerId).map(profile => (

                <option key={profile.id} value={profile.id}>{profileLabel(profile)} — {profile.role || "profil"}</option>

              ))}

            </select>

            <p className="mt-2 text-xs text-gray-500">La fiche sera rattachée au profil choisi, pas à l'administrateur.</p>

          </div>

          <ProgressBar step={step} />



          <div className="mt-8 rounded-[32px] bg-white p-5 shadow-xl sm:p-8">

            {step === 1 && (

              <Step1General

                animal={animal}

                siblingGroups={

                  siblingGroups

                }

                updateField={

                  updateField

                }

              />

            )}



            {step === 2 && (

              <Step2Photos

                photos={photos}

                setPhotos={

                  setPhotos

                }

                video={video}

                setVideo={setVideo}

              />

            )}



            {step === 3 && (

              <Step3Health

                animal={animal}

                updateField={

                  updateField

                }

              />

            )}



            {step === 4 && (

              <Step4Character

                animal={{

                  ...animal,

                  vigilance_points:

                    vigilancePoints,

                }}

                updateField={

                  updateCharacterField

                }

              />

            )}



            {step === 5 && (

              <Step5Story

                animal={animal}

                updateField={

                  updateField

                }

              />

            )}



            {step === 6 && (

              <Step6Location

                animal={animal}

                updateField={

                  updateField

                }

              />

            )}



            {step === 7 && (

              <Step7Preview

                animal={animal}

                photos={photos}

              />

            )}



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

                        (

                          currentStep

                        ) =>

                          currentStep -

                          1

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

                      (

                        currentStep

                      ) =>

                        currentStep +

                        1

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



      {facebookShareAnimalId && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md rounded-[30px] bg-white p-6 text-center shadow-2xl sm:p-8">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fcecef] text-3xl">

              🐾

            </div>



            <h2 className="mt-5 text-2xl font-black text-[#064b42]">

              Animal publié !

            </h2>



            <p className="mt-3 text-sm leading-6 text-gray-600">

              <strong>

                {facebookShareAnimalName ||

                  "L’animal"}

              </strong>{" "}

              est maintenant publié sur

              TAUI TE ORA.

            </p>



            <div className="mt-4 rounded-2xl bg-[#f5f9f7] px-4 py-4 text-sm leading-6 text-[#064b42]">

              Son annonce sera

              automatiquement partagée

              sur la page Facebook{" "}

              <strong>

                Les Veilleurs de Kali

              </strong>

              .

            </div>



            <p className="mt-5 font-bold text-[#064b42]">

              Souhaitez-vous également

              partager cette annonce sur

              votre profil Facebook ?

            </p>



            <div className="mt-6 flex flex-col gap-3">

              <button

                type="button"

                onClick={

                  shareOnPersonalFacebook

                }

                className="rounded-2xl bg-[#1877f2] px-5 py-4 font-black text-white shadow-md"

              >

                Partager sur Facebook

              </button>



              <button

                type="button"

                onClick={closeShareModal}

                className="rounded-2xl bg-gray-100 px-5 py-4 font-black text-[#064b42]"

              >

                Non merci

              </button>

            </div>

          </div>

        </div>

      )}

    </>

  );

}