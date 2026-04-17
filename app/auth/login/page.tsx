'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Wrong email or password' : error.message);
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-16 pb-12">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-green/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
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
          <p className="text-text-muted text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="card p-8 space-y-5">
          <div>
            <label className="label">Email</label>
            <input
              type="email" className="input" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label mb-0">Password</label>
              <Link href="/auth/reset" className="text-xs text-green hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} className="input pr-10"
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} autoComplete="current-password" required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
          </button>

          <p className="text-center text-sm text-text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-green hover:underline font-semibold">
              Create one free
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
