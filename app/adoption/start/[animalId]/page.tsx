"use client";

import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eraser,
  FileSignature,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { animalService } from "../../../services/animal.service";
import { compatibilityService } from "../../../services/compatibility.service";

type QuestionnaireData = {
  proprietaire_animal: string;
  animal_actuel: string;
  adoption_pour: string;
  enfants: string;
  jardin: string;
  age_souhaite: string;
  sexe_souhaite: string;
  taille_souhaitee: string;
  activite_souhaitee: string;
  hypoallergenique: string;
  proprete: string;
  besoins_speciaux: string;
  race_souhaitee: string;
};

type AnimalRow = {
  id: string;
  animal_name: string | null;
  owner_id: string;
  garden_requirement?: string | null;
  enfants_moins_8?: string | null;
  enfants_8_14?: string | null;
  enfants_15_plus?: string | null;
  foyer_chiens?: string | null;
  foyer_chats?: string | null;
  foyer_autres?: string | null;
  activity_level?: string | null;
  experience_recommandee?: string | null;
  handicap?: boolean | null;
  traitement_regulier?: boolean | null;
  craintif_traumatise?: boolean | null;
  education_a_poursuivre?: boolean | null;
};

type OwnerProfile = {
  id: string;
  role: string | null;
  organization_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type ConditionRow = {
  id: string;
  label: string;
  sort_order: number;
};

type AdoptionRequest = {
  id: string;
  animal_id: string;
  requester_id: string;
  owner_id: string;
  status: string;
};

type MatchResult = {
  score: number;
  level: string;
  details: unknown;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return String((error as { message: string }).message);
  }

  return "Une erreur est survenue lors de l'envoi de votre demande.";
}

