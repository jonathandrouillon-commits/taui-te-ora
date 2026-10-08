import { createClient } from '@supabase/supabase-js';

export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server configuration missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('UNAUTHORIZED');
  const db = adminDb();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHORIZED');
  const { data: profile, error: profileError } = await db.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (profileError || !['admin', 'administrateur'].includes(String(profile?.role || '').toLowerCase())) throw new Error('FORBIDDEN');
  return db;
}

export function tahitiDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Tahiti', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function tahitiTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Pacific/Tahiti', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
}

export async function publishFacebook(message: string, imageUrl?: string | null, linkUrl?: string | null, mediaType?: string | null) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const version = process.env.FACEBOOK_GRAPH_VERSION || 'v26.0';
  if (!pageId || !token) throw new Error('Facebook configuration missing');
  const params = new URLSearchParams({ access_token: token });
  let endpoint = 'feed';
  if (imageUrl && mediaType === 'video') {
    endpoint = 'videos';
    params.set('file_url', imageUrl);
    params.set('description', [message, linkUrl].filter(Boolean).join('\n\n'));
  } else if (imageUrl) {
    endpoint = 'photos';
    params.set('url', imageUrl);
    params.set('caption', [message, linkUrl].filter(Boolean).join('\n\n'));
    params.set('published', 'true');
  } else {
    params.set('message', message);
    if (linkUrl) params.set('link', linkUrl);
  }
  const response = await fetch(`https://graph.facebook.com/${version}/${pageId}/${endpoint}`, { method: 'POST', body: params, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || 'Facebook publishing failed');
  return String(result.post_id || result.id || '');
}

export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return Response.json({ ok: false, error: message }, { status: message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500 });
}
