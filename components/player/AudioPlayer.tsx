'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDuration, formatCount } from '@/lib/utils';
import type { LiveTrack } from '@/types';
import {
  Play, Pause, Volume2, VolumeX, SkipForward, SkipBack,
  Share2, Heart, Download, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  track: LiveTrack;
  compact?: boolean;
  onPlay?: (trackId: string) => void;
  onShare?: (trackId: string) => void;
  onLike?: (trackId: string) => void;
  isLiked?: boolean;
  autoplay?: boolean;
}

export default function AudioPlayer({
  track,
  compact = false,
  onPlay,
  onShare,
  onLike,
  isLiked = false,
  autoplay = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration_sec ?? 0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  // Track progress for analytics
  const progressCheckpoints = useRef<Set<number>>(new Set());

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const handlers = {
      loadstart:    () => setLoading(true),
      canplay:      () => setLoading(false),
      play:         () => setIsPlaying(true),
      pause:        () => setIsPlaying(false),
      ended:        () => { setIsPlaying(false); setCurrentTime(0); },
      timeupdate:   () => {
        setCurrentTime(audio.currentTime);
        // Track 25%, 50%, 75%, 100% completion
        if (audio.duration > 0) {
          const pct = Math.floor((audio.currentTime / audio.duration) * 100);
          const checkpoints = [25, 50, 75, 100];
          checkpoints.forEach(cp => {
            if (pct >= cp && !progressCheckpoints.current.has(cp)) {
              progressCheckpoints.current.add(cp);
              trackEvent('play', pct);
            }
          });
        }
      },
      durationchange: () => setDuration(audio.duration),
      error: () => {
        setLoading(false);
        setIsPlaying(false);
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler as EventListener);
    });

    if (autoplay) togglePlay();

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler as EventListener);
      });
    };
  }, [track.audio_url]);

  const trackEvent = useCallback(async (type: 'play' | 'share' | 'like', progressPct = 0) => {
    try {
      await fetch('/api/track-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: track.id,
          event_type: type,
          source: detectSource(),
          progress_pct: progressPct,
          completed: progressPct >= 90,
        }),
      });
    } catch {}
  }, [track.id]);

  const detectSource = () => {
    if (typeof window === 'undefined') return 'direct';
    const ref = document.referrer || '';
    const url = window.location.search;
    if (url.includes('ref=whatsapp') || ref.includes('whatsapp')) return 'whatsapp';
    if (url.includes('ref=instagram') || ref.includes('instagram')) return 'instagram';
    if (url.includes('ref=tiktok') || ref.includes('tiktok')) return 'tiktok';
    if (url.includes('ref=qr')) return 'qr';
    return 'direct';
  };

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      await audio.play().catch(() => {});
      if (!hasTrackedPlay) {
        setHasTrackedPlay(true);
        trackEvent('play', 0);
        onPlay?.(track.id);
      }
    }
  }, [isPlaying, hasTrackedPlay, track.id, onPlay, trackEvent]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const v = parseFloat(e.target.value) / 100;
    setVolume(v);
    if (audio) audio.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMuted = !muted;
    setMuted(newMuted);
    audio.muted = newMuted;
  };

  const skip = (secs: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + secs));
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <audio ref={audioRef} src={track.audio_url} preload="metadata" />

        {/* Play button */}
        <button
          onClick={togglePlay}
          disabled={loading}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            'bg-green text-bg-primary hover:bg-green-glow transition-all',
            loading && 'animate-pulse',
            isPlaying && 'shadow-green-glow'
          )}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>

        {/* Mini progress */}
        <div className="flex-1 min-w-0">
          <input
            type="range" min="0" max="100" step="0.1"
            value={progressPct}
            onChange={handleProgressChange}
            className="audio-progress w-full"
          />
          <div className="flex justify-between text-xs text-text-muted mt-0.5">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>

        {/* Equalizer animation */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-5 flex-shrink-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="eq-bar" style={{ height: `${6 + i * 3}px` }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full player
  return (
    <div className="card p-6 space-y-5">
      <audio ref={audioRef} src={track.audio_url} preload="metadata" />

      {/* Track info */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={track.cover_url}
            alt={track.title}
            fill
            className="object-cover"
            sizes="64px"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-bg-primary/60 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="eq-bar" />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <Link href={`/track/${track.slug}`}>
            <h3 className="font-bold text-text-primary truncate hover:text-green transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}>
              {track.title}
            </h3>
          </Link>
          <Link href={`/artist/${track.artist_slug}`}
            className="text-sm text-text-muted hover:text-green transition-colors truncate block">
            {track.artist_name}
          </Link>
          <span className="badge-genre text-xs mt-1">{track.genre}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <input
          ref={progressRef}
          type="range" min="0" max="100" step="0.1"
          value={progressPct}
          onChange={handleProgressChange}
          className="audio-progress w-full"
          style={{
            background: `linear-gradient(to right, #22C55E ${progressPct}%, #2A2A2A ${progressPct}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-text-muted">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>{formatDuration(Math.floor(duration))}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => skip(-10)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlay}
            disabled={loading}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'bg-green text-bg-primary hover:bg-green-glow',
              'transition-all duration-200 active:scale-95',
              loading && 'animate-pulse',
              isPlaying && 'shadow-green-glow'
            )}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
              : isPlaying
                ? <Pause size={20} fill="currentColor" />
                : <Play size={20} fill="currentColor" className="translate-x-0.5" />
            }
          </button>

          <button onClick={() => skip(10)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
            <SkipForward size={16} />
          </button>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={toggleMute}
            className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
            {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range" min="0" max="100" step="1"
            value={muted ? 0 : Math.round(volume * 100)}
            onChange={handleVolumeChange}
            className="audio-progress w-20"
            style={{
              background: `linear-gradient(to right, #22C55E ${muted ? 0 : volume * 100}%, #2A2A2A ${muted ? 0 : volume * 100}%)`,
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { onLike?.(track.id); trackEvent('like'); }}
            className={cn(
              'p-2 rounded-lg transition-all',
              isLiked ? 'text-red-400 bg-red-950/50' : 'text-text-muted hover:text-red-400 hover:bg-bg-elevated'
            )}
          >
            <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => { onShare?.(track.id); trackEvent('share'); }}
            className="p-2 rounded-lg text-text-muted hover:text-green hover:bg-bg-elevated transition-all">
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-1 border-t border-bg-border/50">
        <span className="text-xs text-text-muted">{formatCount(track.play_count)} plays</span>
        <span className="text-xs text-text-muted">{formatCount(track.like_count)} likes</span>
        <span className="text-xs text-text-muted">{formatCount(track.share_count)} shares</span>
        {track.boost_multiplier > 1 && (
          <span className="badge-boost ml-auto">⚡ Boosted</span>
        )}
      </div>
    </div>
  );
}
