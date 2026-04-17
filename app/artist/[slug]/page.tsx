import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';
import type { Profile, LiveTrack } from '@/types';
import { formatCount, timeAgo, truncate } from '@/lib/utils';
import { BadgeCheck, Music2, Play, Heart, Share2, Instagram, Twitter, Youtube } from 'lucide-react';
import TrackCard from '@/components/ui/TrackCard';
import ArtistPageClient from './ArtistPageClient';

interface Props { params: { slug: string } }

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urbangist.com.ng';

// ── Pre-render top 200 artists (most tracks) ──────────────────────────────
export async function generateStaticParams() {
  const sb = createAdminSupabase();
  const { data } = await sb
    .from('profiles')
    .select('slug')
    .order('created_at', { ascending: false })
    .limit(200);
  return (data ?? []).map(({ slug }) => ({ slug }));
}

// Use SSR fallback for newer artists not in static params
export const dynamicParams = true;
export const revalidate = 60;

// ── Cached data fetchers ──────────────────────────────────────────────────
const getArtist = unstable_cache(
  async (slug: string): Promise<Profile | null> => {
    const sb = createAdminSupabase();
    const { data } = await sb.from('profiles').select('*').eq('slug', slug).single();
    return data as Profile | null;
  },
  ['artist-profile'],
  { revalidate: 60, tags: ['artists'] }
);

const getArtistTracks = unstable_cache(
  async (artistId: string): Promise<LiveTrack[]> => {
    const sb = createAdminSupabase();
    const { data } = await sb
      .from('v_live_tracks').select('*')
      .eq('artist_id', artistId)
      .order('rank_score', { ascending: false })
      .limit(20);
    return (data ?? []) as LiveTrack[];
  },
  ['artist-tracks'],
  { revalidate: 60, tags: ['tracks'] }
);

const getArtistStats = unstable_cache(
  async (artistId: string) => {
    const sb = createAdminSupabase();
    const { data } = await sb
      .from('tracks')
      .select('play_count, share_count, like_count, status')
      .eq('artist_id', artistId);

    const tracks = data ?? [];
    return {
      totalTracks: tracks.filter(t => t.status === 'live').length,
      totalPlays:  tracks.reduce((s, t) => s + (t.play_count  ?? 0), 0),
      totalLikes:  tracks.reduce((s, t) => s + (t.like_count  ?? 0), 0),
      totalShares: tracks.reduce((s, t) => s + (t.share_count ?? 0), 0),
    };
  },
  ['artist-stats'],
  { revalidate: 60, tags: ['tracks'] }
);

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const artist = await getArtist(params.slug);
  if (!artist) return { title: 'Artist Not Found | UrbanGist' };

  const name  = artist.display_name ?? artist.username;
  const title = `${name} — Artist on UrbanGist`;
  const desc  = truncate(artist.bio ?? `Listen to ${name}'s music on UrbanGist — Afrobeats, Amapiano, Gospel and more.`);
  const url   = `${SITE}/artist/${artist.slug}`;

  return {
    title: `${title}`, description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile', url, title, description: desc, siteName: 'UrbanGist',
      images: artist.avatar_url ? [{ url: artist.avatar_url, width: 400, height: 400, alt: name }] : [],
    },
    twitter: { card: 'summary_large_image', title, description: desc,
      images: artist.avatar_url ? [artist.avatar_url] : [] },
  };
}

export default async function ArtistPage({ params }: Props) {
  const artist = await getArtist(params.slug);
  if (!artist) notFound();

  const [tracks, stats] = await Promise.all([
    getArtistTracks(artist.id),
    getArtistStats(artist.id),
  ]);

  const name = artist.display_name ?? artist.username;

  // JSON-LD — MusicGroup
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'MusicGroup',
    name, url: `${SITE}/artist/${artist.slug}`,
    image: artist.avatar_url ?? undefined,
    description: artist.bio ?? undefined,
    track: tracks.slice(0, 5).map(t => ({
      '@type': 'MusicRecording',
      name: t.title,
      url: `${SITE}/track/${t.slug}`,
    })),
  };

  const socialLinks = artist.social_links ?? {};

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen pt-16">
        {/* ── Artist hero ──────────────────────────── */}
        <div className="relative overflow-hidden">
          {/* Background blur from first track cover or avatar */}
          {(artist.avatar_url || tracks[0]?.cover_url) && (
            <div className="absolute inset-0">
              <Image
                src={artist.avatar_url ?? tracks[0].cover_url}
                alt="" fill sizes="100vw"
                className="object-cover opacity-10 blur-3xl scale-110"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/50 via-bg-primary/80 to-bg-primary" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Avatar */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-bg-border flex-shrink-0 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
                {artist.avatar_url ? (
                  <Image src={artist.avatar_url} alt={name} fill sizes="144px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-green-subtle flex items-center justify-center text-green text-4xl font-black"
                       style={{ fontFamily: "'Syne', sans-serif" }}>
                    {name[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-text-muted uppercase tracking-widest">Artist</span>
                  {artist.verified && (
                    <span className="flex items-center gap-1 text-xs text-green font-semibold">
                      <BadgeCheck size={13} /> Verified
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-primary mb-3 leading-tight"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                  {name}
                </h1>
                {artist.bio && (
                  <p className="text-text-secondary text-sm leading-relaxed max-w-xl mb-4">
                    {artist.bio}
                  </p>
                )}

                {/* Social links */}
                <div className="flex items-center gap-3">
                  {socialLinks.instagram && (
                    <a href={`https://instagram.com/${socialLinks.instagram.replace('@','')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-pink-400 transition-colors">
                      <Instagram size={14} /> Instagram
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={`https://twitter.com/${socialLinks.twitter.replace('@','')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-blue-400 transition-colors">
                      <Twitter size={14} /> Twitter
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-400 transition-colors">
                      <Youtube size={14} /> YouTube
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-8 mt-8 pt-8 border-t border-bg-border/50">
              {[
                { icon: Music2, label: 'Tracks',  value: formatCount(stats.totalTracks) },
                { icon: Play,   label: 'Plays',   value: formatCount(stats.totalPlays) },
                { icon: Heart,  label: 'Likes',   value: formatCount(stats.totalLikes) },
                { icon: Share2, label: 'Shares',  value: formatCount(stats.totalShares) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-2xl font-bold text-text-primary" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</span>
                  <span className="flex items-center gap-1 text-xs text-text-muted uppercase tracking-wider">
                    <Icon size={10} /> {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tracks section (client for playback) ─── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold text-text-primary mb-6"
              style={{ fontFamily: "'Syne', sans-serif" }}>
            {tracks.length > 0 ? `Tracks by ${name}` : `${name} hasn't uploaded yet`}
          </h2>

          {tracks.length > 0 ? (
            <ArtistPageClient tracks={tracks} />
          ) : (
            <div className="text-center py-16 card">
              <Music2 size={40} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-secondary">No live tracks yet.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
