import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';
import type { LiveTrack } from '@/types';
import { formatCount, formatDate, truncate } from '@/lib/utils';
import TrackPageClient from './TrackPageClient';
import { BadgeCheck, Calendar, Play, Heart, Share2 } from 'lucide-react';

interface Props { params: { slug: string } }

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urbangist.com.ng';

// ── Cached fetchers tagged for granular revalidation ─────────────────────
const getTrack = unstable_cache(
  async (slug: string): Promise<LiveTrack | null> => {
    const sb = createAdminSupabase();
    const { data } = await sb.from('v_live_tracks').select('*').eq('slug', slug).single();
    return data as LiveTrack | null;
  },
  ['track-page'],
  { revalidate: 30, tags: ['tracks', 'boosts'] }
);

const getRelated = unstable_cache(
  async (genre: string, excludeId: string): Promise<LiveTrack[]> => {
    const sb = createAdminSupabase();
    const { data } = await sb
      .from('v_live_tracks').select('*')
      .eq('genre', genre).neq('id', excludeId)
      .order('rank_score', { ascending: false }).limit(6);
    return (data ?? []) as LiveTrack[];
  },
  ['related-tracks'],
  { revalidate: 60, tags: ['tracks'] }
);

export async function generateStaticParams() {
  const sb = createAdminSupabase();
  const { data } = await sb.from('tracks').select('slug').eq('status', 'live');
  return (data ?? []).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const track = await getTrack(params.slug);
  if (!track) return { title: 'Track Not Found | UrbanGist' };

  const title = track.seo_title ?? `${track.title} by ${track.artist_name}`;
  const description = track.seo_description ??
    truncate(`Listen to "${track.title}" by ${track.artist_name} — ${track.genre} music on UrbanGist.`);
  const url = `${SITE}/track/${track.slug}`;

  return {
    title: `${title} | UrbanGist`, description,
    alternates: { canonical: url },
    openGraph: { type: 'music.song', url, title, description, siteName: 'UrbanGist',
      images: [{ url: track.cover_url, width: 800, height: 800, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [track.cover_url] },
  };
}

export default async function TrackPage({ params }: Props) {
  const track = await getTrack(params.slug);
  if (!track) notFound();

  const related = await getRelated(track.genre, track.id);

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'MusicRecording',
    name: track.title, url: `${SITE}/track/${track.slug}`,
    image: track.cover_url, genre: track.genre,
    datePublished: track.published_at ?? track.created_at,
    duration: track.duration_sec
      ? `PT${Math.floor(track.duration_sec / 60)}M${track.duration_sec % 60}S` : undefined,
    byArtist: { '@type': 'MusicGroup', name: track.artist_name, url: `${SITE}/artist/${track.artist_slug}` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen pt-16">
        {/* ── Hero ─────────────────────────────────── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image src={track.cover_url} alt="" fill sizes="100vw"
              className="object-cover opacity-20 blur-3xl scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/40 via-bg-primary/70 to-bg-primary" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Cover art */}
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <Image src={track.cover_url} alt={`${track.title} cover art`}
                  fill priority sizes="256px" className="object-cover" />
                {track.boost_multiplier > 1 && (
                  <div className="absolute top-2 right-2 badge-boost text-xs">⚡ Boosted</div>
                )}
              </div>

              {/* Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="badge-genre">{track.genre}</span>
                  {track.subgenre && <span className="badge-genre">{track.subgenre}</span>}
                  {track.published_at && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Calendar size={11} /> {formatDate(track.published_at)}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-primary mb-3 leading-tight"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                  {track.title}
                </h1>

                <Link href={`/artist/${track.artist_slug}`}
                  className="flex items-center gap-2 text-lg text-text-secondary hover:text-green transition-colors mb-6 w-fit">
                  {track.artist_avatar && (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                      <Image src={track.artist_avatar} alt={track.artist_name} width={28} height={28} className="object-cover" />
                    </div>
                  )}
                  <span className="font-medium">{track.artist_name}</span>
                  {track.artist_verified && <BadgeCheck size={16} className="text-green" />}
                </Link>

                <div className="flex flex-wrap items-center gap-6 mb-6">
                  {[
                    { icon: Play,   label: 'Plays',  value: formatCount(track.play_count) },
                    { icon: Heart,  label: 'Likes',  value: formatCount(track.like_count) },
                    { icon: Share2, label: 'Shares', value: formatCount(track.share_count) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-2xl font-bold text-text-primary" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</span>
                      <span className="flex items-center gap-1 text-xs text-text-muted uppercase tracking-wider">
                        <Icon size={10} /> {label}
                      </span>
                    </div>
                  ))}
                </div>

                {track.description && (
                  <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">{track.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Client section ───────────────────────── */}
        <TrackPageClient track={track} related={related} />

        {/* ── Related ──────────────────────────────── */}
        {related.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <h2 className="text-xl font-bold text-text-primary mb-6"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              More {track.genre}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {related.map(rel => (
                <Link key={rel.id} href={`/track/${rel.slug}`} className="group">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                    <Image src={rel.cover_url} alt={rel.title} fill sizes="140px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-bg-primary/0 group-hover:bg-bg-primary/30 transition-colors flex items-center justify-center">
                      <Play size={20} fill="white" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-text-primary truncate group-hover:text-green transition-colors">{rel.title}</p>
                  <p className="text-xs text-text-muted truncate">{rel.artist_name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Boost CTA ────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="rounded-2xl p-8 bg-bg-card border border-bg-border text-center">
            <p className="text-sm text-text-muted mb-2">Are you {track.artist_name}?</p>
            <h3 className="text-xl font-bold text-text-primary mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Boost this track&apos;s visibility
            </h3>
            <Link href={`/boost?track=${track.id}`} className="btn-boost inline-flex">⚡ Boost from ₦1,000</Link>
          </div>
        </section>
      </main>
    </>
  );
}
