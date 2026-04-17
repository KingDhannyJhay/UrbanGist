import { MetadataRoute } from 'next';
import { createAdminSupabase } from '@/lib/supabase/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urbangist.com.ng';

export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminSupabase();

  // Fetch all live tracks, artists, and published articles in parallel
  const [tracksRes, artistsRes, articlesRes] = await Promise.all([
    supabase
      .from('tracks')
      .select('slug, updated_at')
      .eq('status', 'live')
      .order('updated_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5000),

    supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
  ]);

  const tracks  = tracksRes.data  ?? [];
  const artists = artistsRes.data ?? [];
  const articles = articlesRes.data ?? [];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:             SITE_URL,
      lastModified:    new Date(),
      changeFrequency: 'hourly',
      priority:        1.0,
    },
    {
      url:             `${SITE_URL}/trending`,
      lastModified:    new Date(),
      changeFrequency: 'hourly',
      priority:        0.9,
    },
    {
      url:             `${SITE_URL}/learn`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        0.8,
    },
    {
      url:             `${SITE_URL}/upload`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.7,
    },
    {
      url:             `${SITE_URL}/boost`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.7,
    },
  ];

  // Track pages (highest priority — core SEO pages)
  const trackPages: MetadataRoute.Sitemap = tracks.map(track => ({
    url:             `${SITE_URL}/track/${track.slug}`,
    lastModified:    new Date(track.updated_at),
    changeFrequency: 'daily' as const,
    priority:        0.9,
  }));

  // Artist pages
  const artistPages: MetadataRoute.Sitemap = artists.map(artist => ({
    url:             `${SITE_URL}/artist/${artist.slug}`,
    lastModified:    new Date(artist.updated_at),
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }));

  // Article pages
  const articlePages: MetadataRoute.Sitemap = articles.map(article => ({
    url:             `${SITE_URL}/learn/${article.slug}`,
    lastModified:    new Date(article.updated_at),
    changeFrequency: 'monthly' as const,
    priority:        0.8,
  }));

  return [
    ...staticPages,
    ...trackPages,
    ...artistPages,
    ...articlePages,
  ];
}
