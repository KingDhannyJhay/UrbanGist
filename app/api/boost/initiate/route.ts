import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { generateReference } from '@/lib/paystack';
import { BOOST_PLANS, type BoostPlan } from '@/types';

/**
 * POST /api/boost/initiate
 *
 * Layer 1 — Creates a pending promotion record and returns the Paystack
 * configuration needed to open the payment popup on the client.
 *
 * The reference is generated server-side so it cannot be tampered with.
 * Amount comes from the server's BOOST_PLANS config, not the client.
 *
 * Body: { trackId: string, plan: BoostPlan }
 * Returns: { reference, amount, email, publicKey, promotionId }
 */
export async function POST(request: NextRequest) {
  // ── 1. Rate limit ────────────────────────────────────────────────────────
  const ip    = getClientIp(request);
  const limit = checkRateLimit(`boost-initiate:${ip}`, RATE_LIMITS.default);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    );
  }

  // ── 2. Auth check — must be signed in ────────────────────────────────────
  const authSb = createServerSupabase();
  const { data: { user } } = await authSb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // ── 3. Parse and validate body ───────────────────────────────────────────
  let body: { trackId?: string; plan?: string };
  try { body = await request.json() as { trackId?: string; plan?: string }; }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }

  const { trackId, plan } = body;

  if (!trackId || typeof trackId !== 'string') {
    return NextResponse.json({ error: 'trackId is required.' }, { status: 400 });
  }

  const validPlans: BoostPlan[] = ['basic', 'standard', 'premium'];
  if (!plan || !validPlans.includes(plan as BoostPlan)) {
    return NextResponse.json(
      { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}.` },
      { status: 400 },
    );
  }

  const selectedPlan = plan as BoostPlan;

  // ── 4. Verify the track belongs to this artist and is live ────────────────
  const admin = createAdminSupabase();
  const { data: track, error: trackErr } = await admin
    .from('tracks')
    .select('id, title, status, artist_id')
    .eq('id', trackId)
    .eq('artist_id', user.id)   // ownership check
    .eq('status', 'live')       // must be live to boost
    .single();

  if (trackErr || !track) {
    return NextResponse.json(
      { error: 'Track not found or not eligible for boosting.' },
      { status: 404 },
    );
  }

  // ── 5. Get plan config from server — amount is authoritative here ─────────
  const planConfig = BOOST_PLANS[selectedPlan];

  // ── 6. Generate reference server-side ────────────────────────────────────
  const reference = generateReference('UG-BOOST');

  // ── 7. Get artist email ───────────────────────────────────────────────────
  const email = user.email ?? '';
  if (!email) {
    return NextResponse.json(
      { error: 'Account email is required to process payment.' },
      { status: 400 },
    );
  }

  // ── 8. Create pending promotion record ───────────────────────────────────
  const { data: promo, error: promoErr } = await admin
    .from('promotions')
    .insert({
      track_id:         trackId,
      artist_id:        user.id,
      plan:             selectedPlan,
      amount_ngn:       planConfig.price,
      boost_multiplier: planConfig.multiplier,
      duration_hours:   planConfig.hours,
      status:           'pending',
      paystack_ref:     reference,
    })
    .select('id')
    .single();

  if (promoErr || !promo) {
    console.error('[boost/initiate] Failed to create promotion:', promoErr?.message);
    return NextResponse.json(
      { error: 'Failed to initiate boost. Please try again.' },
      { status: 500 },
    );
  }

  // ── 9. Return Paystack config to client ───────────────────────────────────
  // IMPORTANT: publicKey is NEXT_PUBLIC_ — safe to send to client
  // NEVER send PAYSTACK_SECRET_KEY here
  return NextResponse.json({
    reference,
    amount:       planConfig.price * 100,  // kobo
    email,
    publicKey:    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    promotionId:  promo.id,
    plan:         selectedPlan,
    planLabel:    planConfig.label,
    amountNgn:    planConfig.price,
  });
}
