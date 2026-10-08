import { requireAdmin, failure } from '../../../lib/facebook-autopost';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const [settings, posts, logs] = await Promise.all([
      db.from('facebook_auto_settings').select('*').eq('id', 1).single(),
      db.from('facebook_auto_posts').select('*').order('created_at', { ascending: false }).limit(100),
      db.from('facebook_auto_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (settings.error || posts.error || logs.error) throw new Error(settings.error?.message || posts.error?.message || logs.error?.message);
    return Response.json({ ok: true, settings: settings.data, posts: posts.data, logs: logs.data });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const db = await requireAdmin(request);
    const body = await request.json();
    if (body.action === 'settings') {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const key of ['enabled', 'automatic_animals', 'automatic_advice', 'automatic_associations']) {
        if (typeof body[key] === 'boolean') update[key] = body[key];
      }
      if (typeof body.daily_time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.daily_time)) update.daily_time = body.daily_time;
      if (Number.isInteger(body.repeat_delay_days) && body.repeat_delay_days >= 1 && body.repeat_delay_days <= 365) update.repeat_delay_days = body.repeat_delay_days;
      const { error } = await db.from('facebook_auto_settings').update(update).eq('id', 1);
      if (error) throw error;
      return Response.json({ ok: true });
    }
    if (body.action === 'create') {
      const message = String(body.message || '').trim();
      const scheduled = String(body.scheduled_at || '');
      if (!message || message.length > 10000) return Response.json({ error: 'Message required (max 10000 characters)' }, { status: 400 });
      if (!scheduled || !Number.isFinite(Date.parse(scheduled)) || Date.parse(scheduled) <= Date.now()) return Response.json({ error: 'Future date required' }, { status: 400 });
      const image = String(body.image_url || '').trim();
      const link = String(body.link_url || '').trim();
      for (const value of [image, link]) {
        if (value && (!/^https:\/\//i.test(value) || value.length > 2000)) return Response.json({ error: 'Public HTTPS URLs only' }, { status: 400 });
      }
      const { error } = await db.from('facebook_auto_posts').insert({ post_type: 'manual', title: String(body.title || '').slice(0, 200), message, image_url: image || null, link_url: link || null, scheduled_at: new Date(scheduled).toISOString(), status: 'scheduled' });
      if (error) throw error;
      return Response.json({ ok: true });
    }
    if (body.action === 'cancel') {
      const { error } = await db.from('facebook_auto_posts').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', body.id).in('status', ['draft', 'scheduled']);
      if (error) throw error;
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) { return failure(error); }
}
