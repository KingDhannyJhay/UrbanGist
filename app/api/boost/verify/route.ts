import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyAndAssertPayment } from '@/lib/paystack';
import { recalcSingleScore } from '@/lib/trending';
import { revalidateTag } from 'next/cache';

/**
 * POST /api/boost/verify
 *
 * Layer 2 — Called by the client immediately after Paystack popup
 * reports success. Independently verifies the payment with Paystack's
 * API before activating the boost.
 *
 * This is the primary activation path. The webhook is a backup.
 *
 * Body: { reference: string, promotionId: string }
 * Returns: { success: true, plan, endsAt } | { error: string }
 */
export async function POST(request: NextRequest) {
  // ── 1. Rate limit ────────────────────────────────────────────────────────
  const ip    = getClientIp(request);
  const limit = checkRateLimit(`boost-verify:${ip}`, RATE_LIMITS.default);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    );
  }

  // ── 2. Auth check ─────────────────────────────────────────────────────────
  const authSb = createServerSupabase();
  const { data: { user } } = await authSb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────
  let body: { reference?: string; promotionId?: string };
  try { body = await request.json() as { reference?: string; promotionId?: string }; }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }

  const { reference, promotionId } = body;

  if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
    return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 });
  }
  if (!promotionId || typeof promotionId !== 'string') {
    return NextResponse.json({ error: 'Promotion ID is required.' }, { status: 400 });
  }

  const admin = createAdminSupabase();

  // ── 4. Load the pending promotion ─────────────────────────────────────────
  const { data: promo, error: promoErr } = await admin
    .from('promotions')
    .select('*')
    .eq('id', promotionId)
    .eq('paystack_ref', reference)   // reference must match what we issued
    .eq('artist_id', user.id)        // ownership — user can only verify their own
    .single();

  if (promoErr || !promo) {
    return NextResponse.json(
      { error: 'Promotion not found or does not belong to your account.' },
      { status: 404 },
    );
  }

  // ── 5. Idempotency — already activated? ───────────────────────────────────
  if (promo.status === 'active') {
    const endsAt = promo.end_date;
    return NextResponse.json({
      success:  true,
      plan:     promo.plan,
      endsAt,
      message:  'Boost is already active.',
    });
  }

  // Only process pending promotions
  if (promo.status !== 'pending') {
    return NextResponse.json(
      { error: `Promotion cannot be activated. Current status: ${promo.status}.` },
      { status: 409 },
    );
  }

  // ── 6. Call Paystack API to verify payment ────────────────────────────────
  // This is the critical security step — we confirm with Paystack's servers
  // that money actually changed hands before touching the database.
  let verifiedTx: Awaited<ReturnType<typeof verifyAndAssertPayment>>;
  try {
    verifiedTx = await verifyAndAssertPayment(reference, promo.amount_ngn);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification failed.';
    console.error('[boost/verify] Paystack verification error:', message);
    return NextResponse.json({ error: message }, { status: 402 });
  }

  // ── 7. Activate boost in database ─────────────────────────────────────────
  const now     = new Date();
  const endDate = new Date(now.getTime() + promo.duration_hours * 3_600_000);

  const { error: updateErr } = await admin
    .from('promotions')
    .update({
      status:          'active',
      start_date:      now.toISOString(),
      end_date:        endDate.toISOString(),
      paid_at:         verifiedTx.paid_at,
      paystack_txn_id: String(verifiedTx.id),
    })
    .eq('id', promo.id)
    .eq('status', 'pending');  // double-guard: only update if still pending

  if (updateErr) {
    console.error('[boost/verify] DB update error:', updateErr.message);
    return NextResponse.json(
      { error: 'Failed to activate boost. Please contact support.' },
      { status: 500 },
    );
  }

  // ── 8. Apply boost multiplier to track ───────────────────────────────────
  await admin
    .from('tracks')
    .update({ boost_multiplier: promo.boost_multiplier })
    .eq('id', promo.track_id);

  // ── 9. Recalculate ranking score immediately ──────────────────────────────
  recalcSingleScore(promo.track_id).catch(e =>
    console.error('[boost/verify] Score recalc error:', e),
  );

  // ── 10. Opportunistically expire any finished boosts ─────────────────────
  admin.rpc('expire_finished_boosts').then(() => {}).catch(() => {});

  // ── 11. Send in-app notification to artist ────────────────────────────────
  await admin.from('notifications').insert({
    user_id: promo.artist_id,
    type:    'boost_activated',
    title:   '⚡ Boost Activated!',
    body:    `Your ${promo.plan} boost is live for ${promo.duration_hours / 24} day(s). Watch your plays grow!`,
    link:    '/dashboard',
  });

  // ── 12. Invalidate ISR caches ─────────────────────────────────────────────
  revalidateTag('tracks');
  revalidateTag('boosts');

  console.log(`[boost/verify] Boost activated: promo=${promo.id} track=${promo.track_id}`);

  return NextResponse.json({
    success:  true,
    plan:     promo.plan,
    endsAt:   endDate.toISOString(),
    message:  `Your ${promo.plan} boost is now live!`,
  });
}
