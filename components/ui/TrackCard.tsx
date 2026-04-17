'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { LiveTrack } from '@/types';
import { formatCount, timeAgo, cn } from '@/lib/utils';
import { Play, Pause, Heart, Share2, Zap, BadgeCheck } from 'lucide-react';

interface TrackCardProps {
  track: LiveTrack;
  rank?: number;
  onPlay?: (track: LiveTrack) => void;
  isPlaying?: boolean;
  isLiked?: boolean;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  variant?: 'default' | 'featured' | 'list';
}

export default function TrackCard({
  track,
  rank,
  onPlay,
  isPlaying = false,
  isLiked = false,
  onLike,
  onShare,
  variant = 'default',
}: TrackCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (variant === 'list') {
    return (
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-bg-elevated transition-all duration-200 group">
        {/* Rank */}
        {rank && (
          <span className="w-6 text-center text-sm font-mono font-bold text-text-muted group-hover:text-text-secondary">
            {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
          </span>
        )}

        {/* Cover */}
        <button
          onClick={() => onPlay?.(track)}
          className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0"
        >
          <Image
            src={track.cover_url}
            alt={track.title}
            fill
            sizes="44px"
            className="object-cover"
          />
          <div className={cn(
            'absolute inset-0 bg-bg-primary/60 flex items-center justify-center transition-opacity',
            isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            {isPlaying
              ? <div className="flex items-end gap-0.5 h-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="eq-bar" style={{ height: `${4 + i * 2}px` }} />
                  ))}
                </div>
              : <Play size={14} fill="white" className="text-white translate-x-0.5" />
            }
          </div>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/track/${track.slug}`}
            className="text-sm font-semibold text-text-primary hover:text-green transition-colors truncate block">
            {track.title}
          </Link>
          <Link href={`/artist/${track.artist_slug}`}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1">
            {track.artist_name}
            {track.artist_verified && <BadgeCheck size={11} className="text-green flex-shrink-0" />}
          </Link>
        </div>

        {/* Genre */}
        <span className="hidden sm:inline badge-genre text-xs">{track.genre}</span>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-3 text-xs text-text-muted">
          <span>{formatCount(track.play_count)}</span>
        </div>

        {/* Boost badge */}
        {track.boost_multiplier > 1 && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-purple">
            <Zap size={11} /> Boosted
          </span>
        )}

        {/* Like */}
        <button
          onClick={() => onLike?.(track.id)}
          className={cn(
            'p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100',
            isLiked ? 'text-red-400 opacity-100' : 'text-text-muted hover:text-red-400'
          )}
        >
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="relative overflow-hidden rounded-2xl group cursor-pointer aspect-square"
           onClick={() => onPlay?.(track)}>
        <Image
          src={track.cover_url}
          alt={track.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent" />

        {/* Boost indicator */}
        {track.boost_multiplier > 1 && (
          <div className="absolute top-3 right-3 badge-boost text-xs">
            <Zap size={10} /> Featured
          </div>
        )}

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300',
            'bg-green text-bg-primary',
            isPlaying
              ? 'opacity-100 shadow-green-glow scale-110'
              : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
          )}>
            {isPlaying
              ? <Pause size={22} fill="currentColor" />
              : <Play size={22} fill="currentColor" className="translate-x-0.5" />
            }
          </div>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-bold text-text-primary text-lg leading-tight truncate"
             style={{ fontFamily: 'var(--font-display)' }}>
            {track.title}
          </p>
          <p className="text-sm text-text-secondary truncate mt-0.5">{track.artist_name}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge-genre text-xs">{track.genre}</span>
            <span className="text-xs text-text-muted">{formatCount(track.play_count)} plays</span>
          </div>
        </div>
      </div>
    );
  }

  // Default card
  return (
    <div className={cn(
      'card group cursor-pointer overflow-hidden',
      'hover:-translate-y-1 transition-all duration-300'
    )}>
      {/* Cover image */}
      <div className="relative aspect-square overflow-hidden"
           onClick={() => onPlay?.(track)}>
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        <Image
          src={track.cover_url}
          alt={track.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            'object-cover transition-all duration-700',
            'group-hover:scale-105',
            imgLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImgLoaded(true)}
        />

        {/* Play overlay */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center bg-bg-primary/40',
          'transition-opacity duration-300',
          isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            'bg-green text-bg-primary shadow-green-glow',
            'transition-transform duration-200',
            isPlaying ? 'scale-100' : 'scale-90 group-hover:scale-100'
          )}>
            {isPlaying
              ? <Pause size={18} fill="currentColor" />
              : <Play size={18} fill="currentColor" className="translate-x-0.5" />
            }
          </div>
        </div>

        {/* Boost badge */}
        {track.boost_multiplier > 1 && (
          <div className="absolute top-2.5 left-2.5 badge-boost text-xs px-2 py-0.5">
            <Zap size={9} /> Boosted
          </div>
        )}

        {/* Rank */}
        {rank && rank <= 3 && (
          <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center text-sm">
            {['🥇','🥈','🥉'][rank - 1]}
          </div>
        )}

        {/* EQ when playing */}
        {isPlaying && (
          <div className="absolute bottom-3 left-3 flex items-end gap-0.5 h-5">
            {[...Array(5)].map((_, i) => <div key={i} className="eq-bar" />)}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3.5">
        <Link href={`/track/${track.slug}`}
          className="block font-bold text-text-primary text-sm truncate hover:text-green transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}>
          {track.title}
        </Link>
        <Link href={`/artist/${track.artist_slug}`}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors mt-0.5">
          <span className="truncate">{track.artist_name}</span>
          {track.artist_verified && <BadgeCheck size={11} className="text-green flex-shrink-0" />}
        </Link>

        <div className="flex items-center justify-between mt-3">
          <span className="badge-genre">{track.genre}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onLike?.(track.id); }}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                isLiked ? 'text-red-400' : 'text-text-muted hover:text-red-400'
              )}
            >
              <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare?.(track.id); }}
              className="p-1.5 rounded-lg text-text-muted hover:text-green transition-all">
              <Share2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          <span>{formatCount(track.play_count)} plays</span>
          <span className="ml-auto">{timeAgo(track.published_at ?? track.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
