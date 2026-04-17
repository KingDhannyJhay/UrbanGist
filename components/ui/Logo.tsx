'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Waveform UG Icon ──────────────────────────────────────────────────────
// Premium animated SVG with equalizer bars forming "UG" silhouette
interface IconProps {
  size?: number;
  animated?: boolean;
  glowing?: boolean;
  className?: string;
}

export function UGIcon({ size = 36, animated = false, glowing = false, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      aria-label="UrbanGist icon"
      role="img"
    >
      <defs>
        <linearGradient id="ugGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
        <filter id="ugGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="#052E16" />
      <rect width="40" height="40" rx="10" fill="url(#ugGrad)" fillOpacity="0.12" />

      {/* Waveform bars — 7 bars forming stylised "UG" shape */}
      {/* Left group: U shape (bars going down then up) */}
      <rect
        x="5" y="18" width="3" height="14" rx="1.5"
        fill="url(#ugGrad)"
        style={animated ? { animation: 'eqBar1 0.7s ease-in-out infinite alternate' } : undefined}
      />
      <rect
        x="10" y="24" width="3" height="8" rx="1.5"
        fill="url(#ugGrad)"
        style={animated ? { animation: 'eqBar2 0.9s ease-in-out infinite alternate' } : undefined}
      />
      <rect
        x="15" y="20" width="3" height="12" rx="1.5"
        fill="url(#ugGrad)"
        style={animated ? { animation: 'eqBar3 0.6s ease-in-out infinite alternate' } : undefined}
      />

      {/* Divider dot */}
      <circle cx="20.5" cy="29" r="1.5" fill="url(#ugGrad)" opacity="0.5" />

      {/* Right group: G shape (tall, medium-tall, with notch) */}
      <rect
        x="23" y="10" width="3" height="22" rx="1.5"
        fill="url(#ugGrad)"
        style={animated ? { animation: 'eqBar4 0.8s ease-in-out infinite alternate' } : undefined}
      />
      <rect
        x="28" y="16" width="3" height="16" rx="1.5"
        fill="url(#ugGrad)"
        style={animated ? { animation: 'eqBar5 1.0s ease-in-out infinite alternate' } : undefined}
      />
      <rect
        x="28" y="22" width="5" height="2.5" rx="1.25"
        fill="url(#ugGrad)"
      />

      {/* Top accent line */}
      <rect x="5" y="8" width="30" height="1.5" rx="0.75" fill="url(#ugGrad)" opacity="0.3" />

      {/* Glow overlay when enabled */}
      {glowing && (
        <rect width="40" height="40" rx="10" fill="url(#ugGrad)" fillOpacity="0.08"
          filter="url(#ugGlow)" />
      )}

      <style>{`
        @keyframes eqBar1 { from { height: 14px; y: 18px; } to { height: 20px; y: 12px; } }
        @keyframes eqBar2 { from { height: 8px;  y: 24px; } to { height: 16px; y: 16px; } }
        @keyframes eqBar3 { from { height: 12px; y: 20px; } to { height: 22px; y: 10px; } }
        @keyframes eqBar4 { from { height: 22px; y: 10px; } to { height: 16px; y: 16px; } }
        @keyframes eqBar5 { from { height: 16px; y: 16px; } to { height: 24px; y: 8px;  } }
      `}</style>
    </svg>
  );
}

// ─── Full Wordmark (Icon + Typography) ────────────────────────────────────
interface LogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  glowing?: boolean;
  href?: string | null;
  className?: string;
}

const SIZE_MAP = {
  sm:  { icon: 28, text: 'text-base',  gap: 'gap-2' },
  md:  { icon: 36, text: 'text-xl',    gap: 'gap-2.5' },
  lg:  { icon: 44, text: 'text-2xl',   gap: 'gap-3' },
  xl:  { icon: 56, text: 'text-3xl',   gap: 'gap-4' },
};

export function Logo({
  variant = 'full',
  size = 'md',
  animated = false,
  glowing = false,
  href = '/',
  className,
}: LogoProps) {
  const { icon: iconSize, text: textSize, gap } = SIZE_MAP[size];

  const inner = (
    <span className={cn(
      'inline-flex items-center group',
      gap,
      glowing && 'drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]',
      className,
    )}>
      {/* Icon */}
      {(variant === 'full' || variant === 'icon') && (
        <UGIcon
          size={iconSize}
          animated={animated}
          glowing={glowing}
          className={cn(
            'transition-transform duration-300',
            href && 'group-hover:scale-110',
          )}
        />
      )}

      {/* Typography */}
      {(variant === 'full' || variant === 'wordmark') && (
        <span
          className={cn(
            'font-black tracking-tight leading-none select-none',
            textSize,
          )}
          style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
        >
          <span className="text-text-primary transition-colors duration-200">Urban</span>
          <span
            className="transition-colors duration-200"
            style={{
              background: 'linear-gradient(135deg, #22C55E, #4ADE80)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Gist
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green rounded-lg">
      {inner}
    </Link>
  );
}

// ─── Loading Screen Logo (large, pulsing) ─────────────────────────────────
export function LoadingLogo({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Outer glow ring */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-green/20 blur-xl animate-pulse scale-125" />
        <div className="relative animate-float">
          <UGIcon size={72} animated glowing />
        </div>
      </div>

      {/* Wordmark */}
      <span
        className="text-2xl font-black tracking-tight"
        style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
      >
        <span className="text-text-primary">Urban</span>
        <span style={{
          background: 'linear-gradient(135deg, #22C55E, #4ADE80)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Gist
        </span>
      </span>

      {/* Animated equalizer */}
      <div className="flex items-end gap-1 h-6">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-green"
            style={{
              height: `${10 + Math.sin(i * 1.2) * 8}px`,
              animation: `equalizer ${0.5 + i * 0.1}s ease-in-out ${i * 0.08}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <p className="text-sm text-text-muted animate-pulse">{message}</p>
    </div>
  );
}

// ─── Favicon SVG (inline, used in <head>) ─────────────────────────────────
export function FaviconSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0B0B0B" />
      <rect width="40" height="40" rx="10" fill="#22C55E" fillOpacity="0.15" />
      <rect x="5"  y="18" width="3" height="14" rx="1.5" fill="#22C55E" />
      <rect x="10" y="24" width="3" height="8"  rx="1.5" fill="#22C55E" />
      <rect x="15" y="20" width="3" height="12" rx="1.5" fill="#22C55E" />
      <circle cx="20.5" cy="29" r="1.5" fill="#22C55E" opacity="0.5" />
      <rect x="23" y="10" width="3" height="22" rx="1.5" fill="#4ADE80" />
      <rect x="28" y="16" width="3" height="16" rx="1.5" fill="#4ADE80" />
      <rect x="28" y="22" width="5" height="2.5" rx="1.25" fill="#4ADE80" />
    </svg>
  );
}

// ─── Player Watermark (subtle, small) ─────────────────────────────────────
export function PlayerWatermark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 opacity-30 hover:opacity-60 transition-opacity', className)}>
      <UGIcon size={14} />
      <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase"
            style={{ fontFamily: "'Syne', sans-serif" }}>
        UrbanGist
      </span>
    </div>
  );
}
