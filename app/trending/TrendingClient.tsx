'use client';

import { useState, useCallback } from 'react';
import type { LiveTrack } from '@/types';
import TrackCard from '@/components/ui/TrackCard';
import AudioPlayer from '@/components/player/AudioPlayer';
import ShareModal from '@/components/ui/ShareModal';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Tab = 'trending' | 'new' | 'rising';

const TABS: { id: Tab; label: string; icon: typeof TrendingUp; desc: string }[] = [
  { id: 'trending', label: 'Trending',  icon: TrendingUp, desc: 'Ranked by plays × shares × boosts' },
  { id: 'new',      label: 'New Drops', icon: Clock,      desc: 'Most recent releases' },
  { id: 'rising',   label: '🔥 Rising', icon: Flame,      desc: 'Gaining momentum fast (last 72h)' },
];

interface Props {
  initialTrending: LiveTrack[];
  initialNewDrops: LiveTrack[];
  initialRising:   LiveTrack[];
}

export default function TrendingClient({ initialTrending, initialNewDrops, initialRising }: Props) {
  const supabase = createClient();
  const [tab,        setTab]        = useState<Tab>('trending');
  const [playing,    setPlaying]    = useState<LiveTrack | null>(null);
  const [likedIds,   setLikedIds]   = useState<Set<string>>(new Set());
  const [shareTrack, setShare]      = useState<LiveTrack | null>(null);
  const [viewMode,   setViewMode]   = useState<'grid' | 'list'>('list');

  const trackMap: Record<Tab, LiveTrack[]> = {
    trending: initialTrending,
    new:      initialNewDrops,
    rising:   initialRising,
  };

  const handleLike = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/auth/login'; return; }
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        supabase.from('likes').delete().match({ user_id: user.id, track_id: id }).then(() => {});
      } else {
        next.add(id);
        supabase.from('likes').insert({ user_id: user.id, track_id: id }).then(() => {});
      }
      return next;
    });
  }, [supabase]);

  const currentTracks = trackMap[tab];
  const activeTabMeta = TABS.find(t => t.id === tab)!;

  return (
    <main className="min-h-screen pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}>
            Trending Now
          </h1>
          <p className="text-text-secondary">
            {activeTabMeta.desc} · Updated every 30 seconds
          </p>
        </div>

        {/* Tabs + view toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-bg-elevated border border-bg-border">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  tab === id ? 'bg-green text-bg-primary shadow-green-glow' : 'text-text-secondary hover:text-text-primary',
                )} style={{ fontFamily: "'Syne', sans-serif" }}>
                <Icon size={14} /> {label}
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === id ? 'bg-bg-primary/20' : 'bg-bg-border')}>
                  {trackMap[id].length}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-elevated border border-bg-border">
            {(['grid', 'list'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === m ? 'bg-green text-bg-primary' : 'text-text-muted hover:text-text-primary')}>
                {m === 'grid' ? '⊞ Grid' : '≡ List'}
              </button>
            ))}
          </div>
        </div>

        {/* Rising: empty state */}
        {tab === 'rising' && currentTracks.length === 0 && (
          <div className="text-center py-20 card">
            <p className="text-4xl mb-4">🔥</p>
            <p className="text-text-secondary font-semibold mb-2">No rising tracks yet today</p>
            <p className="text-text-muted text-sm mb-6">New tracks uploaded in the last 72 hours will appear here as they gain traction.</p>
            <Link href="/upload" className="btn-primary">Upload Your Track</Link>
          </div>
        )}

        {/* Grid mode */}
        {viewMode === 'grid' && currentTracks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {currentTracks.map((track, i) => (
              <TrackCard key={track.id} track={track}
                rank={tab === 'trending' ? i + 1 : undefined}
                onPlay={() => setPlaying(p => p?.id === track.id ? null : track)}
                isPlaying={playing?.id === track.id}
                isLiked={likedIds.has(track.id)}
                onLike={handleLike}
                onShare={() => setShare(track)}
              />
            ))}
          </div>
        )}

        {/* List mode */}
        {viewMode === 'list' && currentTracks.length > 0 && (
          <div className="card overflow-hidden">
            {currentTracks.map((track, i) => (
              <TrackCard key={track.id} track={track}
                rank={i + 1}
                variant="list"
                onPlay={() => setPlaying(p => p?.id === track.id ? null : track)}
                isPlaying={playing?.id === track.id}
                isLiked={likedIds.has(track.id)}
                onLike={handleLike}
                onShare={() => setShare(track)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky mini-player */}
      {playing && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-bg-border bg-bg-primary/96 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <AudioPlayer track={playing} compact
              isLiked={likedIds.has(playing.id)}
              onLike={handleLike}
              onShare={() => setShare(playing)}
            />
          </div>
        </div>
      )}

      {shareTrack && <ShareModal track={shareTrack} onClose={() => setShare(null)} />}
    </main>
  );
}
