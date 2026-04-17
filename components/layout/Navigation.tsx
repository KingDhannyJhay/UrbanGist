'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Logo, UGIcon } from '@/components/ui/Logo';
import type { Profile } from '@/types';
import {
  TrendingUp, Upload, Zap, BookOpen, LayoutDashboard,
  Shield, Menu, X, ChevronDown, LogOut, User,
  Search, Music2, BadgeCheck,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/',         label: 'Discover',  icon: Music2 },
  { href: '/trending', label: 'Trending',  icon: TrendingUp },
  { href: '/learn',    label: 'Learn',     icon: BookOpen },
  { href: '/boost',    label: 'Boost',     icon: Zap },
];

export default function Navigation() {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();
  const searchRef = useRef<HTMLInputElement>(null);

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [scrolled,     setScrolled]     = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data as Profile); });
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  // ESC closes search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUserMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-bg-primary/95 backdrop-blur-xl border-b border-bg-border shadow-[0_1px_20px_rgba(0,0,0,0.4)]'
          : 'bg-transparent',
      )}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ── Logo ──────────────────────────── */}
            <div className="flex-shrink-0">
              <div className="hidden sm:block">
                <Logo variant="full" size="md" glowing={scrolled} />
              </div>
              <div className="sm:hidden">
                <Logo variant="icon" size="sm" animated />
              </div>
            </div>

            {/* ── Desktop links ─────────────────── */}
            <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center max-w-xs">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(href)
                    ? 'text-green bg-green-subtle'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
                )}>
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>

            {/* ── Right side ────────────────────── */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
                aria-label="Open search"
              >
                <Search size={17} />
              </button>

              {profile ? (
                <>
                  <Link href="/upload" className="hidden sm:flex btn-primary text-xs px-3.5 py-2 gap-1.5">
                    <Upload size={13} /> Upload
                  </Link>

                  {/* Avatar dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-bg-elevated border border-transparent hover:border-bg-border transition-all"
                    >
                      <div className="w-7 h-7 rounded-full bg-green-subtle border border-green/30 flex items-center justify-center text-green text-xs font-bold overflow-hidden">
                        {profile.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          : (profile.display_name || profile.username)?.[0]?.toUpperCase()
                        }
                      </div>
                      <ChevronDown size={11} className={cn('text-text-muted transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 z-50 bg-bg-card/95 backdrop-blur-xl border border-bg-border rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                          <div className="px-4 py-3.5 border-b border-bg-border">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-text-primary truncate">
                                {profile.display_name || profile.username}
                              </p>
                              {profile.verified && <BadgeCheck size={13} className="text-green flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-text-muted capitalize mt-0.5">{profile.role}</p>
                          </div>
                          <div className="py-1.5">
                            <DropItem href="/dashboard"               icon={LayoutDashboard} label="Dashboard"   />
                            <DropItem href={`/artist/${profile.slug}`} icon={User}            label="My Profile"  />
                            <DropItem href="/upload"                   icon={Upload}           label="Upload Track" />
                            {profile.role === 'admin' && (
                              <DropItem href="/admin" icon={Shield} label="Admin Panel" accent />
                            )}
                            <div className="my-1.5 border-t border-bg-border" />
                            <button onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-bg-elevated transition-colors">
                              <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth/login"
                    className="hidden sm:inline-flex text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-2 rounded-lg hover:bg-bg-elevated">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn-primary text-xs px-4 py-2">
                    Get Started
                  </Link>
                </>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-bg-elevated transition-colors"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* ── Mobile menu ─────────────────────────── */}
          {mobileOpen && (
            <div className="md:hidden border-t border-bg-border bg-bg-secondary/98 backdrop-blur-xl">
              <div className="py-3 px-2 space-y-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                      isActive(href)
                        ? 'text-green bg-green-subtle'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
                    )}>
                    <Icon size={16} /> {label}
                  </Link>
                ))}
                <div className="pt-2 pb-1 px-1 space-y-2">
                  <Link href="/upload" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-sm">
                    <Upload size={15} /> Upload Track
                  </Link>
                  {!profile && (
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-secondary w-full text-sm">
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* ── Search overlay ──────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-bg-primary/90 backdrop-blur-md" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-2xl">
            <div className="flex items-center justify-center mb-6 gap-2">
              <UGIcon size={22} />
              <span className="text-xs text-text-muted uppercase tracking-[0.2em]"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                Search UrbanGist
              </span>
            </div>

            <form onSubmit={handleSearch} className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tracks, artists, genres…"
                className="w-full bg-bg-card border border-bg-border text-text-primary placeholder:text-text-muted rounded-2xl pl-12 pr-28 py-4 text-base focus:outline-none focus:border-green transition-colors shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary text-xs px-4 py-2">
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {['Afrobeats', 'Amapiano', 'Afrorap', 'Gospel', 'Trending', 'New Drops'].map(q => (
                <button key={q}
                  onClick={() => { router.push(`/search?q=${q}`); setSearchOpen(false); }}
                  className="px-3 py-1.5 rounded-full bg-bg-elevated border border-bg-border text-xs text-text-muted hover:text-green hover:border-green transition-all">
                  {q}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-text-muted mt-4">Press <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-bg-border text-xs">ESC</kbd> to close</p>
          </div>
        </div>
      )}
    </>
  );
}

function DropItem({ href, icon: Icon, label, accent }: {
  href: string; icon: typeof User; label: string; accent?: boolean;
}) {
  return (
    <Link href={href}
      className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-bg-elevated',
        accent ? 'text-purple' : 'text-text-secondary hover:text-text-primary',
      )}>
      <Icon size={14} /> {label}
    </Link>
  );
}
