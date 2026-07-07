"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { animalService } from "../../../services/animal.service";
import { notificationService } from "../../../services/notification.service";

export default function AdoptionQuestionnairePage() {
  const router = useRouter();
  const params = useParams();
  const animalId = String(params.animalId);

  const [animal, setAnimal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    motivation: "",
    delaiAccueil: "",
    dejaRencontre: "",
    visiteDomicile: "",
    commentaire: "",
  });

  useEffect(() => {
    loadAnimal();
  }, []);

  async function loadAnimal() {
    try {
      setLoading(true);
      const data = await animalService.getById(animalId);
      setAnimal(data);
    } catch (error) {
      console.error(error);
      alert("Impossible de charger l'animal.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function envoyerDemande() {
    try {
      setSending(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Vous devez être connecté pour envoyer une demande.");
        router.push("/login");
        return;
      }

      if (!animal) {
        alert("Animal introuvable.");
        return;
      }

      const ownerId = animal.owner_id || animal.created_by || null;

      if (!ownerId) {
        alert("Impossible d’identifier l’association responsable de cet animal.");
        return;
      }

      const animalName = animal.animal_name || animal.nom || "cet animal";

      const fullMessage = `
Motivation : ${form.motivation}

Délai d'accueil : ${form.delaiAccueil}

Déjà rencontré : ${form.dejaRencontre}

Visite à domicile : ${form.visiteDomicile}

Commentaire : ${form.commentaire}
      `.trim();

      const { data: demande, error } = await supabase
        .from("adoption_requests")
        .insert({
          animal_id: animalId,
          requester_id: user.id,
          owner_id: ownerId,
          status: "pending",
          message: fullMessage,
        })
        .select()
        .single();

      if (error) throw error;

      await notificationService.create({
        user_id: ownerId,
        type: "demande_adoption",
        titre: "Nouvelle demande d'adoption",
        message: `Une personne souhaite adopter ${animalName}.`,
        animal_id: animalId,
        adoption_request_id: demande.id,
        lien: `/association/demandes/${demande.id}`,
      });

      const adminUserId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

      if (adminUserId && adminUserId !== ownerId) {
        await notificationService.create({
          user_id: adminUserId,
          type: "demande_adoption",
          titre: "Nouvelle demande d'adoption",
          message: `Nouvelle demande pour ${animalName}.`,
          animal_id: animalId,
          adoption_request_id: demande.id,
          lien: `/admin/demandes/${demande.id}`,
        });
      }

      alert("Votre demande d'adoption a bien été envoyée.");
      router.push(`/animal/${animalId}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur lors de l'envoi de la demande.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3] text-[#064b42]">
        <p className="text-xl font-black">Chargement du questionnaire...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4eee3] px-4 py-10 text-[#064b42]">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow">
        <div className="mb-6 text-center">
          <div className="mb-4 text-6xl">🐾</div>

          <h1 className="text-3xl font-black">Questionnaire d’adoption</h1>

          <p className="mt-3 text-gray-600">
            Ces questions concernent uniquement l’animal que vous souhaitez adopter.
          </p>

          <div className="mt-4 rounded-2xl bg-[#f4eee3] p-4 text-sm font-bold">
            Animal concerné : {animal?.animal_name || animal?.nom || animalId}
          </div>
        </div>

        <div className="space-y-5">
          <Textarea
            label="Pourquoi souhaitez-vous adopter cet animal ?"
            value={form.motivation}
            onChange={(v) => updateField("motivation", v)}
          />

          <Input
            label="Quand pourriez-vous l’accueillir ?"
            value={form.delaiAccueil}
            onChange={(v) => updateField("delaiAccueil", v)}
          />

          <Select
            label="Avez-vous déjà rencontré cet animal ?"
            value={form.dejaRencontre}
            onChange={(v) => updateField("dejaRencontre", v)}
            options={["Oui", "Non", "Pas encore"]}
          />

          <Select
            label="Acceptez-vous une visite à domicile ?"
            value={form.visiteDomicile}
            onChange={(v) => updateField("visiteDomicile", v)}
            options={["Oui", "Non", "À discuter"]}
          />

          <Textarea
            label="Commentaire complémentaire"
            value={form.commentaire}
            onChange={(v) => updateField("commentaire", v)}
          />
        </div>

        <button
          type="button"
          onClick={envoyerDemande}
          disabled={sending}
          className="mt-8 w-full rounded-2xl bg-[#064b42] py-4 text-lg font-black text-white shadow disabled:opacity-60"
        >
          {sending ? "Envoi en cours..." : "Envoyer ma demande"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-3 w-full rounded-2xl bg-white py-4 text-lg font-bold text-[#064b42] shadow"
        >
          Retour
        </button>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
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
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-bold">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block font-bold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 p-4 outline-none focus:border-[#064b42]"
      >
        <option value="">Sélectionner</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}