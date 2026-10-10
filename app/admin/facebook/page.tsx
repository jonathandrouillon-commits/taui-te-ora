
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  CalendarDays,
  ImagePlus,
  Send,
  PawPrint,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

type Settings = {
  enabled: boolean;
  daily_time: string;
  automatic_animals: boolean;
  automatic_advice: boolean;
  automatic_associations: boolean;
  repeat_delay_days: number;
};

type Post = {
  id: string;
  title: string | null;
  message: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  facebook_post_id: string | null;
};

type Log = {
  id: string;
  action: string;
  status: string;
  details: string | null;
  created_at: string;
};

type MediaType = 'image' | 'video';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 90 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
];

const time = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        timeZone: 'Pacific/Tahiti',
      })
    : '—';

export default function FacebookAdminPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');

  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [fileName, setFileName] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [linkUrl, setLinkUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const previewRef = useRef<string>('');
  const uploadIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      uploadIdRef.current += 1;

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = '';
      }
    };
  }, []);

  const api = useCallback(
    async (method: 'GET' | 'POST', body?: unknown) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          'Connectez-vous avec un compte administrateur'
        );
      }

      const response = await fetch('/api/admin/facebook-posts', {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(body
            ? { 'Content-Type': 'application/json' }
            : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur serveur');
      }

      return result;
    },
    []
  );

  const refresh = useCallback(async () => {
    const result = await api('GET');

    setSettings(result.settings);
    setPosts(result.posts);
    setLogs(result.logs);
  }, [api]);

  useEffect(() => {
    refresh().catch((error) => {
      setNotice(
        error instanceof Error ? error.message : 'Erreur'
      );
    });
  }, [refresh]);

  async function execute(action: Record<string, unknown>) {
    setBusy(true);
    setNotice('');

    try {
      await api('POST', action);
      await refresh();
      setNotice('Enregistré avec succès');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Erreur'
      );
    } finally {
      setBusy(false);
    }
  }

  function clearPreview() {
    uploadIdRef.current += 1;

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = '';
    }

    setPreviewUrl('');
    setImageUrl('');
    setMediaType(null);
    setFileName('');
    setUploadError('');
    setUploadSuccess(false);
    setUploading(false);
  }

  async function uploadMedia(file: File | undefined) {
    if (!file) return;

    clearPreview();
    setNotice('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(
        'Format non accepté. Utilisez JPG, PNG, WebP, MP4 ou MOV.'
      );
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const type: MediaType = isVideo ? 'video' : 'image';

    const maxSize = isVideo
      ? MAX_VIDEO_SIZE
      : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      setUploadError(
        `Fichier trop volumineux. Maximum ${
          isVideo ? '90 Mo' : '10 Mo'
        }.`
      );
      return;
    }

    const currentUploadId = ++uploadIdRef.current;

    const localUrl = URL.createObjectURL(file);

    previewRef.current = localUrl;

    setPreviewUrl(localUrl);
    setMediaType(type);
    setFileName(file.name);
    setUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          'Connexion administrateur requise'
        );
      }

      const form = new FormData();
      form.append('file', file);

      const response = await fetch(
        '/api/admin/facebook-upload',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: form,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Import impossible'
        );
      }

      if (!result.url || typeof result.url !== 'string') {
        throw new Error(
          "Le serveur n'a pas retourné d'URL valide."
        );
      }

      if (
        !mountedRef.current ||
        currentUploadId !== uploadIdRef.current
      ) {
        return;
      }

      setImageUrl(result.url);
      setMediaType(
        result.media_type === 'video' ? 'video' : 'image'
      );
      setUploadSuccess(true);
      setUploadError('');
      setNotice('Média importé avec succès');
    } catch (error) {
      if (
        !mountedRef.current ||
        currentUploadId !== uploadIdRef.current
      ) {
        return;
      }

      setImageUrl('');
      setUploadSuccess(false);

      setUploadError(
        error instanceof Error
          ? error.message
          : "Erreur pendant l'importation"
      );
    } finally {
      if (
        mountedRef.current &&
        currentUploadId === uploadIdRef.current
      ) {
        setUploading(false);
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 bg-[#f5ead8]/30 p-4 pb-16 text-[#064b42]">
      <div className="rounded-3xl bg-[#064b42] p-6 text-white shadow-lg">
        <h1 className="flex items-center gap-3 text-3xl font-black">
          <PawPrint />
          TAUI AUTO POST
        </h1>

        <p className="mt-2 text-sm text-white/80">
          TAUI TE ORA × Les Veilleurs de Kali · Heure de Tahiti
        </p>
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-xl bg-amber-50 p-3 text-sm"
        >
          {notice}
        </p>
      )}

      {settings && (
        <section className="space-y-4 rounded-3xl border border-[#e9ddc8] bg-white p-5 shadow-md">
          <h2 className="text-xl font-bold">
            Automatisation quotidienne
          </h2>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enabled: e.target.checked,
                })
              }
            />
            Activer les publications automatiques
          </label>

          <label className="block">
            Heure de publication (Tahiti)
            <input
              type="time"
              className="ml-3 rounded border p-2"
              value={settings.daily_time}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  daily_time: e.target.value,
                })
              }
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.automatic_animals}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  automatic_animals: e.target.checked,
                })
              }
            />
            Animaux disponibles
          </label>

          <p className="text-sm text-gray-600">
            Les conseils et associations seront disponibles dans
            une prochaine version. Ils ne sont pas publiés
            automatiquement pour le moment.
          </p>

          <label className="block">
            Délai entre deux mises en avant du même animal (jours)
            <input
              type="number"
              min="1"
              max="365"
              className="ml-3 w-20 rounded border p-2"
              value={settings.repeat_delay_days}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  repeat_delay_days: Number(e.target.value),
                })
              }
            />
          </label>

          <button
            disabled={busy}
            className="rounded-xl bg-[#064b42] px-5 py-3 font-bold text-white disabled:opacity-50"
            onClick={() =>
              execute({
                action: 'settings',
                ...settings,
              })
            }
          >
            Enregistrer les réglages
          </button>
        </section>
      )}

      <section className="space-y-4 rounded-3xl border border-[#e9ddc8] bg-white p-5 shadow-md">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <CalendarDays size={22} />
          Créer une publication
        </h2>

        <input
          className="w-full rounded border p-3"
          placeholder="Titre (facultatif)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="min-h-36 w-full rounded border p-3"
          placeholder="Texte de la publication"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#cbbd9f] bg-[#f5ead8]/50 p-6 text-center font-bold hover:bg-[#f5ead8]">
          <ImagePlus size={28} />

          <span>
            Choisir une photo ou une vidéo depuis l'ordinateur
          </span>

          <span className="text-xs font-normal">
            JPG, PNG, WebP (10 Mo) · MP4, MOV (90 Mo)
          </span>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            className="sr-only"
            disabled={uploading || busy}
            onChange={(e) => {
              void uploadMedia(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>

        {previewUrl && (
          <div className="space-y-3 rounded-2xl border border-[#e9ddc8] bg-[#f5ead8]/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">
                  Aperçu du média
                </p>

                <p className="truncate text-xs text-gray-600">
                  {fileName}
                </p>
              </div>

              <button
                type="button"
                onClick={clearPreview}
                className="rounded-full bg-white p-2 text-red-700 shadow-sm"
                title="Retirer ce média"
              >
                <X size={18} />
              </button>
            </div>

            {mediaType === 'video' ? (
              <video
                src={previewUrl}
                controls
                playsInline
                className="max-h-80 w-full rounded-xl bg-black object-contain"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Aperçu du média sélectionné"
                className="max-h-80 w-full rounded-xl object-contain"
              />
            )}

            {uploading && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-800"
              >
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Importation du média en cours…
              </div>
            )}

            {uploadSuccess && imageUrl && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-800"
              >
                <CheckCircle2 size={18} />
                Média importé et prêt pour la publication.
              </div>
            )}

            {uploadError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"
              >
                <AlertCircle
                  size={18}
                  className="shrink-0"
                />
                <div>
                  <p className="font-bold">
                    Importation impossible
                  </p>
                  <p>{uploadError}</p>
                  <p className="mt-1">
                    L'aperçu reste visible, mais le média
                    ne pourra pas être publié tant que
                    l'importation n'aura pas réussi.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!previewUrl && uploadError && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {uploadError}
          </p>
        )}

        <input
          className="w-full rounded border p-3"
          placeholder="URL HTTPS du lien (facultatif)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />

        <label className="block">
          Date et heure (Tahiti)
          <input
            type="datetime-local"
            className="ml-3 rounded border p-2"
            value={scheduledAt}
            onChange={(e) =>
              setScheduledAt(e.target.value)
            }
          />
        </label>

        <p className="text-sm text-gray-600">
          Une publication programmée est envoyée au
          prochain passage quotidien après son échéance.
          Une seule publication Auto Post par jour.
        </p>

        <button
          disabled={
            busy ||
            uploading ||
            !message.trim() ||
            !scheduledAt ||
            (!!previewUrl && !imageUrl)
          }
          className="rounded-xl bg-[#064b42] px-5 py-3 font-bold text-white disabled:opacity-50"
          onClick={async () => {
            const date = new Date(
              `${scheduledAt}:00-10:00`
            );

            await execute({
              action: 'create',
              title,
              message,
              image_url: imageUrl,
              media_type: mediaType,
              link_url: linkUrl,
              scheduled_at: date.toISOString(),
            });
          }}
        >
          <Send
            size={16}
            className="mr-2 inline"
          />
          Programmer
        </button>
      </section>

      <section className="space-y-3 rounded-3xl border border-[#e9ddc8] bg-white p-5 shadow-md">
        <h2 className="text-xl font-bold">
          Publications
        </h2>

        {posts.length === 0 && (
          <p>Aucune publication.</p>
        )}

        {posts.map((post) => (
          <article
            key={post.id}
            className="space-y-1 border-b py-3"
          >
            <p className="font-bold">
              {post.title ||
                post.message?.slice(0, 70) ||
                'Publication'}{' '}
              — {post.status}
            </p>

            <p className="text-sm">
              Prévue : {time(post.scheduled_at)} ·
              Publiée : {time(post.published_at)}
            </p>

            {post.error_message && (
              <p className="text-sm text-red-700">
                {post.error_message}
              </p>
            )}

            {['scheduled', 'draft'].includes(
              post.status
            ) && (
              <button
                disabled={busy}
                className="text-sm underline"
                onClick={() =>
                  execute({
                    action: 'cancel',
                    id: post.id,
                  })
                }
              >
                Annuler
              </button>
            )}
          </article>
        ))}
      </section>

      <section className="space-y-2 rounded-3xl border border-[#e9ddc8] bg-white p-5 shadow-md">
        <h2 className="text-xl font-bold">
          Journal des envois
        </h2>

        {logs.length === 0 && (
          <p>Aucune exécution.</p>
        )}

        {logs.map((log) => (
          <p
            className="border-b py-2 text-sm"
            key={log.id}
          >
            {time(log.created_at)} — {log.status} —{' '}
            {log.details}
          </p>
        ))}
      </section>
    </main>
  );
}
