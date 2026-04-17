import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminSupabase } from '@/lib/supabase/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { recalcSingleScore } from '@/lib/trending';

const VALID_EVENTS  = new Set(['play','share','like','download']);
const VALID_SOURCES = new Set(['direct','whatsapp','instagram','tiktok','twitter','qr','other']);

export async function POST(request: NextRequest) {
  // 1. Rate limit by IP
  const ip    = getClientIp(request);
  const limit = checkRateLimit(`track-events:${ip}`, RATE_LIMITS.trackEvents);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { track_id, event_type, source = 'direct', progress_pct = 0, completed = false } = body;

  // 3. Validate
  if (typeof track_id !== 'string' || !track_id.trim())
    return NextResponse.json({ error: 'track_id required' }, { status: 400 });
  if (typeof event_type !== 'string' || !VALID_EVENTS.has(event_type))
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });

  const safeSource = VALID_SOURCES.has(source as string) ? (source as string) : 'other';

  // 4. Verify track is live (fail silently to not leak info)
  const admin = createAdminSupabase();
  const { data: track } = await admin
    .from('tracks').select('id').eq('id', track_id).eq('status', 'live').single();
  if (!track) return NextResponse.json({ success: true }, { headers: rateLimitHeaders(limit) });

  // 5. Optional auth
  const authSb = createServerSupabase();
  const { data: { user } } = await authSb.auth.getUser();

  // 6. Hash IP for privacy
  const ipHash = crypto.createHash('sha256')
    .update(ip + (process.env.WEBHOOK_SECRET ?? 'ug-ip-salt'))
    .digest('hex').slice(0, 16);

  // 7. Insert event
  const { error: evtErr } = await admin.from('track_events').insert({
    track_id,
    event_type,
    source:       safeSource,
    user_id:      user?.id ?? null,
    ip_hash:      ipHash,
    progress_pct: Number(progress_pct) || 0,
    completed:    Boolean(completed),
  });

  if (evtErr) {
    console.error('[events] insert:', evtErr.message);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }

  // 8. Increment counter
  const fieldMap: Record<string,string> = { play:'play_count', share:'share_count', like:'like_count' };
  const field = fieldMap[event_type];
  if (field) {
    await admin.rpc('increment_track_stat', { p_track_id: track_id, p_field: field });
    // Non-blocking score recalc
    recalcSingleScore(track_id).catch(e => console.error('[events] recalc:', e));
  }

  return NextResponse.json({ success: true }, { headers: rateLimitHeaders(limit) });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
