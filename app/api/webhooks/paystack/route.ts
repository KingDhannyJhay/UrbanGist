import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyAndAssertPayment } from '@/lib/paystack';
import { recalcSingleScore } from '@/lib/trending';
import { revalidateTag } from 'next/cache';

/**
 * POST /api/webhooks/paystack
 *
 * Layer 3 — Backup activation via Paystack server-to-server webhook.
 *
 * PRIMARY path is /api/boost/verify (called right after popup closes).
 * This webhook is a SAFETY NET for:
 *  - Network drops after payment but before verify call
 *  - Browser closed before our onSuccess callback fired
 *  - Any other client-side failure
 *
 * Security: HMAC-SHA512 timing-safe verification + idempotency guard.
 * Always returns HTTP 200 to Paystack (prevents infinite retry loops).
 */
export async function POST(request: NextRequest) {
  const ip    = getClientIp(request);
  const limit = checkRateLimit(`webhook:${ip}`, RATE_LIMITS.webhook);
  if (!limit.success) {
    console.warn('[webhook] Rate limited from', ip);
    return NextResponse.json({ received: true }); // 200 — no Paystack retry
  }

  // Read raw body BEFORE parsing — required for HMAC computation
  const rawBody   = await request.text();
  const signature = request.headers.get('x-paystack-signature') ?? '';

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  // HMAC-SHA512 timing-safe verification
  const expectedSig = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest('hex');

  let signatureValid = false;
  try {
    const a = Buffer.from(signature,   'hex');
    const b = Buffer.from(expectedSig, 'hex');
    signatureValid = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { signatureValid = false; }

  if (!signatureValid) {
    console.warn('[webhook] Invalid HMAC from', ip);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try { event = JSON.parse(rawBody) as typeof event; }
  catch { return NextResponse.json({ received: true }); }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference as string | undefined;
  if (!reference) return NextResponse.json({ received: true });

  const admin = createAdminSupabase();

  const { data: promo } = await admin
    .from('promotions')
    .select('*')
    .eq('paystack_ref', reference)
    .maybeSingle();

  if (!promo) {
    console.log('[webhook] No promo for ref:', reference);
    return NextResponse.json({ received: true });
  }

  // Idempotency — /api/boost/verify already activated this
  if (promo.status === 'active') {
    console.log('[webhook] Already active:', promo.id);
    return NextResponse.json({ received: true });
  }

  if (promo.status !== 'pending') {
    return NextResponse.json({ received: true });
  }

  // Re-verify with Paystack even on webhook path
  let tx: Awaited<ReturnType<typeof verifyAndAssertPayment>>;
  try {
    tx = await verifyAndAssertPayment(reference, promo.amount_ngn);
  } catch (err: unknown) {
    console.error('[webhook] Verify failed for', reference, err instanceof Error ? err.message : err);
    return NextResponse.json({ received: true });
  }

  const now     = new Date();
  const endDate = new Date(now.getTime() + promo.duration_hours * 3_600_000);

  const { error: updateErr } = await admin
    .from('promotions')
    .update({
      status:          'active',
      start_date:      now.toISOString(),
      end_date:        endDate.toISOString(),
      paid_at:         tx.paid_at,
      paystack_txn_id: String(tx.id),
    })
    .eq('id', promo.id)
    .eq('status', 'pending');

  if (updateErr) {
    console.error('[webhook] DB error:', updateErr.message);
    return NextResponse.json({ received: true });
  }

  await admin.from('tracks')
    .update({ boost_multiplier: promo.boost_multiplier })
    .eq('id', promo.track_id);

  recalcSingleScore(promo.track_id).catch(() => {});
  admin.rpc('expire_finished_boosts').then(() => {}).catch(() => {});

  await admin.from('notifications').insert({
    user_id: promo.artist_id,
    type:    'boost_activated',
    title:   '⚡ Boost Activated!',
    body:    `Your ${promo.plan} boost is live for ${promo.duration_hours / 24} day(s).`,
    link:    '/dashboard',
  });

  revalidateTag('tracks');
  revalidateTag('boosts');

  console.log('[webhook] Activated via backup webhook:', promo.id);
  return NextResponse.json({ received: true });
}