function ownerDisplayName(owner: OwnerProfile | null) {
  if (!owner) return "la structure";

  if (owner.organization_name?.trim()) {
    return owner.organization_name.trim();
  }

  const fullName = [owner.first_name, owner.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "la structure";
}

export default function AdoptionStartPage() {
  const router = useRouter();
  const params = useParams();

  const animalId = Array.isArray(params.animalId)
    ? params.animalId[0]
    : String(params.animalId || "");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [userId, setUserId] = useState("");
  const [animal, setAnimal] = useState<AnimalRow | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [conditions, setConditions] = useState<ConditionRow[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [signerName, setSignerName] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [existingRequest, setExistingRequest] = useState<AdoptionRequest | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);

  const loadQuestionnaire = useCallback(async (profileId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
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
        `
      )
      .eq("id", profileId)
      .maybeSingle();

    if (error) throw error;

    if (
      !data ||
      !data.adopter_experience ||
      !data.garden_type ||
      !data.ideal_age ||
      !data.ideal_sex ||
      !data.ideal_size ||
      !data.ideal_activity
    ) {
      return null;
    }

    const questionnaire: QuestionnaireData = {
      proprietaire_animal: data.adopter_experience || "",
      animal_actuel: data.current_animals || "Aucun",
      adoption_pour: data.adoption_for || "Moi / Ma famille",
      enfants: data.children_age || "Non",
      jardin: data.garden_type || "Pas de jardin",
      age_souhaite: data.ideal_age || "",
      sexe_souhaite: data.ideal_sex || "",
      taille_souhaitee: data.ideal_size || "",
      activite_souhaitee: data.ideal_activity || "Pas de préférence",
      hypoallergenique: data.hypoallergenic || "Pas de préférence",
      proprete: data.cleanliness || "Pas de préférence",
      besoins_speciaux: data.special_needs || "Non",
      race_souhaitee: data.ideal_breed || "",
    };

    return questionnaire;
  }, []);

  const findExistingConversation = useCallback(async (requestId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("adoption_request_id", requestId)
      .maybeSingle();

    if (error) throw error;
    return data?.id || null;
  }, []);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!animalId) {
        router.replace("/");
        return;
      }

      const confirmationReceived =
        new URLSearchParams(window.location.search).get("confirm") === "1";

      if (!confirmationReceived) {
        router.replace(`/animal/${encodeURIComponent(animalId)}?adoption=1`);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user) {
        router.replace(
          "/login?redirect=" +
            encodeURIComponent(`/adoption/start/${animalId}?confirm=1`)
        );
        return;
      }

      const access = await animalService.getCurrentUserAccess();

      if (!access.role) {
        router.replace(
          "/choose-role?redirect=" +
            encodeURIComponent(`/adoption/start/${animalId}?confirm=1`)
        );
        return;
      }

      if (!access.isActive) {
        throw new Error("Votre compte est actuellement désactivé.");
      }

      if (
        access.approvalStatus === "rejected" ||
        access.approvalStatus === "suspended"
      ) {
        throw new Error(
          "Votre compte ne permet pas actuellement d'effectuer une demande d'adoption."
        );
      }

      if (access.role !== "adoptant") {
        throw new Error(
          "Pour faire une demande d'adoption, vous devez utiliser un profil Adoptant."
        );
      }

      const questionnaire = await loadQuestionnaire(access.userId);

      if (!questionnaire) {
        alert(
          "Complétez votre profil adoptant avant de valider votre demande d'adoption."
        );

        router.replace(
          "/adoptant/questionnaire?redirect=" +
            encodeURIComponent(`/adoption/start/${animalId}?confirm=1`)
        );
        return;
      }

      const { data: requestData, error: requestError } = await supabase
        .from("adoption_requests")
        .select("id, animal_id, requester_id, owner_id, status")
        .eq("animal_id", animalId)
        .eq("requester_id", access.userId)
        .maybeSingle();

      if (requestError) throw requestError;

      if (requestData) {
        const conversationId = await findExistingConversation(requestData.id);

        if (conversationId) {
          router.replace(`/messages/${conversationId}`);
          return;
        }

        setExistingRequest(requestData as AdoptionRequest);
      }

      const { data: animalData, error: animalError } = await supabase
        .from("animals")
        .select(
          `
            id,
            animal_name,
            owner_id,
            garden_requirement,
            enfants_moins_8,
            enfants_8_14,
            enfants_15_plus,
            foyer_chiens,
            foyer_chats,
            foyer_autres,
            activity_level,
            experience_recommandee,
            handicap,
            traitement_regulier,
            craintif_traumatise,
            education_a_poursuivre
          `
        )
        .eq("id", animalId)
        .single();

      if (animalError) throw animalError;
      if (!animalData?.owner_id) {
        throw new Error("Le responsable de cet animal est introuvable.");
      }

      const typedAnimal = animalData as AnimalRow;

      const { data: ownerData, error: ownerError } = await supabase
        .from("profiles")
        .select("id, role, organization_name, first_name, last_name")
        .eq("id", typedAnimal.owner_id)
        .maybeSingle();

      if (ownerError) throw ownerError;
      if (!ownerData) {
        throw new Error("Le profil de la structure est introuvable.");
      }

      const { data: conditionRows, error: conditionError } = await supabase
        .from("adoption_conditions")
        .select("id, label, sort_order")
        .eq("owner_id", typedAnimal.owner_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (conditionError) throw conditionError;

      const typedConditions = (conditionRows || []) as ConditionRow[];

      if (typedConditions.length === 0) {
        throw new Error(
          "Cette structure n'a pas encore publié ses conditions d'adoption. La demande ne peut pas être envoyée pour le moment."
        );
      }

      const calculatedMatch = compatibilityService.calculate(
        questionnaire,
        typedAnimal
      ) as MatchResult;

      setUserId(access.userId);
      setAnimal(typedAnimal);
      setOwner(ownerData as OwnerProfile);
      setConditions(typedConditions);
      setMatch(calculatedMatch);
    } catch (error: unknown) {
      console.error("Erreur préparation adoption :", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [animalId, findExistingConversation, loadQuestionnaire, router]);

  useEffect(() => {
    queueMicrotask(() => void loadPage());
  }, [loadPage]);

  useEffect(() => {
    if (loading || errorMessage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineWidth = 2.6;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#064b42";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, rect.width, rect.height);
  }, [errorMessage, loading]);

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function beginSignature(event: ReactPointerEvent<HTMLCanvasElement>) {
    const point = pointFromEvent(event);
    if (!point) return;

    drawingRef.current = true;
    lastPointRef.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drawSignature(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;

    const current = pointFromEvent(event);
    const previous = lastPointRef.current;
    const canvas = canvasRef.current;

    if (!current || !previous || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(current.x, current.y);
    context.stroke();

    lastPointRef.current = current;
    setHasSignature(true);
  }

  function endSignature(event: ReactPointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    lastPointRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Le pointeur peut déjà avoir été libéré.
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "#064b42";
    context.lineWidth = 2.6;
    context.lineCap = "round";
    context.lineJoin = "round";

    setHasSignature(false);
  }

  function toggleCondition(conditionId: string) {
    setAcceptedIds((previous) =>
      previous.includes(conditionId)
        ? previous.filter((id) => id !== conditionId)
        : [...previous, conditionId]
    );
  }

  async function createOrUpdateRequest(signatureDataUrl: string) {
    if (!animal || !match) {
      throw new Error("Informations de demande incomplètes.");
    }

    const now = new Date().toISOString();
    const snapshot = conditions.map((condition, index) => ({
      id: condition.id,
      label: condition.label,
      sort_order: index,
      accepted: true,
    }));

    const payload = {
      animal_id: animal.id,
      requester_id: userId,
      owner_id: animal.owner_id,
      status: "pending",
      message: `Je souhaite adopter ${animal.animal_name || "cet animal"}.`,
      match_score: match.score,
      match_level: match.level,
      match_details: match.details,
      match_calculated_at: now,
      conditions_snapshot: snapshot,
      conditions_owner_id: animal.owner_id,
      conditions_accepted_at: now,
      signature_signer_name: signerName.trim(),
      signature_data_url: signatureDataUrl,
      signature_signed_at: now,
    };

    if (existingRequest) {
      const { data, error } = await supabase
        .from("adoption_requests")
        .update(payload)
        .eq("id", existingRequest.id)
        .eq("requester_id", userId)
        .select("id, animal_id, requester_id, owner_id, status")
        .single();

      if (error) throw error;
      return data as AdoptionRequest;
    }

    const { data, error } = await supabase
      .from("adoption_requests")
      .insert(payload)
      .select("id, animal_id, requester_id, owner_id, status")
      .single();

    if (error) throw error;
    return data as AdoptionRequest;
  }

  async function getOrCreateConversation(request: AdoptionRequest) {
    const existingId = await findExistingConversation(request.id);
    if (existingId) return { id: existingId, isNew: false };

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        animal_id: animalId,
        requester_id: userId,
        owner_id: request.owner_id,
        adoption_request_id: request.id,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return { id: data.id as string, isNew: true };
  }

  async function createInitialMessage(conversationId: string) {
    if (!animal) return;

    const { data: existing, error: searchError } = await supabase
      .from("conversation_messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .limit(1)
      .maybeSingle();

    if (searchError) throw searchError;
    if (existing) return;

    const { error } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        message:
          `Bonjour, je souhaite adopter ${animal.animal_name || "cet animal"}. ` +
          `J’ai lu, accepté et signé l’ensemble des conditions d’adoption de ${ownerDisplayName(owner)}.`,
      });

    if (error) throw error;
  }

  async function notifyOwner(requestId: string, conversationId: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) return;

    try {
      const response = await fetch("/api/adoption/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adoptionRequestId: requestId,
          conversationId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        console.error("Notification adoption non envoyée :", payload);
      }
    } catch (error) {
      console.error("Erreur notification adoption :", error);
    }
  }

  async function submitSignedRequest() {
    if (submitting) return;

    if (acceptedIds.length !== conditions.length) {
      alert("Vous devez accepter chacune des conditions d’adoption.");
      return;
    }

    if (!signerName.trim()) {
      alert("Indiquez votre nom complet avant de signer.");
      return;
    }

    if (!hasSignature || !canvasRef.current) {
      alert("Votre signature est obligatoire.");
      return;
    }

    const confirmed = window.confirm(
      "Confirmez-vous avoir lu et accepté toutes les conditions d’adoption et vouloir signer cette demande ?"
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);

      const signatureDataUrl = canvasRef.current.toDataURL("image/png");
      const request = await createOrUpdateRequest(signatureDataUrl);
      const conversation = await getOrCreateConversation(request);

      await createInitialMessage(conversation.id);
      await notifyOwner(request.id, conversation.id);

      router.replace(`/messages/${conversation.id}`);
      router.refresh();
    } catch (error: unknown) {
      console.error("Erreur validation demande signée :", error);
      alert(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4eee3] px-6 text-[#064b42]">
        <div className="w-full max-w-sm rounded-[30px] bg-white p-8 text-center shadow-xl">
          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="mx-auto h-24 w-24 object-contain"
          />
          <div className="mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />
          <p className="mt-5 font-black">Préparation de votre demande...</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4eee3] px-5 text-[#064b42]">
        <div className="w-full max-w-xl rounded-[30px] bg-white p-7 text-center shadow-xl">
          <ShieldCheck className="mx-auto text-[#df8995]" size={42} />
          <h1 className="mt-4 text-2xl font-black">Demande d&apos;adoption</h1>
          <p className="mt-3 leading-7 text-[#6f5a47]">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push(`/animal/${animalId}`)}
            className="mt-6 rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            Retour à l&apos;animal
          </button>
        </div>
      </main>
    );
  }

  const allAccepted =
    conditions.length > 0 && acceptedIds.length === conditions.length;

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-7 pb-28 text-[#064b42] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-[32px] bg-white p-6 shadow-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#c76d7b]">
              <FileSignature size={28} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
                Adoption responsable
              </p>
              <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                Conditions avant contact
              </h1>
              <p className="mt-3 leading-7 text-[#6f5a47]">
                Pour envoyer votre demande pour <strong>{animal?.animal_name || "cet animal"}</strong>,
                vous devez accepter toutes les conditions de <strong>{ownerDisplayName(owner)}</strong> puis signer.
              </p>
            </div>
          </div>

          {match && (
            <div className="mt-6 rounded-[22px] bg-[#edf7f4] p-5">
              <p className="text-sm font-black uppercase tracking-wide text-[#4d746b]">
                Compatibilité indicative
              </p>
              <p className="mt-1 text-3xl font-black text-[#064b42]">
                {Math.round(match.score)} %
              </p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-black">Conditions d&apos;adoption</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
              Chaque case est obligatoire. Votre demande ne sera créée qu&apos;après validation et signature.
            </p>

            <div className="mt-5 space-y-3">
              {conditions.map((condition, index) => {
                const checked = acceptedIds.includes(condition.id);

                return (
                  <label
                    key={condition.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-[22px] border-2 p-4 transition ${
                      checked
                        ? "border-[#7eb5a7] bg-[#edf7f4]"
                        : "border-[#eadfce] bg-[#fffaf5]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCondition(condition.id)}
                      className="mt-1 h-5 w-5 shrink-0 accent-[#064b42]"
                    />

                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-wide text-[#a98b73]">
                        Condition {index + 1}
                      </p>
                      <p className="mt-1 leading-7 text-[#40372f]">
                        {condition.label}
                      </p>
                    </div>

                    {checked && (
                      <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={21} />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className={`mt-8 rounded-[26px] border p-5 sm:p-6 ${
            allAccepted
              ? "border-[#d7e8e1] bg-white"
              : "border-[#eadfce] bg-[#f8f4ec] opacity-70"
          }`}>
            <div className="flex items-start gap-3">
              <LockKeyhole size={23} className="mt-1 shrink-0 text-[#df8995]" />
              <div>
                <h2 className="text-2xl font-black">Signature en ligne</h2>
                <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
                  La signature est activée lorsque toutes les conditions ont été cochées.
                </p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block font-black">Nom complet du signataire</span>
              <input
                type="text"
                value={signerName}
                disabled={!allAccepted}
                onChange={(event) => setSignerName(event.target.value)}
                placeholder="Prénom et nom"
                className="w-full rounded-[18px] border border-[#e5d8cd] bg-white px-4 py-3.5 outline-none disabled:bg-gray-100"
              />
            </label>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-black">Votre signature</span>
                <button
                  type="button"
                  disabled={!allAccepted}
                  onClick={clearSignature}
                  className="inline-flex items-center gap-2 rounded-full bg-[#f8f4ec] px-4 py-2 text-sm font-black disabled:opacity-40"
                >
                  <Eraser size={16} />
                  Effacer
                </button>
              </div>

              <canvas
                ref={canvasRef}
                onPointerDown={allAccepted ? beginSignature : undefined}
                onPointerMove={allAccepted ? drawSignature : undefined}
                onPointerUp={allAccepted ? endSignature : undefined}
                onPointerCancel={allAccepted ? endSignature : undefined}
                className={`h-[220px] w-full touch-none rounded-[20px] border-2 bg-white ${
                  allAccepted
                    ? "cursor-crosshair border-[#d9cfc6]"
                    : "cursor-not-allowed border-[#e8e2dc]"
                }`}
              />

              <p className="mt-2 text-xs leading-5 text-[#82766b]">
                En signant, vous confirmez que les conditions affichées ci-dessus ont été lues et acceptées. Une copie exacte de ces conditions est conservée avec la demande.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!allAccepted || !signerName.trim() || !hasSignature || submitting}
            onClick={() => void submitSignedRequest()}
            className="mt-7 w-full rounded-[20px] bg-[#064b42] px-6 py-5 text-lg font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Création de la demande..."
              : "Signer et envoyer ma demande"}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => router.push(`/animal/${animalId}`)}
            className="mt-3 w-full rounded-[20px] bg-transparent px-6 py-4 font-black text-[#6f5a47]"
          >
            Annuler
          </button>
        </div>
      </section>
    </main>
  );
}
