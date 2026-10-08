import { adminDb, publishFacebook, tahitiDay, tahitiTime } from '../../../lib/facebook-autopost';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const db = adminDb();
  const now = new Date();
  const day = tahitiDay(now);
  const { data: settings, error: settingsError } = await db.from('facebook_auto_settings').select('*').eq('id', 1).single();
  if (settingsError) return Response.json({ error: settingsError.message }, { status: 500 });
  if (!settings.enabled || tahitiTime(now) < settings.daily_time) return Response.json({ ok: true, skipped: 'disabled or too early' });

  // Atomic daily reservation prevents overlapping cron executions.
  const { data: reservation, error: reserveError } = await db.from('facebook_auto_daily_runs').insert({ day, status: 'processing' }).select('day').maybeSingle();
  if (reserveError) {
    if (reserveError.code === '23505') return Response.json({ ok: true, skipped: 'already attempted today' });
    return Response.json({ error: reserveError.message }, { status: 500 });
  }
  if (!reservation) return Response.json({ ok: true, skipped: 'already reserved' });
  let postId: string | null = null;
  try {
    const { data: scheduled, error: scheduledError } = await db.from('facebook_auto_posts').select('*').eq('status', 'scheduled').lte('scheduled_at', now.toISOString()).order('scheduled_at', { ascending: true }).limit(1);
    if (scheduledError) throw scheduledError;
    let post = scheduled?.[0];
    if (!post && settings.automatic_animals) {
      const { data: animals, error: animalsError } = await db.from('animals').select('id,animal_name,animal_type,age_label,city,island').eq('is_published', true).eq('is_adopted', false).limit(100);
      if (animalsError) throw animalsError;
      const cutoff = new Date(now.getTime() - settings.repeat_delay_days * 86400000).toISOString();
      const { data: recent, error: recentError } = await db.from('facebook_auto_posts').select('animal_id').eq('post_type', 'animal').eq('status', 'published').gte('published_at', cutoff);
      if (recentError) throw recentError;
      const used = new Set((recent || []).map(row => row.animal_id));
      const animal = (animals || []).find(row => !used.has(row.id));
      if (animal) {
        const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taui-te-ora.com').replace(/\/$/, '');
        const link = `${base}/animal/${encodeURIComponent(animal.id)}?adoption=1`;
        const message = `🐾 ${animal.animal_name || 'Un compagnon'} attend sa famille ❤️\n\n${[animal.animal_type, animal.age_label, animal.city, animal.island].filter(Boolean).join(' • ')}\n\nDécouvrez son profil sur TAUI TE ORA.\n\n#TauiTeOra #LesVeilleursDeKali #Adoption`;
        const { data: created, error: createError } = await db.from('facebook_auto_posts').insert({ post_type: 'animal', title: animal.animal_name, animal_id: animal.id, message, link_url: link, status: 'scheduled', scheduled_at: now.toISOString() }).select('*').single();
        if (createError) throw createError;
        post = created;
      }
    }
    if (!post) {
      await db.from('facebook_auto_daily_runs').update({ status: 'skipped' }).eq('day', day);
      return Response.json({ ok: true, skipped: 'no eligible content' });
    }
    postId = post.id;
    const { data: claimed, error: claimError } = await db.from('facebook_auto_posts').update({ status: 'processing', updated_at: now.toISOString() }).eq('id', post.id).eq('status', 'scheduled').select('id').maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) throw new Error('Post already claimed');
    // Recheck eligibility just before publication.
    if (post.animal_id) {
      const { data: animal, error: animalError } = await db.from('animals').select('is_published,is_adopted').eq('id', post.animal_id).single();
      if (animalError || !animal?.is_published || animal?.is_adopted) throw new Error('Animal no longer eligible');
    }
    const fbId = await publishFacebook(post.message || '', post.image_url, post.link_url);
    await db.from('facebook_auto_posts').update({ status: 'published', facebook_post_id: fbId, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', post.id);
    await db.from('facebook_auto_daily_runs').update({ status: 'published', post_id: post.id }).eq('day', day);
    await db.from('facebook_auto_logs').insert({ post_id: post.id, action: 'publish', status: 'published', details: fbId });
    return Response.json({ ok: true, published: true, post_id: post.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (postId) await db.from('facebook_auto_posts').update({ status: 'failed', error_message: message.slice(0, 1000), updated_at: new Date().toISOString() }).eq('id', postId);
    await db.from('facebook_auto_daily_runs').update({ status: 'failed' }).eq('day', day);
    await db.from('facebook_auto_logs').insert({ post_id: postId, action: 'publish', status: 'failed', details: message.slice(0, 1000) });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
