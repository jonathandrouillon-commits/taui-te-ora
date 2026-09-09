"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import AnimalBreedSelect from "../../../components/AnimalBreedSelect";
import { ANIMAL_WEIGHTS } from "../../../lib/animalFormOptions";

type SterilizationStatus = "oui" | "en_cours" | "non";
type IdentificationType = "puce" | "tatouage";

type Companion = {
  id: string; owner_id: string; name: string; species: string; breed: string | null;
  sex: string | null; birth_date: string | null; color: string | null; weight: string | null;
  character: string | null; story: string | null; identification_type: IdentificationType | null;
  identification_number: string | null; sterilization_status: SterilizationStatus | null;
  sterilization_date: string | null; sterilization_note: string | null; is_deceased: boolean;
};

export default function ModifierCompagnonPage() {
  const router = useRouter();
  const params = useParams();
  const companionId = String(params?.id || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("chien");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("male");
  const [birthDate, setBirthDate] = useState("");
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [character, setCharacter] = useState("");
  const [story, setStory] = useState("");
  const [identificationType, setIdentificationType] = useState<IdentificationType>("puce");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [sterilizationStatus, setSterilizationStatus] = useState<SterilizationStatus>("oui");
  const [sterilizationDate, setSterilizationDate] = useState("");
  const [sterilizationNote, setSterilizationNote] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true); setErrorMessage("");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) { router.replace("/login"); return; }
        const { data, error } = await supabase.from("companions").select(`id, owner_id, name, species, breed, sex, birth_date, color, weight, character, story, identification_type, identification_number, sterilization_status, sterilization_date, sterilization_note, is_deceased`).eq("id", companionId).maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (!data) { setErrorMessage("Compagnon introuvable."); return; }
        const item = data as Companion;
        if (item.owner_id !== user.id) { setErrorMessage("Seul le propriétaire peut modifier ce compagnon."); return; }
        if (item.is_deceased) { setErrorMessage("La fiche d'un compagnon décédé ne peut plus être modifiée."); return; }
        setCompanion(item); setName(item.name || ""); setSpecies(item.species || "chien"); setBreed(item.breed || "");
        setSex(item.sex || "unknown"); setBirthDate(item.birth_date || ""); setColor(item.color || ""); setWeight(item.weight || "");
        setCharacter(item.character || ""); setStory(item.story || ""); setIdentificationType(item.identification_type || "puce");
        setIdentificationNumber(item.identification_number || ""); setSterilizationStatus(item.sterilization_status || "oui");
        setSterilizationDate(item.sterilization_date || ""); setSterilizationNote(item.sterilization_note || "");
      } catch (e) { console.error("Erreur modification compagnon :", e); if (active) setErrorMessage(e instanceof Error ? e.message : "Impossible de charger ce compagnon."); }
      finally { if (active) setLoading(false); }
    }
    if (companionId) void load();
    return () => { active = false; };
  }, [companionId, router]);

  async function save() {
    if (!companion || saving) return;
    if (!name.trim()) return alert("Merci d'indiquer le nom de votre compagnon.");
    if (!identificationNumber.trim()) return alert("Le numéro de puce ou de tatouage est obligatoire.");
    if (sterilizationStatus === "non") return alert("Votre compagnon doit être stérilisé/castré ou avoir une stérilisation en cours.");
    if (sterilizationStatus === "en_cours" && !sterilizationDate) return alert("Merci d'indiquer la date prévue de stérilisation ou castration.");
    try {
      setSaving(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== companion.owner_id) throw new Error("Vous devez être connecté avec le compte propriétaire.");
      const { error } = await supabase.from("companions").update({
        name: name.trim(), species, breed: breed.trim() || null, sex, birth_date: birthDate || null,
        color: color.trim() || null, weight: weight.trim() || null, character: character.trim() || null,
        story: story.trim() || null, identification_type: identificationType,
        identification_number: identificationNumber.trim(), sterilization_status: sterilizationStatus,
        sterilization_date: sterilizationStatus === "en_cours" ? sterilizationDate || null : null,
        sterilization_note: sterilizationStatus === "en_cours" ? sterilizationNote.trim() || null : null,
        updated_at: new Date().toISOString(),
      }).eq("id", companion.id).eq("owner_id", user.id);
      if (error) throw error;
      alert(`La fiche de ${name.trim()} a été mise à jour 🐾`);
      router.push(`/mes-compagnons/${companion.id}`); router.refresh();
    } catch (e) { console.error("Erreur sauvegarde compagnon :", e); alert(e instanceof Error ? e.message : "Impossible d'enregistrer les modifications."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5ead8]"><p className="font-black text-[#064b42]">Chargement...</p></main>;
  if (errorMessage || !companion) return <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-8"><section className="mx-auto max-w-xl rounded-[30px] bg-white p-8 text-center shadow-xl"><div className="text-5xl">🐾</div><h1 className="mt-4 text-2xl font-black text-[#064b42]">Modification indisponible</h1><p className="mt-3 text-[#756d67]">{errorMessage}</p><button onClick={() => router.push(`/mes-compagnons/${companionId}`)} className="mt-6 rounded-full bg-[#064b42] px-6 py-3 font-black text-white">Retour au compagnon</button></section></main>;

  const field = "w-full rounded-2xl border border-[#e4d8cf] bg-white px-4 py-3 outline-none focus:border-[#064b42]";
  return <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-6 pb-28 text-[#3b2417]"><section className="mx-auto max-w-3xl">
    <button onClick={() => router.push(`/mes-compagnons/${companion.id}`)} className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow"><ArrowLeft size={17}/>Retour</button>
    <div className="rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] p-5 shadow-xl sm:p-8"><div className="text-center"><h1 className="text-3xl font-black text-[#064b42]">Modifier {companion.name}</h1><p className="mt-2 text-sm text-[#6f625a]">Mettez à jour les informations de votre compagnon.</p></div>
    <div className="mt-8 space-y-6">
      <div className="rounded-[26px] bg-white p-5 shadow"><h2 className="text-xl font-black text-[#064b42]">Informations principales</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label><span className="mb-2 block text-sm font-black text-[#064b42]">Nom *</span><input value={name} onChange={e=>setName(e.target.value)} className={field}/></label>
        <label><span className="mb-2 block text-sm font-black text-[#064b42]">Espèce *</span><select value={species} onChange={e=>{setSpecies(e.target.value);setBreed("");}} className={field}><option value="chien">Chien</option><option value="chat">Chat</option><option value="cheval">Cheval</option><option value="oiseau">Oiseau</option><option value="lapin">Lapin</option><option value="autre">Autre</option></select></label>
        <label><span className="mb-2 block text-sm font-black text-[#064b42]">Race</span><AnimalBreedSelect species={species} value={breed} onChange={setBreed} className={field}/></label>
        <label><span className="mb-2 block text-sm font-black text-[#064b42]">Sexe *</span><select value={sex} onChange={e=>setSex(e.target.value)} className={field}>{sex && !["male","female","unknown"].includes(sex)&&<option value={sex}>{sex} (ancienne valeur)</option>}<option value="male">Mâle</option><option value="female">Femelle</option><option value="unknown">Inconnu</option></select></label>
        <label><span className="mb-2 block text-sm font-black text-[#064b42]">Date de naissance</span><input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} className={field}/></label>
        <label><span className="mb-2 block text-sm font-black text-[#064b42]">Couleur</span><input value={color} onChange={e=>setColor(e.target.value)} placeholder="Noir, blanc, fauve..." className={field}/></label>
        <label><span className="mb-2 block text-sm font-black text-[#064b42]">Poids</span><select value={weight} onChange={e=>setWeight(e.target.value)} className={field}><option value="">Poids inconnu</option>{weight&&!ANIMAL_WEIGHTS.includes(weight as (typeof ANIMAL_WEIGHTS)[number])&&<option value={weight}>{weight} (ancienne valeur)</option>}{ANIMAL_WEIGHTS.filter(x=>x!=="Inconnu").map(x=><option key={x} value={x}>{x} kg</option>)}</select></label>
      </div></div>
      <div className="rounded-[26px] bg-white p-5 shadow"><h2 className="text-xl font-black text-[#064b42]">Identification</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-black text-[#064b42]">Type *</span><select value={identificationType} onChange={e=>setIdentificationType(e.target.value as IdentificationType)} className={field}><option value="puce">Puce électronique</option><option value="tatouage">Tatouage</option></select></label><label><span className="mb-2 block text-sm font-black text-[#064b42]">Numéro *</span><input value={identificationNumber} onChange={e=>setIdentificationNumber(e.target.value)} className={field}/></label></div></div>
      <div className="rounded-[26px] bg-white p-5 shadow"><div className="flex gap-3"><ShieldCheck className="text-[#064b42]"/><h2 className="text-xl font-black text-[#064b42]">Stérilisation / Castration</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-black text-[#064b42]">Statut *</span><select value={sterilizationStatus} onChange={e=>setSterilizationStatus(e.target.value as SterilizationStatus)} className={field}><option value="oui">Oui</option><option value="en_cours">En cours</option><option value="non">Non</option></select></label>{sterilizationStatus==="en_cours"&&<label><span className="mb-2 block text-sm font-black text-[#064b42]">Date prévue *</span><input type="date" value={sterilizationDate} onChange={e=>setSterilizationDate(e.target.value)} className={field}/></label>}</div>{sterilizationStatus==="en_cours"&&<label className="mt-4 block"><span className="mb-2 block text-sm font-black text-[#064b42]">Commentaire</span><input value={sterilizationNote} onChange={e=>setSterilizationNote(e.target.value)} className={field}/></label>}</div>
      <div className="rounded-[26px] bg-white p-5 shadow"><h2 className="text-xl font-black text-[#064b42]">Caractère & histoire</h2><label className="mt-5 block"><span className="mb-2 block text-sm font-black text-[#064b42]">Son caractère</span><textarea value={character} onChange={e=>setCharacter(e.target.value)} rows={4} className={`${field} resize-none`}/></label><label className="mt-4 block"><span className="mb-2 block text-sm font-black text-[#064b42]">Son histoire</span><textarea value={story} onChange={e=>setStory(e.target.value)} rows={6} className={`${field} resize-none`}/></label></div>
      <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#064b42] py-4 text-lg font-black text-white shadow-xl disabled:opacity-40"><Save size={20}/>{saving?"Enregistrement...":"Enregistrer les modifications"}</button>
    </div></div>
  </section></main>;
}
