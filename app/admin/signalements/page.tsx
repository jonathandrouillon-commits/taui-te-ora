"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, ArrowLeft, CheckCircle2, Clock3, ExternalLink, Image as ImageIcon, Mail, MapPin, MessageSquareText, Pencil, Phone, Save, Search, Trash2, User, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Status = "nouveau" | "en_cours" | "animal_retrouve" | "cloture";
type Signalement = {
  id: string; created_at: string; user_id: string | null;
  type_signalement: string | null; animal_type: string | null; animal_name: string | null;
  island: string | null; city: string | null; address: string | null;
  situation: string | null; description: string | null;
  reporter_name: string | null; reporter_phone: string | null; reporter_email: string | null;
  status: string | null; archived_at: string | null;
  photo_url?: string | null;
};
type Media = { signalement_id: string; file_url: string | null; file_type: string | null };
type EditFields = Pick<Signalement, "type_signalement" | "animal_type" | "animal_name" | "island" | "city" | "address" | "situation" | "description" | "reporter_name" | "reporter_phone" | "reporter_email">;
const EDIT_KEYS: (keyof EditFields)[] = ["type_signalement", "animal_type", "animal_name", "island", "city", "address", "situation", "description", "reporter_name", "reporter_phone", "reporter_email"];
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "nouveau", label: "Signalement en attente" },
  { value: "en_cours", label: "Sauvetage en cours" },
  { value: "animal_retrouve", label: "Animal retrouvé" },
  { value: "cloture", label: "Signalement clôturé" },
];
function normalizeStatus(status: string | null | undefined): Status {
  const s = String(status || "").trim().toLowerCase();
  if (["en_cours", "sauvetage en cours", "en intervention", "en_intervention", "pris_en_charge"].includes(s)) return "en_cours";
  if (["animal_retrouve", "animal retrouvé", "animal retrouve", "retrouve"].includes(s)) return "animal_retrouve";
  if (["cloture", "signalement cloturé", "signalement clôturé", "signalement cloture", "signalement clôture"].includes(s)) return "cloture";
  return "nouveau";
}
function labelStatus(s: string | null | undefined) { return STATUS_OPTIONS.find(x => x.value === normalizeStatus(s))?.label || "Signalement en attente"; }
function statusStyle(s: string | null | undefined) {
  switch (normalizeStatus(s)) {
    case "en_cours": return "border-orange-200 bg-orange-50 text-orange-800";
    case "animal_retrouve": return "border-green-200 bg-green-50 text-green-800";
    case "cloture": return "border-[#064b42] bg-[#064b42] text-white";
    default: return "border-amber-200 bg-amber-50 text-amber-800";
  }
}
function errorText(error: unknown) { return error instanceof Error ? error.message : "Une erreur est survenue."; }
function toEdit(item: Signalement): EditFields {
  return Object.fromEntries(EDIT_KEYS.map(key => [key, item[key]])) as EditFields;
}
const fieldClass = "w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 text-[#064b42] outline-none focus:border-[#064b42]";

