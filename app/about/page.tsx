import { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Music2, TrendingUp, Zap, BookOpen, Shield, Globe, Upload, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About UrbanGist — Nigeria\'s Music Discovery Platform',
  description:
    'Learn about UrbanGist — the platform built to discover, promote and educate upcoming African artists. Built for Afrobeats, Amapiano, Afrorap and Gospel.',
  openGraph: {
    title: 'About UrbanGist',
    description: 'Discover the story behind Nigeria\'s #1 music discovery platform.',
  },
};

const FEATURES = [
  {
    icon: Music2,
    title: 'UrbanGist Music',
    desc:  'A curated music discovery feed where listeners find the best new Afrobeats, Amapiano, Afrorap and Gospel tracks every day. Artists upload, admins approve, listeners discover.',
    color: 'text-green bg-green-subtle border-green/20',
  },
  {
    icon: Zap,
    title: 'UrbanGist Boost',
    desc:  'A paid promotion engine that multiplies an artist\'s ranking score by up to 6×. Artists pay once and get days of featured placement — starting at just ₦1,000.',
    color: 'text-purple bg-purple-subtle border-purple/20',
  },
  {
    icon: TrendingUp,
    title: 'UrbanGist Studio',
    desc:  'A real-time analytics dashboard showing plays, shares, traffic sources, and boost performance for every track. Know exactly where your listeners come from.',
    color: 'text-blue-400 bg-blue-950/50 border-blue-500/20',
  },
  {
    icon: Globe,
    title: 'UrbanGist Share',
    desc:  'Every track gets a unique shareable link and a downloadable QR code, optimised for WhatsApp, Instagram and TikTok. Viral sharing built in from day one.',
    color: 'text-yellow-400 bg-yellow-950/50 border-yellow-500/20',
  },
  {
    icon: BookOpen,
    title: 'Learn on UrbanGist',
    desc:  'A growing SEO-indexed knowledge hub with free guides on music marketing, industry royalties, going viral on TikTok, and building a lasting fanbase in Nigeria.',
    color: 'text-orange-400 bg-orange-950/50 border-orange-500/20',
  },
  {
    icon: Shield,
    title: 'Trusted & Moderated',
    desc:  'Every track goes through admin review before going live. We maintain quality standards, enforce copyright compliance and protect the UrbanGist community.',
    color: 'text-red-400 bg-red-950/50 border-red-500/20',
  },
];

const STATS = [
  { value: '2,400+', label: 'Tracks Uploaded' },
  { value: '800+',   label: 'Active Artists' },
  { value: '50K+',   label: 'Monthly Listeners' },
  { value: '14',     label: 'Music Genres' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 pb-16">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-green/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Logo variant="full" size="xl" href={null} glowing />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-text-primary mb-6 leading-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}>
            Where African Music<br />
            <span className="text-gradient-green">Gets Discovered</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10">
            UrbanGist is Nigeria&apos;s music discovery, promotion and education platform — built to give upcoming Afrobeats, Amapiano, Afrorap and Gospel artists the audience they deserve.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upload"    className="btn-primary px-8 py-3.5">Upload Your Track</Link>
            <Link href="/"          className="btn-secondary px-8 py-3.5">Explore Music</Link>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────── */}
      <section className="py-16 border-y border-bg-border bg-bg-secondary/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-3xl sm:text-4xl font-black text-green"
                      style={{ fontFamily: "'Syne', sans-serif" }}>{value}</span>
                <span className="text-xs text-text-muted uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-text-primary mb-6"
              style={{ fontFamily: "'Syne', sans-serif" }}>
            Our Story
          </h2>
          <div className="space-y-5 text-text-secondary leading-8">
            <p>
              UrbanGist was born from a simple frustration: incredible Nigerian artists were making world-class music in their bedrooms and studios, but had nowhere to properly showcase it. The big streaming platforms are crowded. Social media algorithms are unpredictable. Traditional promotion is expensive and inaccessible.
            </p>
            <p>
              We built UrbanGist to solve all three problems at once — a dedicated discovery platform where upcoming artists can upload their music, get found by real listeners, learn how to grow their careers, and pay an affordable amount to boost their visibility when they need it most.
            </p>
            <p>
              Every track on UrbanGist is reviewed by our moderation team before going live. This is intentional — we want listeners to trust that everything they find here meets a quality bar. And for artists, it means your music appears in a clean, curated environment that reflects your brand.
            </p>
            <p>
              We are powered by the belief that the next Burna Boy, Wizkid or Tems is somewhere out there right now — recording in a room with just a mic and a dream. UrbanGist is where they get their first big break.
            </p>
          </div>
        </div>
      </section>

      {/* ── Platform Modules ──────────────────────────────── */}
      <section className="py-20 bg-bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-text-primary mb-3"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              Everything in One Platform
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Five integrated modules working together to take your music from bedroom to the world.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6 flex flex-col gap-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Artists ───────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-green text-sm font-semibold mb-4">
                <Users size={14} /> For Upcoming Artists
              </div>
              <h2 className="text-3xl font-black text-text-primary mb-5 leading-tight"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                Your music deserves a real audience
              </h2>
              <div className="space-y-4 text-text-secondary">
                <p>Upload any genre — Afrobeats, Amapiano, Afrorap, Gospel, Highlife, or Afropop — and have it reviewed and live within 24 hours.</p>
                <p>Your track gets its own SEO-indexed page, ready to be found on Google. Share it on WhatsApp, Instagram, or TikTok with one tap.</p>
                <p>Every track comes with a downloadable QR code, perfect for flyers, shows, and print materials.</p>
              </div>
              <div className="flex gap-3 mt-8">
                <Link href="/auth/signup" className="btn-primary">Create Free Account</Link>
                <Link href="/upload"      className="btn-secondary">Upload a Track</Link>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: Upload,     text: 'Upload tracks free — always' },
                { icon: TrendingUp, text: 'Automatic ranking in Trending, New Drops & Rising feeds' },
                { icon: Zap,        text: 'Optional boost promotion from ₦1,000' },
                { icon: Globe,      text: 'Shareable links + QR codes for every track' },
                { icon: BookOpen,   text: 'Free educational resources to grow your career' },
                { icon: Shield,     text: 'Moderated community — quality you can trust' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-4 rounded-xl bg-bg-elevated border border-bg-border">
                  <div className="w-8 h-8 rounded-lg bg-green-subtle border border-green/20 flex items-center justify-center text-green flex-shrink-0">
                    <Icon size={14} />
                  </div>
                  <p className="text-sm text-text-secondary">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-subtle/30 to-purple-subtle/20" />
            <div className="relative">
              <Logo variant="icon" size="lg" href={null} animated glowing className="mx-auto mb-6" />
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-3"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                Join the UrbanGist Movement
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Whether you&apos;re an artist looking for your first break, or a listener discovering your next favourite song — UrbanGist is your home.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="btn-primary px-8 py-4">Create Free Account</Link>
                <Link href="/contact"     className="btn-secondary px-8 py-4">Get in Touch</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
