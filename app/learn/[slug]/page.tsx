import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createAdminSupabase } from '@/lib/supabase/server';
import type { Article } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Upload, Zap, TrendingUp, BookOpen, Eye } from 'lucide-react';

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  const supabase = createAdminSupabase();
  const { data } = await supabase.from('articles').select('slug').eq('status', 'published');
  return (data ?? []).map(({ slug }) => ({ slug }));
}

export const revalidate = 300;

async function getArticle(slug: string) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from('articles')
    .select('*, author:profiles(display_name, slug, avatar_url, bio)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data as Article | null;
}

async function getRelatedArticles(article: Article) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, cover_url, category, excerpt, published_at')
    .eq('status', 'published')
    .eq('category', article.category)
    .neq('id', article.id)
    .limit(3);
  return (data ?? []) as Partial<Article>[];
}

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Article Not Found | UrbanGist' };

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urbangist.com.ng';
  const title       = article.seo_title ?? article.title;
  const description = article.seo_description ?? truncate(article.excerpt ?? article.title, 160);
  const image       = article.og_image ?? article.cover_url;
  const url         = `${SITE_URL}/learn/${article.slug}`;

  return {
    title:       `${title} | UrbanGist Learn`,
    description,
    alternates:  { canonical: url },
    openGraph: {
      type:        'article',
      url,
      title,
      description,
      publishedTime: article.published_at ?? undefined,
      modifiedTime:  article.updated_at,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
      siteName: 'UrbanGist',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      image ? [image] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urbangist.com.ng';

  // JSON-LD — Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Article',
    headline:   article.title,
    description: article.seo_description ?? article.excerpt,
    url:         `${SITE_URL}/learn/${article.slug}`,
    image:       article.cover_url ?? article.og_image,
    datePublished: article.published_at,
    dateModified:  article.updated_at,
    author: {
      '@type': 'Organization',
      name:    'UrbanGist Editorial',
      url:     SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name:    'UrbanGist',
      url:     SITE_URL,
      logo:    { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
    },
    mainEntityOfPage: {
      '@type': '@id',
      '@id':   `${SITE_URL}/learn/${article.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen pt-24 pb-16">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link href="/learn" className="hover:text-green transition-colors flex items-center gap-1">
              <ArrowLeft size={13} /> Learn
            </Link>
            <span>/</span>
            <span className="text-text-secondary truncate">{article.title}</span>
          </div>

          {/* Category */}
          <div className="mb-5">
            <span className="badge-genre capitalize">{article.category}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-primary mb-6 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}>
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg text-text-secondary leading-relaxed mb-6">
              {article.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-5 py-4 border-y border-bg-border text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              By <strong className="text-text-secondary">UrbanGist Editorial</strong>
            </span>
            {article.published_at && (
              <span>{formatDate(article.published_at)}</span>
            )}
            <span className="flex items-center gap-1.5 ml-auto">
              <Eye size={13} /> {article.view_count.toLocaleString()} views
            </span>
          </div>
        </div>

        {/* Cover image */}
        {article.cover_url && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="relative aspect-video rounded-2xl overflow-hidden">
              <Image
                src={article.cover_url}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_320px] gap-12">

            {/* Article body */}
            <article>
              {/* Inline CTA — before content */}
              <div className="mb-8 p-5 rounded-2xl border border-green/20 bg-green-subtle/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-subtle flex items-center justify-center text-green flex-shrink-0">
                  <Upload size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Ready to upload your track?</p>
                  <p className="text-xs text-text-muted">Put what you learn into action on UrbanGist.</p>
                </div>
                <Link href="/upload" className="btn-primary text-xs px-4 py-2 flex-shrink-0">
                  Upload Now →
                </Link>
              </div>

              {/* Content */}
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Tags */}
              {article.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-bg-border">
                  {article.tags.map(tag => (
                    <span key={tag} className="badge-genre capitalize">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Bottom CTAs — internal links */}
              <div className="mt-12 grid sm:grid-cols-3 gap-4">
                {[
                  { href: '/upload',   icon: Upload,     title: 'Upload Your Track', desc: 'Submit your music to UrbanGist', color: 'border-green/20 bg-green-subtle/10' },
                  { href: '/boost',    icon: Zap,        title: 'Boost Visibility',  desc: 'Multiply your ranking from ₦1,000', color: 'border-purple/20 bg-purple-subtle/20' },
                  { href: '/trending', icon: TrendingUp, title: 'Discover Trending', desc: 'See what\'s hot on UrbanGist', color: 'border-bg-border bg-bg-elevated/50' },
                ].map(({ href, icon: Icon, title, desc, color }) => (
                  <Link key={href} href={href}
                    className={`flex flex-col gap-2 p-4 rounded-xl border transition-all hover:brightness-110 ${color}`}>
                    <Icon size={16} className="text-green" />
                    <p className="text-sm font-bold text-text-primary">{title}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                    <span className="text-xs text-green flex items-center gap-1 mt-1">
                      Go <ArrowRight size={11} />
                    </span>
                  </Link>
                ))}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* More articles */}
              {related.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-display)' }}>
                    <BookOpen size={14} className="text-green" /> Related Articles
                  </h3>
                  <div className="space-y-4">
                    {related.map(rel => (
                      <Link key={rel.id} href={`/learn/${rel.slug}`}
                        className="flex gap-3 group">
                        {rel.cover_url && (
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={rel.cover_url} alt={rel.title ?? ''} fill sizes="56px" className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary group-hover:text-green transition-colors leading-snug line-clamp-2">
                            {rel.title}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {rel.published_at && formatDate(rel.published_at)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/learn" className="flex items-center gap-1 text-xs text-green mt-4 font-semibold">
                    All articles <ArrowRight size={11} />
                  </Link>
                </div>
              )}

              {/* Sticky boost CTA */}
              <div className="rounded-2xl p-5 sticky top-24"
                   style={{ background: 'linear-gradient(135deg, #2E1065 0%, #052E16 100%)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div className="text-purple text-sm font-semibold mb-2">⚡ UrbanGist Boost</div>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  Get your track heard by more listeners. Boost your ranking from just ₦1,000.
                </p>
                <Link href="/boost" className="btn-boost text-sm w-full justify-center">
                  Boost Your Track →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
