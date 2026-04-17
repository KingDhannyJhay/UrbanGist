import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';
import type { LiveTrack } from '@/types';
import { getFeedOrderConfig } from '@/lib/trending';
import TrendingClient from './TrendingClient';

export const metadata: Metadata = {
  title: 'Trending Music — UrbanGist | Top Afrobeats, Amapiano & More',
  description:
    'Discover the hottest Afrobeats, Amapiano, Afrorap and Gospel tracks trending on UrbanGist right now. Updated in real-time based on plays, shares and boosts.',
  openGraph: {
    title: 'Trending Music — UrbanGist',
    description: 'The hottest tracks on UrbanGist right now, ranked by real engagement.',
    type: 'website',
  },
};

// Cache tagged so approvals and boosts can invalidate instantly
const getTrendingData = unstable_cache(
  async () => {
    const sb = createAdminSupabase();

    const trendingCfg = getFeedOrderConfig('trending');
    const newDropsCfg = getFeedOrderConfig('new_drops');
    const risingCfg   = getFeedOrderConfig('rising');

    const [trendRes, newRes, risingRes] = await Promise.all([
      sb.from('v_live_tracks').select('*')
        .order(trendingCfg.orderBy, { ascending: trendingCfg.ascending })
        .limit(50),

      sb.from('v_live_tracks').select('*')
        .order(newDropsCfg.orderBy, { ascending: newDropsCfg.ascending })
        .limit(24),

      sb.from('v_live_tracks').select('*')
        .gte('published_at', new Date(Date.now() - risingCfg.timeFilter! * 3_600_000).toISOString())
        .order(risingCfg.orderBy, { ascending: risingCfg.ascending })
        .limit(24),
    ]);

    return {
      trending:  (trendRes.data  ?? []) as LiveTrack[],
      newDrops:  (newRes.data    ?? []) as LiveTrack[],
      rising:    (risingRes.data ?? []) as LiveTrack[],
    };
  },
  ['trending-page'],
  { revalidate: 30, tags: ['tracks', 'boosts'] }
);

// JSON-LD for the trending page
const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'WebPage',
  name:       'Trending Music — UrbanGist',
  description:'Top trending Afrobeats, Amapiano and Nigerian music tracks ranked by plays, shares and boosts.',
  url:        `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urbangist.com.ng'}/trending`,
};

export default async function TrendingPage() {
  const { trending, newDrops, rising } = await getTrendingData();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrendingClient
        initialTrending={trending}
        initialNewDrops={newDrops}
        initialRising={rising}
      />
    </>
  );
}
