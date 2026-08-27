"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { requestToJoin, type Walk } from "../../services/walk.service";

type Participant = { id: string; user_id: string; dog_name: string; status: "pending" | "accepted" | "refused" };
type Message = { id: string; user_id: string; body: string; created_at: string };

export default function WalkDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [walk, setWalk] = useState<Walk | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [dogName, setDogName] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [{ data: auth }, { data: walkData }, { data: participantData }] = await Promise.all([
      supabase.auth.getUser(), supabase.from("community_walks").select("*").eq("id", id).single(), supabase.from("walk_participants").select("id,user_id,dog_name,status").eq("walk_id", id),
    ]);
    setUserId(auth.user?.id || null); setWalk(walkData as Walk); setParticipants((participantData as Participant[]) || []);
    if (auth.user && participantData?.some((p) => p.user_id === auth.user.id && p.status === "accepted") || walkData?.organizer_id === auth.user?.id) {
      const { data } = await supabase.from("walk_messages").select("id,user_id,body,created_at").eq("walk_id", id).order("created_at");
      setMessages((data as Message[]) || []);
    }
  }, [id]);

  useEffect(() => {
    // Le chargement est déclenché une seule fois par identifiant de balade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function join(event: FormEvent) { event.preventDefault(); try { const { error } = await requestToJoin(id, dogName.trim()); if (error) throw error; setNotice("Ta demande a été envoyée à l’organisateur."); setDogName(""); await load(); } catch { setNotice("Impossible d’envoyer la demande. Vérifie que tu es connecté."); } }
  async function decide(participantId: string, status: "accepted" | "refused") { await supabase.from("walk_participants").update({ status }).eq("id", participantId); await load(); }
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const body = String(form.get("body") || "").trim(); if (!body || !userId) return; const { error } = await supabase.from("walk_messages").insert({ walk_id: id, user_id: userId, body }); if (!error) { event.currentTarget.reset(); await load(); } }

  if (!walk) return <main className="min-h-screen bg-[#f4eee3] p-8 text-center font-bold text-[#064b42]">Chargement…</main>;
  const mine = participants.find((p) => p.user_id === userId);
  const canChat = walk.organizer_id === userId || mine?.status === "accepted";
  return <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42]"><section className="mx-auto max-w-3xl"><button onClick={() => router.back()} className="mb-5 font-black">← Retour</button><article className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-widest text-[#d96b4c]">Balade collective</p><h1 className="text-3xl font-black">{walk.title}</h1></div><span className="h-fit rounded-full bg-[#e5f4ef] px-4 py-2 text-sm font-black">{participants.filter((p) => p.status === "accepted").length}/{walk.max_dogs} chiens</span></div><div className="mt-6 space-y-2 font-bold"><p>📍 {walk.location}</p><p>📅 {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date(walk.starts_at))}</p><p>🚶 {walk.duration_minutes} minutes · {walk.audience}</p></div>{walk.description && <p className="mt-5 text-[#416c66]">{walk.description}</p>}<div className="mt-6 rounded-2xl bg-[#fff4e8] p-4 text-sm"><strong>Règle de la communauté :</strong> cette balade est consacrée à la socialisation et au bien-être. Les propositions de reproduction ou de saillie sont interdites.</div>
      {!userId && <Link href={`/login?redirect=/balades/${id}`} className="mt-6 block rounded-full bg-[#ef7f61] px-5 py-3 text-center font-black text-white">Se connecter pour participer</Link>}
      {userId && walk.organizer_id !== userId && !mine && <form onSubmit={join} className="mt-6 flex gap-2"><input required value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="Prénom de ton chien" className="min-w-0 flex-1 rounded-full border border-[#d9cec7] px-4"/><button className="rounded-full bg-[#ef7f61] px-5 py-3 font-black text-white">Demander à participer</button></form>}
      {mine && <p className="mt-5 rounded-2xl bg-[#e5f4ef] p-4 font-bold">{mine.status === "pending" ? "⏳ Demande en attente" : mine.status === "accepted" ? "✅ Participation acceptée" : "Demande non retenue"}</p>}{notice && <p className="mt-3 text-sm font-bold">{notice}</p>}
      {walk.organizer_id === userId && participants.some((p) => p.status === "pending") && <div className="mt-7"><h2 className="text-xl font-black">Demandes à valider</h2>{participants.filter((p) => p.status === "pending").map((p) => <div key={p.id} className="mt-3 flex items-center justify-between rounded-2xl border border-[#e5ddd2] p-3"><strong>🐕 {p.dog_name}</strong><div className="flex gap-2"><button onClick={() => decide(p.id, "accepted")} className="rounded-full bg-[#0c7164] px-3 py-2 text-sm font-black text-white">Accepter</button><button onClick={() => decide(p.id, "refused")} className="rounded-full bg-gray-100 px-3 py-2 text-sm font-black">Refuser</button></div></div>)}</div>}
    </article>{canChat && <section className="mt-5 rounded-[32px] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">💬 Discussion de la balade</h2><p className="mt-1 text-xs text-[#416c66]">Visible uniquement par l’organisateur et les participants acceptés.</p><div className="mt-5 max-h-96 space-y-3 overflow-y-auto">{messages.length === 0 && <p className="rounded-2xl bg-[#f4eee3] p-4 text-sm">Aucun message. Présentez-vous et précisez le rendez-vous.</p>}{messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-2xl p-3 ${message.user_id === userId ? "ml-auto bg-[#0c7164] text-white" : "bg-[#f4eee3]"}`}><p>{message.body}</p><time className="mt-1 block text-[10px] opacity-70">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.created_at))}</time></div>)}</div><form onSubmit={send} className="mt-4 flex gap-2"><input name="body" required maxLength={1000} placeholder="Écrire au groupe…" className="min-w-0 flex-1 rounded-full border border-[#d9cec7] px-4 py-3"/><button className="rounded-full bg-[#ef7f61] px-5 font-black text-white">Envoyer</button></form></section>}</section></main>;
}
