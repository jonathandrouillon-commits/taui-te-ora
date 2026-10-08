'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Settings = { enabled: boolean; daily_time: string; automatic_animals: boolean; automatic_advice: boolean; automatic_associations: boolean; repeat_delay_days: number };
type Post = { id: string; title: string | null; message: string | null; status: string; scheduled_at: string | null; published_at: string | null; error_message: string | null; facebook_post_id: string | null };
type Log = { id: string; action: string; status: string; details: string | null; created_at: string };
const time = (value: string | null) => value ? new Date(value).toLocaleString('fr-FR', { timeZone: 'Pacific/Tahiti' }) : '—';
export default function FacebookAdminPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const api = useCallback(async (method: 'GET' | 'POST', body?: unknown) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Connectez-vous avec un compte administrateur');
    const response = await fetch('/api/admin/facebook-posts', { method, headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erreur serveur');
    return result;
  }, []);
  const refresh = useCallback(async () => { const result = await api('GET'); setSettings(result.settings); setPosts(result.posts); setLogs(result.logs); }, [api]);
  useEffect(() => { refresh().catch(error => setNotice(error.message)); }, [refresh]);
  async function execute(action: Record<string, unknown>) {
    setBusy(true); setNotice('');
    try { await api('POST', action); await refresh(); setNotice('Enregistré avec succès'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Erreur'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-5xl space-y-6 p-4 pb-16 text-[#064b42]">
    <div><h1 className="text-3xl font-black">Facebook Auto Post</h1><p>TAUI TE ORA × Les Veilleurs de Kali — horaires de Tahiti</p></div>
    {notice && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{notice}</p>}
    {settings && <section className="space-y-4 rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-bold">Automatisation quotidienne</h2>
      <label className="flex items-center gap-3"><input type="checkbox" checked={settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} /> Activer les publications automatiques</label>
      <label className="block">Heure de publication (Tahiti)<input type="time" className="ml-3 rounded border p-2" value={settings.daily_time} onChange={e => setSettings({ ...settings, daily_time: e.target.value })} /></label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={settings.automatic_animals} onChange={e => setSettings({ ...settings, automatic_animals: e.target.checked })} /> Animaux disponibles</label>
      <p className="text-sm text-gray-600">Les conseils et associations seront disponibles dans une prochaine version. Ils ne sont pas publiés automatiquement pour le moment.</p>
      <label className="block">Délai entre deux mises en avant du même animal (jours)<input type="number" min="1" max="365" className="ml-3 w-20 rounded border p-2" value={settings.repeat_delay_days} onChange={e => setSettings({ ...settings, repeat_delay_days: Number(e.target.value) })} /></label>
      <button disabled={busy} className="rounded-xl bg-[#064b42] px-5 py-3 font-bold text-white disabled:opacity-50" onClick={() => execute({ action: 'settings', ...settings })}>Enregistrer les réglages</button>
    </section>}
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow"><h2 className="text-xl font-bold">Programmer une publication</h2>
      <input className="w-full rounded border p-3" placeholder="Titre (facultatif)" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="min-h-36 w-full rounded border p-3" placeholder="Texte de la publication" value={message} onChange={e => setMessage(e.target.value)} />
      <input className="w-full rounded border p-3" placeholder="URL HTTPS de la photo (facultatif)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
      <input className="w-full rounded border p-3" placeholder="URL HTTPS du lien (facultatif)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
      <label className="block">Date et heure (Tahiti)<input type="datetime-local" className="ml-3 rounded border p-2" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></label>
      <p className="text-sm text-gray-600">Une publication programmée est envoyée au prochain passage quotidien après son échéance. Une seule publication Auto Post par jour.</p>
      <button disabled={busy || !message.trim() || !scheduledAt} className="rounded-xl bg-[#064b42] px-5 py-3 font-bold text-white disabled:opacity-50" onClick={async () => { const date = new Date(`${scheduledAt}:00-10:00`); await execute({ action: 'create', title, message, image_url: imageUrl, link_url: linkUrl, scheduled_at: date.toISOString() }); }}>Programmer</button>
    </section>
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow"><h2 className="text-xl font-bold">Publications</h2>{posts.length === 0 && <p>Aucune publication.</p>}{posts.map(post => <article key={post.id} className="space-y-1 border-b py-3"><p className="font-bold">{post.title || post.message?.slice(0, 70) || 'Publication'} — {post.status}</p><p className="text-sm">Prévue : {time(post.scheduled_at)} · Publiée : {time(post.published_at)}</p>{post.error_message && <p className="text-sm text-red-700">{post.error_message}</p>}{['scheduled', 'draft'].includes(post.status) && <button disabled={busy} className="text-sm underline" onClick={() => execute({ action: 'cancel', id: post.id })}>Annuler</button>}</article>)}</section>
    <section className="space-y-2 rounded-2xl bg-white p-5 shadow"><h2 className="text-xl font-bold">Journal des envois</h2>{logs.length === 0 && <p>Aucune exécution.</p>}{logs.map(log => <p className="border-b py-2 text-sm" key={log.id}>{time(log.created_at)} — {log.status} — {log.details}</p>)}</section>
  </main>;
}
