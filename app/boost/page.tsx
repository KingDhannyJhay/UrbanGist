'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BOOST_PLANS, type BoostPlan, type LiveTrack } from '@/types';
import { formatNaira } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Zap, Check, Loader2, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Paystack inline types — loaded via <Script> below
declare global {
  interface Window {
    PaystackPop: {
      setup(config: {
        key:        string;
        email:      string;
        amount:     number;
        currency:   string;
        ref:        string;
        metadata?: Record<string, unknown>;
        onSuccess:  (transaction: { reference: string }) => void;
        onCancel:   () => void;
      }): { openIframe(): void };
    };
  }
}

type FlowState =
  | { step: 'select' }
  | { step: 'paying' }
  | { step: 'verifying' }
  | { step: 'success'; plan: string; endsAt: string };

export default function BoostPage() {
  const searchParams    = useSearchParams();
  const router          = useRouter();
  const supabase        = createClient();
  const preselectedId   = searchParams.get('track');

  const [userTracks,    setUserTracks]    = useState<LiveTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>(preselectedId ?? '');
  const [selectedPlan,  setSelectedPlan]  = useState<BoostPlan>('standard');
  const [flowState,     setFlowState]     = useState<FlowState>({ step: 'select' });
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [scriptReady,   setScriptReady]   = useState(false);

  // Load user's live tracks
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_id', user.id)
        .eq('status', 'live')
        .order('created_at', { ascending: false });

      const tracks = (data ?? []) as LiveTrack[];
      setUserTracks(tracks);
      if (!preselectedId && tracks[0]) setSelectedTrack(tracks[0].id);
      setLoadingTracks(false);
    })();
  }, []);

  const plan            = BOOST_PLANS[selectedPlan];
  const selectedTrackObj = userTracks.find(t => t.id === selectedTrack);

  const handleBoost = async () => {
    if (!selectedTrack) { toast.error('Please select a track to boost.'); return; }
    if (!scriptReady)   { toast.error('Payment system is loading. Please try again.'); return; }

    setFlowState({ step: 'paying' });

    try {
      // ── Layer 1a: Get reference + config from server ──────────────────────
      const initiateRes = await fetch('/api/boost/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ trackId: selectedTrack, plan: selectedPlan }),
      });

      if (!initiateRes.ok) {
        const err = await initiateRes.json() as { error: string };
        throw new Error(err.error ?? 'Failed to initiate payment.');
      }

      const config = await initiateRes.json() as {
        reference:   string;
        amount:      number;
        email:       string;
        publicKey:   string;
        promotionId: string;
      };

      // ── Layer 1b: Open Paystack popup ─────────────────────────────────────
      const handler = window.PaystackPop.setup({
        key:      config.publicKey,
        email:    config.email,
        amount:   config.amount,
        currency: 'NGN',
        ref:      config.reference,
        metadata: { promotionId: config.promotionId, plan: selectedPlan },

        onSuccess: async (transaction) => {
          // ── Layer 2: Verify payment server-side before showing success ────
          setFlowState({ step: 'verifying' });

          try {
            const verifyRes = await fetch('/api/boost/verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                reference:   transaction.reference,
                promotionId: config.promotionId,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json() as { error: string };
              throw new Error(err.error ?? 'Verification failed.');
            }

            const result = await verifyRes.json() as {
              success: boolean;
              plan:    string;
              endsAt:  string;
            };

            // ── Layer 3: Show success (DB already updated by verify route) ──
            setFlowState({ step: 'success', plan: result.plan, endsAt: result.endsAt });
            toast.success('Boost activated! Your track is now featured. ⚡');

          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Verification failed.';
            toast.error(msg);
            // Even if verify fails here, the webhook will catch it
            toast('If your payment went through, your boost will activate shortly via our backup system.', { icon: 'ℹ️' });
            setFlowState({ step: 'select' });
          }
        },

        onCancel: () => {
          toast('Payment cancelled.');
          setFlowState({ step: 'select' });
        },
      });

      handler.openIframe();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred.';
      toast.error(msg);
      setFlowState({ step: 'select' });
    }
  };

  const isProcessing = flowState.step === 'paying' || flowState.step === 'verifying';

  return (
    <>
      {/* Load Paystack inline JS — afterInteractive ensures DOM is ready */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => toast.error('Failed to load payment system. Please refresh.')}
      />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/20 bg-purple-950/50 text-purple-400 text-sm font-semibold mb-6">
              <Zap size={14} /> UrbanGist Boost
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black text-[#F8F8F8] mb-4"
              style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
            >
              Supercharge Your Music
            </h1>
            <p className="text-[#A3A3A3] max-w-xl mx-auto text-lg">
              Multiply your ranking score by up to 6× and get featured placement
              where thousands of listeners discover new music every day.
            </p>
          </div>

          {/* Success state */}
          {flowState.step === 'success' && (
            <div className="max-w-md mx-auto card p-10 text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 mx-auto flex items-center justify-center text-green-500">
                <CheckCircle2 size={40} />
              </div>
              <h2
                className="text-2xl font-black text-[#F8F8F8]"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
              >
                Boost Activated! ⚡
              </h2>
              <p className="text-[#A3A3A3]">
                Your <strong className="text-[#F8F8F8] capitalize">{flowState.plan}</strong> boost
                is now live. Your track is climbing the ranking feed.
              </p>
              {flowState.endsAt && (
                <p className="text-sm text-[#525252]">
                  Boost expires: {new Date(flowState.endsAt).toLocaleDateString('en-NG', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard" className="btn-primary flex-1 justify-center">
                  View Dashboard
                </Link>
                <button
                  onClick={() => setFlowState({ step: 'select' })}
                  className="btn-secondary flex-1"
                >
                  Boost Another
                </button>
              </div>
            </div>
          )}

          {/* Verifying state */}
          {flowState.step === 'verifying' && (
            <div className="max-w-md mx-auto card p-10 text-center space-y-4">
              <Loader2 size={40} className="animate-spin text-green-500 mx-auto" />
              <h2
                className="text-xl font-black text-[#F8F8F8]"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
              >
                Verifying Payment…
              </h2>
              <p className="text-[#A3A3A3] text-sm">
                Confirming with Paystack and activating your boost. This takes just a moment.
              </p>
            </div>
          )}

          {/* Select state */}
          {(flowState.step === 'select' || flowState.step === 'paying') && (
            <div className="grid lg:grid-cols-3 gap-8">

              {/* Plans */}
              <div className="lg:col-span-2 space-y-4">
                <h2
                  className="font-bold text-[#F8F8F8] mb-4"
                  style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
                >
                  Choose a Boost Plan
                </h2>

                {(Object.entries(BOOST_PLANS) as [BoostPlan, typeof plan][]).map(([id, p]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedPlan(id)}
                    disabled={isProcessing}
                    className={cn(
                      'w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 disabled:opacity-50',
                      selectedPlan === id
                        ? 'border-green-500 bg-green-500/5'
                        : 'border-[#2A2A2A] bg-[#161616] hover:border-[#3A3A3A]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                          selectedPlan === id ? 'bg-green-500/10' : 'bg-[#1C1C1C]',
                        )}>
                          {p.badge}
                        </div>
                        <div>
                          <p
                            className="font-bold text-[#F8F8F8]"
                            style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
                          >
                            {p.label}
                          </p>
                          <p className="text-sm text-[#525252]">{p.description}</p>
                          <div className="flex flex-wrap gap-3 mt-3">
                            {[
                              `${p.multiplier}× ranking boost`,
                              `${p.hours / 24} day${p.hours > 24 ? 's' : ''} duration`,
                              'Featured placement',
                              'Analytics tracking',
                            ].map(f => (
                              <span key={f} className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                                <Check size={11} className="text-green-500" />
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span
                          className="text-2xl font-black text-[#F8F8F8]"
                          style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
                        >
                          {formatNaira(p.price)}
                        </span>
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                          selectedPlan === id ? 'border-green-500 bg-green-500' : 'border-[#2A2A2A]',
                        )}>
                          {selectedPlan === id && <Check size={11} className="text-[#0B0B0B]" />}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {/* How it works */}
                <div className="card p-6 mt-4">
                  <h3
                    className="font-bold text-[#F8F8F8] mb-4"
                    style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
                  >
                    How Boost Works
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: '💳', t: 'Pay securely via Paystack (card, bank transfer, USSD)' },
                      { icon: '✅', t: 'Your payment is verified with Paystack\'s API instantly' },
                      { icon: '📈', t: 'Rank score multiplied — you rise up the discovery feed' },
                      { icon: '🏷️', t: '"Boosted" badge on your track card' },
                      { icon: '📊', t: 'Track boost performance in your dashboard' },
                    ].map(({ icon, t }) => (
                      <div key={t} className="flex items-start gap-3 text-sm text-[#A3A3A3]">
                        <span className="flex-shrink-0 text-base">{icon}</span>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div>
                <div className="card p-6 sticky top-24 space-y-5">
                  <h3
                    className="font-bold text-[#F8F8F8]"
                    style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
                  >
                    Order Summary
                  </h3>

                  {/* Track selector */}
                  <div>
                    <label className="label">Track to Boost</label>
                    {loadingTracks ? (
                      <div className="h-10 rounded-xl skeleton" />
                    ) : userTracks.length > 0 ? (
                      <select
                        className="input text-sm"
                        value={selectedTrack}
                        onChange={e => setSelectedTrack(e.target.value)}
                        disabled={isProcessing}
                      >
                        {userTracks.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-[#525252] p-3 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A]">
                        No live tracks yet.{' '}
                        <Link href="/upload" className="text-green-500 hover:underline">Upload one first →</Link>
                      </div>
                    )}
                  </div>

                  {/* Track preview */}
                  {selectedTrackObj && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1C]">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={selectedTrackObj.cover_url}
                          alt={selectedTrackObj.title}
                          fill sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#F8F8F8] truncate">
                          {selectedTrackObj.title}
                        </p>
                        <p className="text-xs text-[#525252]">Live track</p>
                      </div>
                    </div>
                  )}

                  {/* Summary lines */}
                  <div className="space-y-2 text-sm border-t border-[#2A2A2A] pt-4">
                    <div className="flex justify-between text-[#A3A3A3]">
                      <span>{plan.label}</span>
                      <span>{formatNaira(plan.price)}</span>
                    </div>
                    <div className="flex justify-between text-[#A3A3A3]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Duration
                      </span>
                      <span>
                        {plan.hours >= 168 ? '7 days' : plan.hours >= 72 ? '3 days' : '24 hours'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#A3A3A3]">
                      <span className="flex items-center gap-1">
                        <Zap size={12} /> Multiplier
                      </span>
                      <span className="text-green-500 font-semibold">{plan.multiplier}×</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#F8F8F8] pt-2 border-t border-[#2A2A2A]">
                      <span>Total</span>
                      <span className="text-green-500">{formatNaira(plan.price)}</span>
                    </div>
                  </div>

                  {/* Pay button */}
                  <button
                    onClick={handleBoost}
                    disabled={isProcessing || !selectedTrack || userTracks.length === 0 || !scriptReady}
                    className="btn-boost w-full disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isProcessing
                      ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                      : <>⚡ Pay {formatNaira(plan.price)}</>}
                  </button>

                  {/* Trust badge */}
                  <div className="flex items-center justify-center gap-2 text-xs text-[#525252]">
                    <ShieldCheck size={12} className="text-green-500" />
                    Secured by Paystack · Card, Bank, USSD
                  </div>

                  {/* Script loading indicator */}
                  {!scriptReady && (
                    <p className="text-xs text-center text-[#525252] animate-pulse">
                      Loading payment system…
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
