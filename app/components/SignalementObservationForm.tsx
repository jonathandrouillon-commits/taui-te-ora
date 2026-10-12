"use client";

import { useState } from "react";

const COMMUNES: Record<string, string[]> = {
  Tahiti: ["Arue", "Faa'a", "Hitia'a O Te Ra", "Mahina", "Paea", "Papara", "Papeete", "Pirae", "Punaauia", "Taiarapu-Est", "Taiarapu-Ouest", "Teva I Uta"],
  Moorea: ["Moorea-Maiao"],
  "Bora Bora": ["Bora Bora"],
  Raiatea: ["Taputapuatea", "Tumaraa", "Uturoa"],
  "Taha'a": ["Taha'a"],
  Huahine: ["Huahine"],
  Maupiti: ["Maupiti"],
};
const QUARTIERS: Record<string, string[]> = {
  Papeete: ["Centre-ville", "Mamao", "Paofai", "Taunoa", "Tipaerui", "Titioro", "Vaininiore"],
  Punaauia: ["Outumaoro", "Punavai", "Taapuna"],
  "Faa'a": ["Heiri", "Pamatai", "Puurai"],
};
const selectClass = "w-full rounded-xl border border-[#c7ded7] bg-white p-3 text-[#064b42]";
function SelectField({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (v: string) => void }) {
  return <label className="block space-y-1 text-sm font-semibold text-[#064b42]">{label}<select className={selectClass} value={value} onChange={e => onChange(e.target.value)}><option value="">Choisir</option>{values.map(v => <option key={v} value={v}>{v}</option>)}</select></label>;
}

export default function SignalementObservationForm({ signalementId, animalType = "" }: { signalementId: string; animalType?: string }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [island, setIsland] = useState("Tahiti");
  const [commune, setCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [otherQuartier, setOtherQuartier] = useState("");
  const [locationDetails, setLocationDetails] = useState("");
  const [color, setColor] = useState("");
  const [behavior, setBehavior] = useState("");
  const [certainty, setCertainty] = useState("");
  const [comments, setComments] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setFeedback(""); setSending(true);
    try {
      const observed_at = new Date(`${date}T${time}:00`).toISOString();
      const response = await fetch("/api/signalement/observations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalement_id: signalementId, observed_at, island, commune,
          quartier: quartier === "Autre" ? otherQuartier : quartier,
          location_details: locationDetails, animal_type: animalType, color, behavior, certainty, comments })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Erreur d'envoi");
      setSuccess(true); setFeedback("Merci ! Votre observation a été enregistrée et sera vérifiée.");
    } catch (err) { setFeedback(err instanceof Error ? err.message : "Erreur d'envoi"); }
    finally { setSending(false); }
  }
  return <section className="rounded-2xl bg-[#eaf5f1] p-5 text-[#064b42]">
    <h2 className="text-lg font-black">Vous avez des informations ?</h2>
    <p className="my-3 text-sm">Décrivez ce que vous avez observé. Les informations transmises ne seront pas publiées sur la fiche.</p>
    {success ? <p role="status" className="font-semibold">{feedback}</p> : <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Date de l'observation<input required type="date" max={new Date().toISOString().slice(0,10)} value={date} onChange={e => setDate(e.target.value)} className={selectClass}/></label>
        <label className="block text-sm font-semibold">Heure de l'observation<input required type="time" value={time} onChange={e => setTime(e.target.value)} className={selectClass}/></label>
      </div>
      <SelectField label="Île" value={island} values={[...Object.keys(COMMUNES), "Autre île"]} onChange={v => { setIsland(v); setCommune(""); setQuartier(""); }}/>
      <SelectField label="Commune" value={commune} values={[...(COMMUNES[island] || []), "Autre commune"]} onChange={v => { setCommune(v); setQuartier(""); }}/>
      <SelectField label="Quartier" value={quartier} values={[...(QUARTIERS[commune] || []), "Autre", "Je ne sais pas"]} onChange={setQuartier}/>
      {quartier === "Autre" && <label className="block text-sm font-semibold">Précisez le quartier<input required value={otherQuartier} onChange={e => setOtherQuartier(e.target.value)} className={selectClass}/></label>}
      <label className="block text-sm font-semibold">Point de repère (facultatif)<input value={locationDetails} onChange={e => setLocationDetails(e.target.value)} className={selectClass} placeholder="Rue, commerce, endroit connu"/></label>
      <SelectField label="Couleur observée" value={color} values={["Gris", "Noir", "Blanc", "Marron", "Roux", "Beige", "Multicolore", "Je ne sais pas"]} onChange={setColor}/>
      <SelectField label="Comportement" value={behavior} values={["Calme", "Peureux / fuyant", "Amical / sociable", "Blessé", "En déplacement", "Immobile", "Je ne sais pas"]} onChange={setBehavior}/>
      <SelectField label="Votre niveau de certitude" value={certainty} values={["certain", "possible", "incertain"]} onChange={setCertainty}/>
      <label className="block text-sm font-semibold">Informations complémentaires<textarea rows={4} maxLength={3000} value={comments} onChange={e => setComments(e.target.value)} className={selectClass} placeholder="Décrivez ce que vous avez vu..."/></label>
      <p className="text-xs text-[#42695f]">Les photos et l'analyse IA seront activées lors de la prochaine étape. Ne transmettez pas de données sensibles dans le commentaire.</p>
      <button disabled={sending || !date || !time || !island || !commune || !certainty} type="submit" className="rounded-full bg-[#064b42] px-5 py-3 font-bold text-white disabled:opacity-50">{sending ? "Envoi..." : "Envoyer mon observation"}</button>
      {feedback && <p role="status" className="text-sm font-semibold">{feedback}</p>}
    </form>}
  </section>;
}
