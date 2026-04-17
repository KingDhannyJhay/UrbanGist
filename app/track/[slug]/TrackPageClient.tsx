'use client';

import { useState } from 'react';
import type { LiveTrack } from '@/types';
import AudioPlayer from '@/components/player/AudioPlayer';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';
import ShareModal from '@/components/ui/ShareModal';
import { buildShareUrl, trackUrl } from '@/lib/utils';
import { Share2, QrCode, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Props {
  track: LiveTrack;
  related: LiveTrack[];
}

type PanelTab = 'player' | 'qr' | 'share';

export default function TrackPageClient({ track }: Props) {
  const supabase = createClient();
  const [activePanel, setActivePanel] = useState<PanelTab>('player');
  const [isLiked, setIsLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleLike = async (trackId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Sign in to like tracks'); return; }

    if (isLiked) {
      await supabase.from('likes').delete().match({ user_id: user.id, track_id: trackId });
      setIsLiked(false);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, track_id: trackId });
      setIsLiked(true);
      toast.success('Added to your likes!');
    }
  };

  const panelTabs: { id: PanelTab; label: string; icon: typeof Share2 }[] = [
    { id: 'player', label: 'Player', icon: Link },
    { id: 'qr',     label: 'QR Code', icon: QrCode },
    { id: 'share',  label: 'Share', icon: Share2 },
  ];

  const trackShareUrl = buildShareUrl(track.slug, 'qr');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8 items-start">

        {/* Left — tabbed panel */}
        <div className="card overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-bg-border">
            {panelTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all border-b-2',
                  activePanel === id
                    ? 'border-green text-green bg-green-subtle/30'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="p-6">
            {activePanel === 'player' && (
              <AudioPlayer
                track={track}
                isLiked={isLiked}
                onLike={handleLike}
                onShare={() => setShowShareModal(true)}
              />
            )}

            {activePanel === 'qr' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-sm text-text-secondary text-center max-w-xs">
                  Share this QR code on your social media, flyers, or events. Anyone who scans it will be taken to this track.
                </p>
                <QRCodeDisplay
                  value={trackShareUrl}
                  trackTitle={track.title}
                  artistName={track.artist_name}
                  size={180}
                  showDownload
                />
              </div>
            )}

            {activePanel === 'share' && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-text-secondary text-center">Share this track across platforms</p>

                {/* Quick share link */}
                <div className="p-3 rounded-xl bg-bg-elevated border border-bg-border flex items-center gap-3">
                  <code className="flex-1 text-xs text-green truncate font-mono">
                    {trackUrl(track.slug)}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(trackUrl(track.slug));
                      toast.success('Link copied!');
                    }}
                    className="text-xs btn-secondary px-3 py-1.5"
                  >
                    Copy
                  </button>
                </div>

                {/* Platform share buttons */}
                {[
                  { label: '📱 WhatsApp',   source: 'whatsapp',   color: 'bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]' },
                  { label: '🐦 Twitter / X', source: 'twitter',    color: 'bg-blue-950/50 border-blue-500/30 text-blue-400' },
                  { label: '📸 Instagram Link', source: 'instagram', color: 'bg-pink-950/50 border-pink-500/30 text-pink-400' },
                  { label: '🎵 TikTok Link',   source: 'tiktok',    color: 'bg-[#010101]/50 border-[#EE1D52]/30 text-[#EE1D52]' },
                ].map(({ label, source, color }) => (
                  <button
                    key={source}
                    onClick={() => {
                      const url = buildShareUrl(track.slug, source);
                      if (source === 'whatsapp') {
                        window.open(`https://wa.me/?text=${encodeURIComponent(`🎵 ${track.title} by ${track.artist_name}\n${url}`)}`);
                      } else if (source === 'twitter') {
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🎵 ${track.title} by ${track.artist_name} on UrbanGist`)}&url=${encodeURIComponent(url)}`);
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success(`${source} link copied!`);
                      }
                    }}
                    className={`w-full py-3 rounded-xl border text-sm font-semibold transition-all hover:brightness-110 ${color}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — track details */}
        <div className="space-y-5">
          {/* Lyrics (if available) */}
          {track.lyrics && (
            <div className="card p-6">
              <h3 className="font-bold text-text-primary mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Lyrics
              </h3>
              <pre className="text-sm text-text-secondary whitespace-pre-wrap leading-8 font-body max-h-80 overflow-y-auto">
                {track.lyrics}
              </pre>
            </div>
          )}

          {/* Track info card */}
          <div className="card p-6">
            <h3 className="font-bold text-text-primary mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Track Info
            </h3>
            <dl className="space-y-3">
              {[
                { label: 'Genre',    value: track.genre },
                { label: 'Subgenre', value: track.subgenre },
                { label: 'Artist',   value: track.artist_name },
                { label: 'Released', value: track.published_at ? new Date(track.published_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined },
              ].filter(({ value }) => Boolean(value)).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-bg-border/50 last:border-0">
                  <dt className="text-xs text-text-muted uppercase tracking-wider">{label}</dt>
                  <dd className="text-sm text-text-secondary font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Boost prompt */}
          <div className="rounded-2xl p-5 border border-purple/20 bg-purple-subtle/20">
            <div className="flex items-center gap-2 text-purple text-sm font-semibold mb-2">
              ⚡ Boost this track
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Multiply your ranking score by up to 6× and get featured placement for 7 days.
            </p>
            <a href={`/boost?track=${track.id}`} className="btn-boost text-sm px-4 py-2.5 w-full justify-center">
              Boost from ₦1,000 →
            </a>
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareModal track={track} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}
