'use client';

import { useState, useCallback } from 'react';
import type { LiveTrack } from '@/types';
import TrackCard from '@/components/ui/TrackCard';
import AudioPlayer from '@/components/player/AudioPlayer';
import ShareModal from '@/components/ui/ShareModal';
import { createClient } from '@/lib/supabase/client';

export default function ArtistPageClient({ tracks }: { tracks: LiveTrack[] }) {
  const supabase = createClient();
  const [playing, setPlaying]     = useState<LiveTrack | null>(null);
  const [likedIds, setLikedIds]   = useState<Set<string>>(new Set());
  const [shareTrack, setShare]    = useState<LiveTrack | null>(null);

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

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24">
        {tracks.map(track => (
          <TrackCard
            key={track.id}
            track={track}
            onPlay={() => setPlaying(p => p?.id === track.id ? null : track)}
            isPlaying={playing?.id === track.id}
            isLiked={likedIds.has(track.id)}
            onLike={handleLike}
            onShare={() => setShare(track)}
          />
        ))}
      </div>

      {/* Sticky mini-player */}
      {playing && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-bg-border bg-bg-primary/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <AudioPlayer
              track={playing} compact
              isLiked={likedIds.has(playing.id)}
              onLike={handleLike}
              onShare={() => setShare(playing)}
            />
          </div>
        </div>
      )}

      {shareTrack && <ShareModal track={shareTrack} onClose={() => setShare(null)} />}
    </>
  );
}
