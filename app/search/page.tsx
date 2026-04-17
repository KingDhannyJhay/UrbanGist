import { Metadata } from 'next';
import { createAdminSupabase } from '@/lib/supabase/server';
import type { LiveTrack, Profile } from '@/types';
import { truncate } from '@/lib/utils';
import SearchPageClient from './SearchPageClient';

interface Props { searchParams: { q?: string } }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (searchParams.q ?? '').trim();
  return {
    title: q ? `"${q}" — Search UrbanGist` : 'Search Music & Artists | UrbanGist',
    description: q
      ? `Search results for "${q}" on UrbanGist — discover Afrobeats, Amapiano and more.`
      : 'Search for tracks and artists on UrbanGist.',
    robots: { index: false, follow: true },
  };
}

export const dynamic = 'force-dynamic';

async function fetchResults(query: string) {
  if (!query) return { tracks: [], artists: [] };
  const sb = createAdminSupabase();
  const q  = `%${query}%`;

  const [tRes, aRes] = await Promise.all([
    sb.from('v_live_tracks').select('*')
      .or(`title.ilike.${q},genre.ilike.${q},artist_name.ilike.${q}`)
      .order('rank_score', { ascending: false }).limit(30),
    sb.from('profiles').select('*')
      .or(`display_name.ilike.${q},username.ilike.${q}`)
      .order('created_at', { ascending: false }).limit(20),
  ]);

  return {
    tracks:  (tRes.data ?? []) as LiveTrack[],
    artists: (aRes.data ?? []) as Profile[],
  };
}

// SSR page — passes data to client for tab filtering (no extra requests)
export default async function SearchPage({ searchParams }: Props) {
  const query = (searchParams.q ?? '').trim();
  const { tracks, artists } = await fetchResults(query);

  return (
    <SearchPageClient
      initialQuery={query}
      initialTracks={tracks}
      initialArtists={artists}
    />
  );
}
