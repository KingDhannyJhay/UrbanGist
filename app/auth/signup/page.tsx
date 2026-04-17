'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-10 max-w-sm w-full text-center">
          <CheckCircle2 size={48} className="text-green mx-auto mb-4" />
          <h2 className="text-xl font-black text-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Check your email!
          </h2>
          <p className="text-text-muted text-sm mb-6">
            We sent a confirmation link to <strong className="text-text-primary">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="btn-primary w-full">Back to Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-16 pb-12">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-green/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-green flex items-center justify-center text-bg-primary font-black text-lg shadow-green-glow"
                 style={{ fontFamily: 'var(--font-display)' }}>
              UG
            </div>
            <span className="text-2xl font-black text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
              Urban<span className="text-green">Gist</span>
            </span>
          </Link>
          <p className="text-text-muted text-sm mt-2">Create your free artist account</p>
        </div>

        <form onSubmit={handleSignup} className="card p-8 space-y-5">
          <div>
            <label className="label">Artist / Display Name</label>
            <input type="text" className="input" placeholder="Your name or stage name"
              value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="input pr-10"
                placeholder="Min. 8 characters" value={password}
                onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-text-muted">
            By signing up you agree to our{' '}
            <Link href="/terms" className="text-green hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-green hover:underline">Privacy Policy</Link>.
          </p>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : 'Create Free Account'}
          </button>

          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green hover:underline font-semibold">Sign in</Link>
          </p>
        </form>

        {/* Benefits */}
        <div className="mt-6 space-y-2">
          {['Upload unlimited tracks', 'Real-time analytics dashboard', 'QR code for every track', 'Boost system from ₦1,000'].map(b => (
            <div key={b} className="flex items-center gap-2.5 text-sm text-text-muted">
              <CheckCircle2 size={13} className="text-green flex-shrink-0" /> {b}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
