import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createAdminSupabase } from '@/lib/supabase/server';
import type { Article } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { BookOpen, ArrowRight, Upload, Zap, TrendingUp } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Learn on UrbanGist — Artist Guides, Music Marketing & Industry Insights',
  description:
    'Free guides for Nigerian artists: how to go viral on TikTok, grow Afrobeats streams, understand music royalties, and build a fanbase. Learn on UrbanGist.',
  openGraph: {
    title: 'Learn on UrbanGist — Nigerian Artist Growth Hub',
    description: 'Free music marketing guides, industry insights and platform tutorials for African artists.',
    type: 'website',
  },
};

const CATEGORY_META = {
  guide:    { label: 'Artist Guides',      emoji: '🎯', color: 'text-green bg-green-subtle border-green/20' },
  platform: { label: 'Platform Tutorials', emoji: '📱', color: 'text-blue-400 bg-blue-950/50 border-blue-500/20' },
  industry: { label: 'Industry Insights',  emoji: '📈', color: 'text-purple bg-purple-subtle border-purple/20' },
  news:     { label: 'News',               emoji: '📰', color: 'text-yellow-400 bg-yellow-950/50 border-yellow-500/20' },
  tutorial: { label: 'Tutorials',          emoji: '🎓', color: 'text-orange-400 bg-orange-950/50 border-orange-500/20' },
};

async function getArticles() {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from('articles')
    .select('*, author:profiles(display_name, slug, avatar_url)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);
  return (data ?? []) as (Article & { author: { display_name: string; slug: string; avatar_url: string | null } })[];
}

export default async function LearnPage() {
  const articles = await getArticles();
  const featured = articles.filter(a => a.featured).slice(0, 1);
  const rest     = articles.filter(a => !a.featured || featured.find(f => f.id !== a.id));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Learn on UrbanGist',
    description: 'Artist guides, music marketing and industry insights for Nigerian musicians',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/learn`,
    publisher: {
      '@type': 'Organization',
      name: 'UrbanGist',
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    blogPost: articles.slice(0, 10).map(a => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/learn/${a.slug}`,
      datePublished: a.published_at,
      dateModified: a.updated_at,
      image: a.cover_url ?? a.og_image,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green/20 bg-green-subtle text-green text-sm font-semibold mb-6">
              <BookOpen size={14} /> Learn on UrbanGist
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-4"
                style={{ fontFamily: 'var(--font-display)' }}>
              Grow Your Music Career
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Free expert guides on going viral, building a fanbase, earning from your music, and mastering the Nigerian music industry.
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {[
                { href: '/upload',   icon: Upload,     label: 'Upload Your Track' },
                { href: '/boost',    icon: Zap,        label: 'Boost Visibility' },
                { href: '/trending', icon: TrendingUp, label: 'Discover Trending' },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-bg-border bg-bg-elevated text-sm text-text-secondary hover:text-green hover:border-green transition-all">
                  <Icon size={13} /> {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Featured article */}
          {featured[0] && (
            <div className="mb-12">
              <Link href={`/learn/${featured[0].slug}`} className="group block">
                <div className="card overflow-hidden">
                  <div className="grid md:grid-cols-2">
                    <div className="relative aspect-video md:aspect-auto">
                      {featured[0].cover_url && (
                        <Image
                          src={featured[0].cover_url}
                          alt={featured[0].title}
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-8 flex flex-col justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_META[featured[0].category]?.color}`}>
                          {CATEGORY_META[featured[0].category]?.emoji} {CATEGORY_META[featured[0].category]?.label}
                        </span>
                        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold text-green">Featured</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-text-primary group-hover:text-green transition-colors"
                          style={{ fontFamily: 'var(--font-display)' }}>
                        {featured[0].title}
                      </h2>
                      {featured[0].excerpt && (
                        <p className="text-text-secondary leading-relaxed">{featured[0].excerpt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">
                          {featured[0].published_at && formatDate(featured[0].published_at)}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-green font-semibold">
                          Read article <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Link href="/learn" className="badge-live text-xs px-3 py-1.5">All</Link>
            {Object.entries(CATEGORY_META).map(([id, meta]) => (
              <Link key={id} href={`/learn?cat=${id}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:brightness-110 ${meta.color}`}>
                {meta.emoji} {meta.label}
              </Link>
            ))}
          </div>

          {/* Article grid */}
          {rest.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-text-secondary">No articles yet. Check back soon!</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const meta = CATEGORY_META[article.category];
  return (
    <Link href={`/learn/${article.slug}`} className="card group flex flex-col overflow-hidden hover:-translate-y-1 transition-all duration-300">
      {/* Cover */}
      <div className="relative aspect-video overflow-hidden">
        {article.cover_url ? (
          <Image src={article.cover_url} alt={article.title} fill sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-bg-elevated to-bg-card flex items-center justify-center text-3xl">
            {meta?.emoji}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${meta?.color}`}>
            {meta?.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="font-bold text-text-primary group-hover:text-green transition-colors leading-snug"
            style={{ fontFamily: 'var(--font-display)' }}>
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-text-muted leading-relaxed flex-1">
            {truncate(article.excerpt, 120)}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-bg-border/50">
          <span className="text-xs text-text-muted">
            {article.published_at && formatDate(article.published_at)}
          </span>
          <span className="text-xs text-green flex items-center gap-1 font-semibold">
            Read <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}
