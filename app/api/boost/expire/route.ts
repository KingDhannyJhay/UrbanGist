import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

/**
 * GET /api/boost/expire
 *
 * Lightweight endpoint that:
 * 1. Calls expire_finished_boosts() Supabase RPC
 * 2. Returns counts of expired promotions and reset tracks
 *
 * Called automatically by the Paystack webhook after every successful
 * boost payment (to clean up any previously expired boosts at the same time).
 *
 * Can also be triggered manually by an admin visiting the URL with the
 * WEBHOOK_SECRET header — useful if you notice stale boosts.
 *
 * No cron needed — runs opportunistically on each payment event.
 */
export async function GET(request: NextRequest) {
  // Verify caller is authorised
  const authHeader = request.headers.get('authorization') ?? '';
  const token      = authHeader.replace(/^Bearer\s+/i, '').trim();
  const secret     = process.env.WEBHOOK_SECRET ?? '';

  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminSupabase();

    // Call the SQL function that handles both expiry + multiplier reset
    const { data, error } = await admin.rpc('expire_finished_boosts');

    if (error) {
      console.error('[boost/expire] RPC error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      ok:            true,
      expired_promos: result?.expired_count ?? 0,
      reset_tracks:   result?.reset_count   ?? 0,
      timestamp:      new Date().toISOString(),
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[boost/expire] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
