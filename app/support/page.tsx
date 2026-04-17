'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Heart, Zap, Music2, BookOpen, Shield, CheckCircle2, Loader2, Coffee, Upload } from 'lucide-react';

const AMOUNTS = [500, 1000, 2000, 5000];
const USES = [
  { icon: Shield,   t: 'Keep servers running — hosting, database, and CDN costs' },
  { icon: Music2,   t: 'Fund artist discovery features and recommendation systems' },
  { icon: BookOpen, t: 'Create more free artist guides and educational content' },
  { icon: Zap,      t: 'Improve platform speed, search, and analytics tools' },
  { icon: Heart,    t: 'Support the indie team building this for African music culture' },
];

export default function SupportPage() {
  const [amount,  setAmount]  = useState(1000);
  const [custom,  setCustom]  = useState('');
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const finalAmount = custom ? (parseInt(custom, 10) || 0) : amount;

  const handleSupport = async () => {
    if (!email) { alert('Please enter your email to continue.'); return; }
    if (finalAmount < 100) { alert('Minimum support amount is ₦100.'); return; }
    setLoading(true);

    const ref = `UG-SUPPORT-${Date.now().toString(36).toUpperCase()}`;
    const PaystackPop = (window as Record<string,unknown>).PaystackPop as {
      setup: (cfg: Record<string,unknown>) => { openIframe: () => void };
    };

    if (!PaystackPop) {
      alert('Payment system not ready. Please try again in a moment.');
      setLoading(false);
      return;
    }

    const handler = PaystackPop.setup({
      key:      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email, amount: finalAmount * 100, currency: 'NGN', ref,
      metadata: { name: name || 'Anonymous', type: 'support_donation' },
      onSuccess: () => { setSuccess(true); setLoading(false); },
      onCancel:  () => setLoading(false),
    });
    handler.openIframe();
  };

  return (
    <>
      <script src="https://js.paystack.co/v1/inline.js" async />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <Logo variant="icon" size="lg" href={null} animated glowing className="mx-auto mb-6" />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green/20 bg-green-subtle text-green text-sm font-semibold mb-6">
              <Heart size={13} /> Support UrbanGist
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-5 leading-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              Help Us Keep<br />African Music Alive
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              UrbanGist is an independent platform built for African artists. Your support helps us stay online, improve features, and create free resources for upcoming musicians.
            </p>
          </div>

          {success ? (
            <div className="max-w-md mx-auto card p-10 text-center">
              <CheckCircle2 size={56} className="text-green mx-auto mb-4" />
              <h2 className="text-2xl font-black text-text-primary mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Thank You! ♥</h2>
              <p className="text-text-secondary mb-6">
                Your support of <strong className="text-green">₦{finalAmount.toLocaleString()}</strong> goes directly into keeping UrbanGist running for African artists.
              </p>
              <Link href="/" className="btn-primary w-full">Back to UrbanGist</Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-10">

              {/* Why support */}
              <div>
                <h2 className="text-xl font-black text-text-primary mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Why Your Support Matters
                </h2>
                <p className="text-text-secondary mb-5 leading-relaxed">
                  UrbanGist is free for artists to upload, free for listeners to enjoy, and free for anyone to learn from. Every naira you contribute helps us:
                </p>
                <div className="space-y-3 mb-8">
                  {USES.map(({ icon: Icon, t }) => (
                    <div key={t} className="flex items-start gap-3 p-4 rounded-xl bg-bg-elevated border border-bg-border">
                      <div className="w-8 h-8 rounded-lg bg-green-subtle border border-green/20 flex items-center justify-center text-green flex-shrink-0">
                        <Icon size={13} />
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">{t}</p>
                    </div>
                  ))}
                </div>
                <blockquote className="border-l-4 border-green pl-5 py-3 italic text-text-secondary text-sm leading-relaxed"
                  style={{ background: 'rgba(34,197,94,0.04)', borderRadius: '0 8px 8px 0' }}>
                  &ldquo;The next Burna Boy or Tems is out there right now — recording in a room with just a mic and a dream. UrbanGist is where they get their first break.&rdquo;
                  <br /><span className="text-green font-semibold not-italic">— UrbanGist Team</span>
                </blockquote>
              </div>

              {/* Donation widget */}
              <div>
                <div className="card p-8 space-y-5">
                  <div className="flex items-center gap-2 text-green text-sm font-semibold">
                    <Coffee size={14} /> Make a Contribution
                  </div>
                  <h3 className="text-xl font-black text-text-primary" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Choose an amount
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {AMOUNTS.map(a => (
                      <button key={a} onClick={() => { setAmount(a); setCustom(''); }}
                        className={`py-3.5 rounded-xl text-sm font-bold transition-all border-2 ${
                          amount === a && !custom
                            ? 'border-green bg-green text-bg-primary shadow-green-glow'
                            : 'border-bg-border bg-bg-elevated text-text-secondary hover:border-green/40'
                        }`}>
                        ₦{a.toLocaleString()}
                        {a === 1000 && <span className="block text-[10px] mt-0.5 opacity-70">Most popular</span>}
                        {a === 5000 && <span className="block text-[10px] mt-0.5 opacity-70">Superfan 🔥</span>}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="label">Or enter a custom amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₦</span>
                      <input type="number" min="100" className="input pl-8" placeholder="e.g. 3000"
                        value={custom} onChange={e => { setCustom(e.target.value); setAmount(0); }} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label">Your Name (optional)</label>
                      <input className="input" placeholder="How should we thank you?"
                        value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Email Address *</label>
                      <input type="email" className="input" placeholder="for payment receipt"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>

                  <button onClick={handleSupport} disabled={loading || finalAmount < 100} className="btn-primary w-full py-4">
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Processing…</>
                      : <><Heart size={15} /> Support with ₦{finalAmount.toLocaleString()}</>}
                  </button>

                  <div className="text-center space-y-1">
                    <p className="text-xs text-text-muted">Secured by Paystack · One-time · No subscriptions</p>
                    <p className="text-xs text-text-muted">100% goes towards platform costs and development</p>
                  </div>
                </div>

                <div className="mt-5 card p-5">
                  <p className="text-sm font-semibold text-text-primary mb-3">Other ways to support:</p>
                  <ul className="space-y-2 text-xs text-text-muted">
                    <li>🎵 <Link href="/upload" className="text-green hover:underline">Upload your music</Link> and grow our catalogue</li>
                    <li>📢 Share UrbanGist with fellow artists and producers</li>
                    <li>⚡ <Link href="/boost" className="text-green hover:underline">Boost your tracks</Link> to fuel discovery</li>
                    <li>🌟 Follow us on Instagram and Twitter <strong className="text-text-secondary">@UrbanGist</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
