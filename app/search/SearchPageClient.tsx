'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LiveTrack, Profile } from '@/types';
import { formatCount, timeAgo } from '@/lib/utils';
import { Search, Music2, User, X, BadgeCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'tracks' | 'artists';

interface Props {
  initialQuery:   string;
  initialTracks:  LiveTrack[];
  initialArtists: Profile[];
}

export default function SearchPageClient({ initialQuery, initialTracks, initialArtists }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query,   setQuery]   = useState(initialQuery);
  const [tracks,  setTracks]  = useState(initialTracks);
  const [artists, setArtists] = useState(initialArtists);
  const [tab,     setTab]     = useState<Tab>('all');
  const [typing,  setTyping]  = useState(false);

  // Debounced search — navigates to new SSR result without page reload feel
  useEffect(() => {
    if (query === initialQuery) return;
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
      });
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  // Keep local state in sync when SSR delivers new results
  useEffect(() => {
    setTracks(initialTracks);
    setArtists(initialArtists);
  }, [initialTracks, initialArtists]);

  const visibleTracks  = tab !== 'artists' ? tracks  : [];
  const visibleArtists = tab !== 'tracks'  ? artists : [];
  const total = tracks.length + artists.length;

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-text-primary mb-1"
              style={{ fontFamily: "'Syne', sans-serif" }}>
            {query ? `Results for "${query}"` : 'Search UrbanGist'}
          </h1>
          {query && !isPending && (
            <p className="text-text-muted text-sm">{total} result{total !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Search input */}
        <div className="relative mb-8">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tracks, artists, genres…"
            autoFocus={!initialQuery}
            className="w-full bg-bg-card border border-bg-border text-text-primary placeholder:text-text-muted rounded-2xl pl-11 pr-12 py-3.5 text-base focus:outline-none focus:border-green transition-colors"
          />
          {(typing || isPending) ? (
            <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green animate-spin" />
          ) : query ? (
            <button onClick={() => { setQuery(''); router.push('/search'); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* Empty / no query */}
        {!query && (
          <div className="text-center py-24">
            <Search size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary text-lg font-semibold mb-2">Start searching</p>
            <p className="text-text-muted text-sm mb-8">Search for tracks, artists, and genres</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Afrobeats','Amapiano','Afrorap','Gospel','Trending'].map(q => (
                <button key={q} onClick={() => setQuery(q)}
                  className="px-4 py-2 rounded-full bg-bg-elevated border border-bg-border text-sm text-text-muted hover:text-green hover:border-green/40 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab filter (client-side — no network request) */}
        {query && total > 0 && (
          <div className="flex items-center gap-2 mb-7">
            {([
              ['all',     `All (${total})`],
              ['tracks',  `Tracks (${tracks.length})`],
              ['artists', `Artists (${artists.length})`],
            ] as [Tab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  tab === id
                    ? 'bg-green text-bg-primary'
                    : 'bg-bg-elevated border border-bg-border text-text-secondary hover:text-text-primary',
                )}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {query && !isPending && total === 0 && (
          <div className="text-center py-20 card">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-text-secondary font-semibold mb-2">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-text-muted text-sm mb-6">Try a different search term or browse trending</p>
            <Link href="/trending" className="btn-primary">Browse Trending</Link>
          </div>
        )}

        {/* Track results */}
        {visibleTracks.length > 0 && (
          <section className="mb-10">
            {tab === 'all' && (
              <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary mb-4"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                <Music2 size={17} className="text-green" /> Tracks
              </h2>
            )}
            <div className="card overflow-hidden">
              {visibleTracks.map((track, i) => (
                <Link key={track.id} href={`/track/${track.slug}`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-bg-elevated transition-colors border-b border-bg-border/50 last:border-0 group">
                  <span className="w-5 text-center text-xs text-text-muted font-mono">{i + 1}</span>
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={track.cover_url} alt={track.title} fill sizes="44px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-green transition-colors truncate">{track.title}</p>
                    <p className="text-xs text-text-muted truncate">{track.artist_name} · {track.genre}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-text-muted flex-shrink-0">
                    <span>{formatCount(track.play_count)} plays</span>
                    <span className="hidden md:inline">{timeAgo(track.published_at ?? track.created_at)}</span>
                  </div>
                  {track.boost_multiplier > 1 && (
                    <span className="badge-boost text-xs hidden sm:inline-flex">⚡</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Artist results */}
        {visibleArtists.length > 0 && (
          <section>
            {tab === 'all' && (
              <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary mb-4"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                <User size={17} className="text-green" /> Artists
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visibleArtists.map(artist => (
                <Link key={artist.id} href={`/artist/${artist.slug}`}
                  className="card p-5 flex flex-col items-center gap-3 text-center group hover:-translate-y-1 transition-all duration-200">
                  <div className="w-14 h-14 rounded-full bg-green-subtle border border-green/20 flex items-center justify-center text-green text-xl font-black overflow-hidden">
                    {artist.avatar_url
                      ? <Image src={artist.avatar_url} alt={artist.display_name ?? ''} width={56} height={56} className="object-cover w-full h-full" />
                      : (artist.display_name || artist.username)?.[0]?.toUpperCase()
                    }
                  </div>
                  <div className="min-w-0 w-full">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm font-bold text-text-primary group-hover:text-green transition-colors truncate">
                        {artist.display_name || artist.username}
                      </p>
                      {artist.verified && <BadgeCheck size={12} className="text-green flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-text-muted capitalize mt-0.5">{artist.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
