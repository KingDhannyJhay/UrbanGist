import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createAdminSupabase } from '@/lib/supabase/server';
import type { LiveTrack } from '@/types';
import DiscoveryFeed from './DiscoveryFeed';
import { TrendingUp, Flame, Sparkles, Zap, Upload, BookOpen, ArrowRight } from 'lucide-react';

export const revalidate = 60; // ISR — revalidate every 60 seconds

export const metadata: Metadata = {
  title: 'UrbanGist — Discover Afrobeats, Amapiano & Nigerian Music',
  description:
    'Stream and discover the best Afrobeats, Amapiano, Afrorap and Gospel tracks. Upload your music and grow your audience on UrbanGist.',
};

async function getHomeData() {
  const supabase = createAdminSupabase();

  const [trending, newDrops, rising, featured] = await Promise.all([
    // Trending: highest rank_score, last 7 days
    supabase
      .from('v_live_tracks')
      .select('*')
      .order('rank_score', { ascending: false })
      .limit(12),

    // New Drops: most recent published
    supabase
      .from('v_live_tracks')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(12),

    // Rising: high share velocity, newer tracks
    supabase
      .from('v_live_tracks')
      .select('*')
      .gte('published_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
      .order('share_count', { ascending: false })
      .limit(8),

    // Featured: boosted + featured tracks
    supabase
      .from('v_live_tracks')
      .select('*')
      .gt('boost_multiplier', 1)
      .order('rank_score', { ascending: false })
      .limit(4),
  ]);

  return {
    trending: (trending.data ?? []) as LiveTrack[],
    newDrops: (newDrops.data ?? []) as LiveTrack[],
    rising: (rising.data ?? []) as LiveTrack[],
    featured: (featured.data ?? []) as LiveTrack[],
  };
}

export default async function HomePage() {
  const { trending, newDrops, rising, featured } = await getHomeData();

  const heroTrack = featured[0] ?? trending[0];

  return (
    <main className="min-h-screen">

      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {heroTrack && (
            <Image
              src={heroTrack.cover_url}
              alt=""
              fill
              priority
              className="object-cover opacity-15 scale-110 blur-2xl"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-bg-primary/80 to-bg-primary" />
          <div className="absolute inset-0 bg-hero-gradient" />
        </div>

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-green/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple/5 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green/20 bg-green-subtle text-green text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            Nigeria&apos;s #1 Music Discovery Platform
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 animate-slide-up"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Where African
            <br />
            Music Gets{' '}
            <span className="text-gradient-green">Discovered</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Stream Afrobeats, Amapiano, Afrorap & Gospel. Upload your tracks,
            grow your audience, and boost your visibility — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link href="/upload" className="btn-primary text-base px-8 py-4 shadow-green-glow">
              <Upload size={18} />
              Upload Your Track
            </Link>
            <Link href="#trending" className="btn-secondary text-base px-8 py-4">
              <TrendingUp size={18} />
              Explore Music
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            {[
              { label: 'Tracks Uploaded', value: '2,400+' },
              { label: 'Artists', value: '800+' },
              { label: 'Monthly Listeners', value: '50K+' },
              { label: 'Genres', value: '14' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-2xl font-black text-green" style={{ fontFamily: 'var(--font-display)' }}>{value}</span>
                <span className="text-xs text-text-muted uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-text-muted uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-bg-border flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-green rounded-full animate-[slideDown_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </section>

      {/* ── FEATURED / BOOSTED ROW ──────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-16 border-y border-bg-border bg-bg-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-subtle border border-purple/20 text-purple text-xs font-semibold">
                <Zap size={12} /> Featured & Boosted
              </div>
              <div className="h-px flex-1 bg-bg-border" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map((track) => (
                <FeaturedCard key={track.id} track={track} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── INTERACTIVE FEED (Client Component) ─────────────── */}
      <DiscoveryFeed
        initialTrending={trending}
        initialNewDrops={newDrops}
        initialRising={rising}
      />

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-24 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title text-3xl sm:text-4xl mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Your Music. Your Audience.
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              From upload to viral — everything you need to grow as an African artist.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Upload,
                step: '01',
                title: 'Upload Your Track',
                desc: 'Submit your music for review. Once approved, it goes live on the platform.',
                color: 'text-green',
                bg: 'bg-green-subtle',
              },
              {
                icon: TrendingUp,
                step: '02',
                title: 'Get Discovered',
                desc: 'Your track ranks in Trending, New Drops, and Rising sections automatically.',
                color: 'text-blue-400',
                bg: 'bg-blue-950/50',
              },
              {
                icon: Zap,
                step: '03',
                title: 'Boost Visibility',
                desc: 'Pay ₦1,000–₦5,000 to multiply your ranking score and get featured placement.',
                color: 'text-purple',
                bg: 'bg-purple-subtle',
              },
              {
                icon: BookOpen,
                step: '04',
                title: 'Learn & Grow',
                desc: 'Read expert guides on going viral, monetizing music, and building a fanbase.',
                color: 'text-yellow-400',
                bg: 'bg-yellow-950/50',
              },
            ].map(({ icon: Icon, step, title, desc, color, bg }) => (
              <div key={step} className="card p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-4xl font-black text-bg-elevated" style={{ fontFamily: 'var(--font-display)' }}>
                    {step}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEARN CTA ───────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-subtle via-bg-card to-purple-subtle" />
            <div className="absolute inset-0 bg-noise opacity-30" />
            <div className="relative px-8 py-12 sm:px-16 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 text-green text-sm font-semibold mb-3">
                  <BookOpen size={15} /> Learn on UrbanGist
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}>
                  Grow Your Music Career
                </h2>
                <p className="text-text-secondary max-w-md">
                  Expert guides on Afrobeats marketing, going viral on TikTok,
                  getting playlist placements, and monetizing your music in Nigeria.
                </p>
              </div>
              <Link href="/learn" className="btn-primary px-8 py-4 text-base flex-shrink-0">
                <BookOpen size={18} />
                Read the Guides
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

// Small featured card (server component, no interactivity)
function FeaturedCard({ track }: { track: LiveTrack }) {
  return (
    <Link href={`/track/${track.slug}`} className="group relative overflow-hidden rounded-2xl aspect-square block">
      <Image
        src={track.cover_url}
        alt={track.title}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-bold text-text-primary text-sm truncate"
           style={{ fontFamily: 'var(--font-display)' }}>{track.title}</p>
        <p className="text-xs text-text-muted truncate">{track.artist_name}</p>
      </div>
      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple/90 flex items-center justify-center">
        <Zap size={10} className="text-white" />
      </div>
    </Link>
  );
}
