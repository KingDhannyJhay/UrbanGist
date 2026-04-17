'use client';

import { useEffect, useState } from 'react';
import { LoadingLogo } from '@/components/ui/Logo';

interface LoadingScreenProps {
  message?: string;
  minDuration?: number; // ms to show before hiding
}

export default function LoadingScreen({
  message = 'Loading UrbanGist…',
  minDuration = 1200,
}: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading]   = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 400);
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg-primary transition-opacity duration-400"
      style={{ opacity: fading ? 0 : 1 }}
      aria-live="polite"
      aria-label="Loading UrbanGist"
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-green/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple/5 blur-[100px] animate-pulse"
             style={{ animationDelay: '0.8s' }} />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.02]"
             style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* Center content */}
      <div className="relative flex flex-col items-center">
        <LoadingLogo message={message} />

        {/* Bottom tagline */}
        <p className="absolute top-full mt-10 text-xs text-text-muted tracking-[0.2em] uppercase"
           style={{ fontFamily: "'Syne', sans-serif" }}>
          Discover African Music
        </p>
      </div>
    </div>
  );
}

// ─── Page-level spinner (smaller, inline) ──────────────────────
export function PageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-2xl bg-green/10 animate-ping" />
        <div className="relative w-12 h-12 rounded-2xl bg-green-subtle border border-green/20 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}

// ─── Skeleton card set ──────────────────────────────────────────
export function TrackCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square bg-bg-elevated" />
      <div className="p-3.5 space-y-2">
        <div className="h-3.5 bg-bg-elevated rounded-lg w-4/5" />
        <div className="h-3 bg-bg-elevated rounded-lg w-3/5" />
        <div className="flex justify-between mt-3">
          <div className="h-5 bg-bg-elevated rounded-full w-16" />
          <div className="h-5 bg-bg-elevated rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}