export default function AdminSignalementsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Signalement | null>(null);
  const [draft, setDraft] = useState<EditFields | null>(null);
  const [photoLarge, setPhotoLarge] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { router.replace("/login?redirect=/admin/signalements"); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profileError) throw profileError;
      if (String(profile?.role || "").trim().toLowerCase() !== "admin") { router.replace("/"); return; }
      const { data, error } = await supabase.from("signalements")
        .select("id,created_at,user_id,type_signalement,animal_type,animal_name,island,city,address,situation,description,reporter_name,reporter_phone,reporter_email,status,archived_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as Signalement[];
      const ids = rows.map(x => x.id);
      let mediaRows: Media[] = [];
      if (ids.length) {
        const { data: mediaData, error: mediaError } = await supabase.from("signalement_medias")
          .select("signalement_id,file_url,file_type").in("signalement_id", ids);
        if (mediaError) console.error("Chargement des photos :", mediaError);
        else mediaRows = (mediaData || []) as Media[];
      }
      const photos = new Map<string, string>();
      for (const media of mediaRows) {
        if (media.file_url && /^https?:\/\//i.test(media.file_url) && !String(media.file_type || "").startsWith("video/") && !photos.has(media.signalement_id)) photos.set(media.signalement_id, media.file_url);
      }
      setItems(rows.map(row => ({ ...row, photo_url: photos.get(row.id) || null })));
      setStatuses(Object.fromEntries(rows.map(row => [row.id, normalizeStatus(row.status)])));
    } catch (error) { console.error("Chargement signalements :", error); window.alert(errorText(error)); }
    finally { setLoading(false); }
  }, [router]);
  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const result = { total: 0, nouveau: 0, en_cours: 0, animal_retrouve: 0, cloture: 0, archive: 0 };
    for (const item of items) {
      if (item.archived_at) { result.archive++; continue; }
      result.total++;
      result[normalizeStatus(item.status)]++;
    }
    return result;
  }, [items]);
  const visible = useMemo(() => items.filter(item => statusFilter === "archive" ? !!item.archived_at : !item.archived_at && (!statusFilter || normalizeStatus(item.status) === statusFilter)), [items, statusFilter]);

  async function notify(item: Signalement, status: Status, custom: string) {
    if (!item.user_id) return;
    const title = labelStatus(status);
    const { error } = await supabase.from("notifications").insert({
      recipient_id: item.user_id, signalement_id: item.id, type: "signalement_status",
      title: `Mise à jour de votre signalement : ${title}`,
      message: custom.trim() || `Le statut de votre signalement est maintenant : ${title}.`, is_read: false,
    });
    if (error) throw new Error(`Statut enregistré, mais notification non envoyée : ${error.message}`);
  }
  async function saveStatus(item: Signalement) {
    const next = statuses[item.id] || normalizeStatus(item.status);
    const custom = messages[item.id] || "";
    if (next === normalizeStatus(item.status) && !custom.trim()) { window.alert("Aucun changement de statut ni message à envoyer."); return; }
    try {
      setBusy(item.id);
      const { error } = await supabase.from("signalements").update({ status: next }).eq("id", item.id);
      if (error) throw error;
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, status: next } : x));
      await notify(item, next, custom);
      setMessages(prev => ({ ...prev, [item.id]: "" }));
      window.alert(item.user_id ? "Statut enregistré et notification envoyée." : "Statut enregistré. Aucun compte lié pour la notification.");
    } catch (error) { console.error(error); window.alert(errorText(error)); }
    finally { setBusy(null); }
  }
  async function setArchive(item: Signalement, archive: boolean) {
    if (archive && !window.confirm("Archiver ce signalement ? Il restera accessible dans « Archivés ».")) return;
    try {
      setBusy(item.id);
      const value = archive ? new Date().toISOString() : null;
      const { error } = await supabase.from("signalements").update({ archived_at: value }).eq("id", item.id);
      if (error) throw error;
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, archived_at: value } : x));
    } catch (error) { window.alert(errorText(error)); }
    finally { setBusy(null); }
  }
  async function deleteItem(item: Signalement) {
    if (!window.confirm(`Supprimer DÉFINITIVEMENT le signalement ${item.animal_name || item.id} ? Cette action est irréversible.`)) return;
    try {
      setBusy(item.id);
      const { error } = await supabase.from("signalements").delete().eq("id", item.id);
      if (error) throw error;
      setItems(prev => prev.filter(x => x.id !== item.id));
    } catch (error) { window.alert(errorText(error)); }
    finally { setBusy(null); }
  }
  function startEdit(item: Signalement) { setEditing(item); setDraft(toEdit(item)); }
  async function saveEdit() {
    if (!editing || !draft) return;
    const updates = Object.fromEntries(EDIT_KEYS.map(key => [key, draft[key]?.trim() || null])) as EditFields;
    try {
      setBusy(editing.id);
      const { data, error } = await supabase.from("signalements").update(updates).eq("id", editing.id).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Modification non confirmée. Vérifiez les droits Supabase.");
      setItems(prev => prev.map(x => x.id === editing.id ? { ...x, ...updates } : x));
      setEditing(null); setDraft(null);
      window.alert("Signalement modifié.");
    } catch (error) { console.error("Modification signalement :", error); window.alert(errorText(error)); }
    finally { setBusy(null); }
  }
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-16 pt-24 text-[#064b42]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-3xl font-black sm:text-4xl">🚨 Gestion des signalements</h1><p className="mt-2 text-gray-500">Validez le statut, sauvegardez-le et informez le déclarant.</p></div>
          <button type="button" onClick={() => router.push("/admin/dashboard")} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8ccc0] bg-white px-5 py-3 font-black shadow-sm"><ArrowLeft size={18}/>Retour admin</button>
        </div>
        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {([
            ["Total", counts.total, "bg-white"], ["En attente", counts.nouveau, "bg-amber-50 border-amber-200"],
            ["En cours", counts.en_cours, "bg-orange-50 border-orange-200"], ["Animal retrouvé", counts.animal_retrouve, "bg-green-50 border-green-200"],
            ["Clôturé", counts.cloture, "bg-[#064b42] text-white"], ["Archivés", counts.archive, "bg-gray-100 border-gray-300"],
          ] as [string, number, string][]).map(([name, value, style]) => <div key={name} className={`rounded-3xl border p-5 text-center shadow-sm ${style}`}><p className="text-3xl font-black">{value}</p><p className="mt-1 text-sm font-bold">{name}</p></div>)}
        </section>
        <section className="mt-8 flex flex-wrap items-end gap-4 rounded-[2rem] bg-white p-6 shadow-lg">
          <div className="min-w-[240px] flex-1"><label htmlFor="statusFilter" className="mb-2 block font-bold">Filtrer par statut</label><select id="statusFilter" className={fieldClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">Tous les signalements</option><option value="archive">Archivés</option>{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <button type="button" onClick={() => setStatusFilter("")} className="inline-flex items-center gap-2 rounded-full bg-[#064b42] px-6 py-3 font-black text-white"><Search size={18}/>Tout afficher</button>
        </section>
        <section className="mt-8 grid gap-5">
          {loading ? <div className="rounded-3xl bg-white p-8 text-center">Chargement...</div> : visible.length === 0 ? <div className="rounded-3xl bg-white p-8 text-center">Aucun signalement trouvé.</div> : visible.map(item => {
            const current = statuses[item.id] || normalizeStatus(item.status);
            const archived = !!item.archived_at;
            const treated = current === "animal_retrouve" || current === "cloture";
            const compact = archived || (treated && !expanded[item.id]);
            return <article key={item.id} className={`rounded-[2rem] border-2 bg-white shadow-lg ${compact ? "p-4" : "p-6"} ${archived ? "border-gray-300" : "border-[#eadfce]"}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
                  <button type="button" onClick={() => item.photo_url && setPhotoLarge(item.photo_url)} disabled={!item.photo_url} aria-label="Agrandir la photo" className="flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#faf7f2] sm:w-44">
                    {item.photo_url ? <img src={item.photo_url} alt={`Photo de ${item.animal_name || "l'animal"}`} className="h-full w-full object-cover"/> : <span className="flex flex-col items-center gap-2 text-gray-400"><ImageIcon size={36}/><span className="text-xs">Aucune photo</span></span>}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-black">{item.type_signalement || "Signalement"}</h2><span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyle(current)}`}>{labelStatus(current)}</span></div>
                    <p className="mt-2 text-gray-600">{item.animal_type || "Animal"} — <strong>{item.animal_name || "Nom inconnu"}</strong></p>
                    <p className="mt-3 flex items-center gap-2 font-bold text-[#b58b5b]"><MapPin size={17}/>{item.city || "Commune inconnue"} - {item.island || "Île inconnue"}</p>
                    {!compact && item.address && <p className="mt-1 text-gray-600">Adresse : {item.address}</p>}
                    <a href={`/signalement/public/${item.id}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold underline"><ExternalLink size={15}/>Voir la fiche publique</a>
                  </div>
                </div>
                {!compact && !archived && <div className="w-full lg:max-w-sm">
                  <label htmlFor={`status-${item.id}`} className="mb-2 block font-black">Statut</label>
                  <select id={`status-${item.id}`} className={`${fieldClass} font-black`} value={current} onChange={e => setStatuses(prev => ({ ...prev, [item.id]: e.target.value as Status }))}>{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                  <label htmlFor={`message-${item.id}`} className="mb-2 mt-4 block font-black">Message au déclarant</label>
                  <textarea id={`message-${item.id}`} rows={3} className={fieldClass} placeholder="Optionnel : ajoutez un message." value={messages[item.id] || ""} onChange={e => setMessages(prev => ({ ...prev, [item.id]: e.target.value }))}/>
                  <button type="button" disabled={busy === item.id} onClick={() => void saveStatus(item)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#064b42] px-5 py-3.5 font-black text-white disabled:opacity-50"><Save size={18}/>{busy === item.id ? "Sauvegarde..." : "Sauvegarder le statut"}</button>
                  {!item.user_id && <p className="mt-2 text-xs font-bold text-orange-700">Aucun compte lié : notification dans l'application impossible.</p>}
                </div>}
              </div>
              {!compact && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Info icon={<Clock3 size={17}/>} title="Situation" value={item.situation}/>
                <Info icon={<MessageSquareText size={17}/>} title="Description" value={item.description}/>
                <Info icon={<User size={17}/>} title="Nom du déclarant" value={item.reporter_name}/>
                <Info icon={<Phone size={17}/>} title="Téléphone" value={item.reporter_phone}/>
                <Info icon={<Mail size={17}/>} title="Email" value={item.reporter_email}/>
                <Info icon={<CheckCircle2 size={17}/>} title="Date" value={item.created_at ? new Date(item.created_at).toLocaleString("fr-FR") : ""}/>
              </div>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {treated && !archived && <button type="button" onClick={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))} className="rounded-full border border-[#d8ccc0] bg-white px-4 py-2 text-sm font-black">{compact ? "Voir les détails" : "Réduire"}</button>}
                {!archived && <button type="button" onClick={() => startEdit(item)} disabled={busy === item.id} className="inline-flex items-center gap-2 rounded-full bg-[#e5f3ef] px-4 py-2 text-sm font-black disabled:opacity-50"><Pencil size={16}/>Modifier</button>}
                <button type="button" disabled={busy === item.id} onClick={() => void setArchive(item, !archived)} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 disabled:opacity-50">{archived ? <ArchiveRestore size={16}/> : <Archive size={16}/>} {archived ? "Désarchiver" : "Archiver"}</button>
                <button type="button" disabled={busy === item.id} onClick={() => void deleteItem(item)} className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700 disabled:opacity-50"><Trash2 size={16}/>Supprimer</button>
              </div>
            </article>;
          })}
        </section>
      </div>
      {photoLarge && <div role="dialog" aria-modal="true" aria-label="Photo de l'animal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPhotoLarge(null)}><button type="button" aria-label="Fermer" onClick={() => setPhotoLarge(null)} className="absolute right-5 top-5 rounded-full bg-white p-3 text-[#064b42]"><X/></button><img src={photoLarge} alt="Photo agrandie de l'animal" className="max-h-[90vh] max-w-full rounded-2xl object-contain" onClick={e => e.stopPropagation()}/></div>}
      {editing && draft && <div role="dialog" aria-modal="true" aria-label="Modifier le signalement" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4"><div className="mx-auto my-6 max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-2xl font-black">Modifier le signalement</h2><button type="button" onClick={() => { setEditing(null); setDraft(null); }} aria-label="Fermer" className="rounded-full bg-gray-100 p-2"><X/></button></div>
        <div className="grid gap-4 sm:grid-cols-2">{([
          ["type_signalement", "Type de signalement"], ["animal_type", "Type d'animal"], ["animal_name", "Nom de l'animal"],
          ["island", "Île"], ["city", "Commune"], ["address", "Adresse / secteur"],
          ["situation", "Situation"], ["description", "Description"], ["reporter_name", "Nom du déclarant"],
          ["reporter_phone", "Téléphone"], ["reporter_email", "Email"],
        ] as [keyof EditFields, string][]).map(([key, label]) => <div key={key} className={key === "situation" || key === "description" ? "sm:col-span-2" : ""}><label htmlFor={`edit-${key}`} className="mb-1 block text-sm font-black">{label}</label>{key === "description" || key === "situation" ? <textarea id={`edit-${key}`} rows={3} className={fieldClass} value={draft[key] || ""} onChange={e => setDraft(prev => prev ? { ...prev, [key]: e.target.value } : prev)}/> : <input id={`edit-${key}`} className={fieldClass} value={draft[key] || ""} onChange={e => setDraft(prev => prev ? { ...prev, [key]: e.target.value } : prev)}/>}</div>)}</div>
        <p className="mt-4 text-xs text-gray-500">Les modifications de la fiche ne déclenchent pas automatiquement une nouvelle publication Facebook.</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => { setEditing(null); setDraft(null); }} className="rounded-full border px-5 py-3 font-bold">Annuler</button><button type="button" disabled={busy === editing.id} onClick={() => void saveEdit()} className="inline-flex items-center gap-2 rounded-full bg-[#064b42] px-5 py-3 font-black text-white disabled:opacity-50"><Save size={17}/>{busy === editing.id ? "Enregistrement..." : "Enregistrer les modifications"}</button></div>
      </div></div>}
    </main>
  );
}
function Info({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | null | undefined }) {
  return <div className="rounded-2xl bg-[#faf7f2] p-4"><div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#b58b5b]">{icon}{title}</div><p className="mt-2 whitespace-pre-line break-words text-[#064b42]">{value || "Non renseigné"}</p></div>;
}
