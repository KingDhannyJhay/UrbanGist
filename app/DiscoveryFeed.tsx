'use client';

import { useState, useCallback } from 'react';
import type { LiveTrack } from '@/types';
import TrackCard from '@/components/ui/TrackCard';
import AudioPlayer from '@/components/player/AudioPlayer';
import ShareModal from '@/components/ui/ShareModal';
import { TrendingUp, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface DiscoveryFeedProps {
  initialTrending: LiveTrack[];
  initialNewDrops: LiveTrack[];
  initialRising: LiveTrack[];
}

const TABS = [
  { id: 'trending', label: 'Trending',   icon: TrendingUp },
  { id: 'new',      label: 'New Drops',  icon: Clock },
  { id: 'rising',   label: 'Rising',     icon: Flame },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function DiscoveryFeed({ initialTrending, initialNewDrops, initialRising }: DiscoveryFeedProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabId>('trending');
  const [playingTrack, setPlayingTrack] = useState<LiveTrack | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [shareTrack, setShareTrack] = useState<LiveTrack | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const tracks: Record<TabId, LiveTrack[]> = {
    trending: initialTrending,
    new:      initialNewDrops,
    rising:   initialRising,
  };

  const handlePlay = useCallback((track: LiveTrack) => {
    setPlayingTrack(prev => prev?.id === track.id ? null : track);
  }, []);

  const handleLike = useCallback(async (trackId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/auth/login'; return; }

    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
        supabase.from('likes').delete().match({ user_id: user.id, track_id: trackId }).then(() => {});
      } else {
        next.add(trackId);
        supabase.from('likes').insert({ user_id: user.id, track_id: trackId }).then(() => {});
      }
      return next;
    });
  }, [supabase]);

  const handleShare = useCallback((trackId: string) => {
    const track = [...initialTrending, ...initialNewDrops, ...initialRising].find(t => t.id === trackId);
    if (track) setShareTrack(track);
  }, [initialTrending, initialNewDrops, initialRising]);

  const currentTracks = tracks[activeTab];

  return (
    <section id="trending" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="section-title text-2xl sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
              Discover Music
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Updated in real-time based on plays, shares, and boosts
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-elevated border border-bg-border">
            {(['grid', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewMode === mode
                    ? 'bg-green text-bg-primary'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {mode === 'grid' ? '⊞ Grid' : '≡ List'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-bg-elevated border border-bg-border w-fit mb-8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                activeTab === id
                  ? 'bg-green text-bg-primary shadow-green-glow'
                  : 'text-text-secondary hover:text-text-primary'
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Icon size={14} />
              {label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === id ? 'bg-bg-primary/20' : 'bg-bg-border'
              )}>
                {tracks[id].length}
              </span>
            </button>
          ))}
        </div>

        {/* Grid / List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {currentTracks.map((track, i) => (
              <TrackCard
                key={track.id}
                track={track}
                rank={activeTab === 'trending' ? i + 1 : undefined}
                onPlay={() => handlePlay(track)}
                isPlaying={playingTrack?.id === track.id}
                isLiked={likedIds.has(track.id)}
                onLike={handleLike}
                onShare={handleShare}
              />
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            {currentTracks.map((track, i) => (
              <TrackCard
                key={track.id}
                track={track}
                rank={i + 1}
                variant="list"
                onPlay={() => handlePlay(track)}
                isPlaying={playingTrack?.id === track.id}
                isLiked={likedIds.has(track.id)}
                onLike={handleLike}
                onShare={handleShare}
              />
            ))}
          </div>
        )}

        {currentTracks.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated mx-auto mb-4 flex items-center justify-center text-3xl">
              🎵
            </div>
            <p className="text-text-secondary">No tracks yet. Be the first to upload!</p>
          </div>
        )}
      </div>

      {/* Sticky mini-player */}
      {playingTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-bg-border bg-bg-primary/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <AudioPlayer
              track={playingTrack}
              compact
              isLiked={likedIds.has(playingTrack.id)}
              onLike={handleLike}
              onShare={() => setShareTrack(playingTrack)}
            />
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareTrack && (
        <ShareModal
          track={shareTrack}
          onClose={() => setShareTrack(null)}
        />
      )}
    </section>
  );
}
