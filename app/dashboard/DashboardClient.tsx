'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Track, Promotion, TrackAnalytics, Profile } from '@/types';
import { formatCount, formatNaira, formatDate, timeAgo, trackUrl } from '@/lib/utils';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';
import { PlayerWatermark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import {
  Music2, BarChart2, Zap, QrCode, Upload, Play, Share2,
  Heart, Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowUpRight, BadgeCheck, TrendingUp,
} from 'lucide-react';

interface Props {
  tracks:     Track[];
  promotions: Promotion[];
  analytics:  TrackAnalytics[];
  profile:    Profile | null;
}

type DashTab = 'tracks' | 'analytics' | 'boosts' | 'qr';

export default function DashboardClient({ tracks, promotions, analytics, profile }: Props) {
  const [activeTab, setActiveTab] = useState<DashTab>('tracks');
  const [qrTrack,   setQrTrack]   = useState<Track | null>(
    tracks.find(t => t.status === 'live') ?? tracks[0] ?? null
  );

  const liveTracks    = tracks.filter(t => t.status === 'live');
  const pendingTracks = tracks.filter(t => t.status === 'pending');
  const totalPlays    = analytics.reduce((s, a) => s + (a.total_plays ?? 0), 0);
  const totalLikes    = analytics.reduce((s, a) => s + (a.total_likes ?? 0), 0);
  const activeBoosts  = promotions.filter(p => p.status === 'active');

  const TABS: { id: DashTab; label: string; icon: typeof Music2; badge?: string }[] = [
    { id: 'tracks',    label: 'My Tracks',  icon: Music2,   badge: String(tracks.length) },
    { id: 'analytics', label: 'Analytics',  icon: BarChart2 },
    { id: 'boosts',    label: 'Boosts',     icon: Zap,
      badge: activeBoosts.length > 0 ? String(activeBoosts.length) : undefined },
    { id: 'qr',        label: 'QR Codes',   icon: QrCode },
  ];

  const name = profile?.display_name ?? profile?.username ?? 'Artist';

  return (
    <main className="min-h-screen pt-20 pb-16 bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-8 border-b border-bg-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-subtle border border-green/20 flex items-center justify-center text-green text-xl font-black overflow-hidden">
              {profile?.avatar_url
                ? <Image src={profile.avatar_url} alt="" width={56} height={56} className="object-cover" />
                : name[0].toUpperCase()
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-text-primary" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {name}
                </h1>
                {profile?.verified && <BadgeCheck size={16} className="text-green" />}
              </div>
              <p className="text-sm text-text-muted">UrbanGist Studio</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/upload" className="btn-primary text-sm">
              <Upload size={14} /> Upload Track
            </Link>
            <Link href="/boost" className="btn-boost text-sm px-4 py-2.5">
              ⚡ Boost
            </Link>
          </div>
        </div>

        {/* ── Summary stats ───────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
          {[
            { label: 'Live Tracks',   value: String(liveTracks.length),       color: 'text-green',   icon: Music2 },
            { label: 'Total Plays',   value: formatCount(totalPlays),          color: 'text-blue-400', icon: Play },
            { label: 'Total Likes',   value: formatCount(totalLikes),          color: 'text-red-400',  icon: Heart },
            { label: 'Active Boosts', value: String(activeBoosts.length),     color: 'text-purple',  icon: Zap },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className={`flex items-center gap-1.5 ${color} mb-1`}>
                <Icon size={12} /><span className="stat-label">{label}</span>
              </div>
              <span className="stat-value text-2xl">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-bg-elevated border border-bg-border w-fit mb-8 flex-wrap">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                activeTab === id ? 'bg-green text-bg-primary' : 'text-text-secondary hover:text-text-primary',
              )}
              style={{ fontFamily: "'Syne', sans-serif" }}>
              <Icon size={14} />
              {label}
              {badge && (
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', activeTab === id ? 'bg-bg-primary/20' : 'bg-bg-border')}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── MY TRACKS ─────────────────────────────── */}
        {activeTab === 'tracks' && (
          <div className="space-y-4">
            {pendingTracks.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-950/50 border border-yellow-500/20 text-sm text-yellow-400">
                <AlertCircle size={15} className="flex-shrink-0" />
                {pendingTracks.length} track{pendingTracks.length > 1 ? 's' : ''} pending review — usually approved within 24 hours.
              </div>
            )}

            {tracks.length === 0 ? (
              <div className="text-center py-20 card">
                <Music2 size={40} className="mx-auto text-text-muted mb-4" />
                <p className="text-text-secondary font-semibold mb-2">No tracks yet</p>
                <p className="text-text-muted text-sm mb-6">Upload your first track to get started</p>
                <Link href="/upload" className="btn-primary">Upload Your First Track</Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      <th>Track</th>
                      <th>Status</th>
                      <th className="hidden md:table-cell">Genre</th>
                      <th className="hidden lg:table-cell">Plays</th>
                      <th className="hidden lg:table-cell">Boost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map(track => {
                      const ta = analytics.find(a => a.track_id === track.id);
                      return (
                        <tr key={track.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                <Image src={track.cover_url} alt={track.title} fill sizes="40px" className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate max-w-[140px]">{track.title}</p>
                                <p className="text-xs text-text-muted">{timeAgo(track.created_at)}</p>
                              </div>
                            </div>
                          </td>
                          <td><TrackStatusBadge status={track.status} /></td>
                          <td className="hidden md:table-cell"><span className="badge-genre text-xs">{track.genre}</span></td>
                          <td className="hidden lg:table-cell text-sm text-text-secondary">{formatCount(ta?.total_plays ?? track.play_count)}</td>
                          <td className="hidden lg:table-cell">
                            {track.boost_multiplier > 1
                              ? <span className="badge-boost text-xs">⚡ {track.boost_multiplier}×</span>
                              : <span className="text-xs text-text-muted">—</span>}
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              {track.status === 'live' && (
                                <>
                                  <Link href={`/track/${track.slug}`} target="_blank"
                                    title="View live track"
                                    className="p-1.5 rounded-lg text-text-muted hover:text-green hover:bg-bg-elevated transition-all">
                                    <ArrowUpRight size={13} />
                                  </Link>
                                  <Link href={`/boost?track=${track.id}`} title="Boost this track"
                                    className="p-1.5 rounded-lg text-text-muted hover:text-purple hover:bg-bg-elevated transition-all">
                                    <Zap size={13} />
                                  </Link>
                                  <button onClick={() => { setQrTrack(track); setActiveTab('qr'); }}
                                    title="Get QR code"
                                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
                                    <QrCode size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS ─────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            {analytics.length === 0 ? (
              <div className="text-center py-20 card">
                <BarChart2 size={40} className="mx-auto text-text-muted mb-4" />
                <p className="text-text-secondary font-semibold mb-1">No analytics yet</p>
                <p className="text-text-muted text-sm">Analytics appear once your tracks start receiving plays.</p>
              </div>
            ) : (
              analytics.map(a => {
                const track = tracks.find(t => t.id === a.track_id);
                if (!track) return null;
                return (
                  <div key={a.track_id} className="card p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={track.cover_url} alt={track.title} fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary truncate" style={{ fontFamily: "'Syne', sans-serif" }}>{track.title}</h3>
                        <p className="text-xs text-text-muted capitalize">{track.genre}</p>
                      </div>
                      {track.status === 'live' && (
                        <Link href={`/track/${track.slug}`} className="text-xs text-green flex items-center gap-1 hover:underline">
                          View <ArrowUpRight size={11} />
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      {[
                        { l:'Plays',      v: formatCount(a.total_plays),  c:'text-blue-400' },
                        { l:'Likes',      v: formatCount(a.total_likes),  c:'text-red-400' },
                        { l:'Shares',     v: formatCount(a.total_shares), c:'text-green' },
                        { l:'Completion', v: `${a.completion_rate ?? 0}%`, c:'text-yellow-400' },
                      ].map(({ l, v, c }) => (
                        <div key={l} className="p-3 rounded-xl bg-bg-elevated border border-bg-border">
                          <p className={`text-xs ${c} mb-1`}>{l}</p>
                          <p className="text-lg font-bold text-text-primary" style={{ fontFamily: "'Syne', sans-serif" }}>{v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Traffic sources */}
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Traffic Sources</p>
                      <div className="space-y-2">
                        {[
                          { l:'📱 WhatsApp',  v: a.from_whatsapp  ?? 0 },
                          { l:'📸 Instagram', v: a.from_instagram ?? 0 },
                          { l:'🎵 TikTok',    v: a.from_tiktok    ?? 0 },
                          { l:'📷 QR Code',   v: a.from_qr        ?? 0 },
                        ].map(({ l, v }) => {
                          const pct = a.total_plays > 0 ? Math.round((v / a.total_plays) * 100) : 0;
                          return (
                            <div key={l} className="flex items-center gap-3 text-sm">
                              <span className="w-28 text-text-muted text-xs flex-shrink-0">{l}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-bg-border overflow-hidden">
                                <div className="h-full rounded-full bg-green transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-8 text-right text-xs text-text-muted">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── BOOSTS ────────────────────────────────── */}
        {activeTab === 'boosts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-text-secondary text-sm">Your boost history and active promotions</p>
              <Link href="/boost" className="btn-boost text-xs px-4 py-2.5">⚡ New Boost</Link>
            </div>
            {promotions.length === 0 ? (
              <div className="text-center py-20 card">
                <Zap size={40} className="mx-auto text-purple mb-4" />
                <p className="text-text-secondary font-semibold mb-2">No boosts yet</p>
                <p className="text-text-muted text-sm mb-6">Boost a track to multiply its ranking score and get featured placement.</p>
                <Link href="/boost" className="btn-boost">⚡ Boost from ₦1,000</Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="admin-table w-full">
                  <thead><tr><th>Track</th><th>Plan</th><th className="hidden sm:table-cell">Amount</th><th>Status</th><th className="hidden md:table-cell">Expires</th></tr></thead>
                  <tbody>
                    {promotions.map(p => {
                      const track = tracks.find(t => t.id === p.track_id);
                      return (
                        <tr key={p.id}>
                          <td className="text-sm font-medium text-text-primary">{track?.title ?? '—'}</td>
                          <td><span className="badge-genre capitalize text-xs">{p.plan}</span></td>
                          <td className="hidden sm:table-cell text-sm">{formatNaira(p.amount_ngn)}</td>
                          <td><BoostBadge status={p.status} /></td>
                          <td className="hidden md:table-cell text-xs text-text-muted">
                            {p.end_date ? formatDate(p.end_date) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── QR CODES ──────────────────────────────── */}
        {activeTab === 'qr' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="label">Select Track</label>
                <select className="input"
                  value={qrTrack?.id ?? ''}
                  onChange={e => setQrTrack(tracks.find(t => t.id === e.target.value) ?? null)}>
                  {liveTracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              {qrTrack && (
                <div className="card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={qrTrack.cover_url} alt={qrTrack.title} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary text-sm truncate">{qrTrack.title}</p>
                      <p className="text-xs text-text-muted">{qrTrack.genre}</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mb-1.5">Share URL:</p>
                  <code className="block text-xs text-green bg-bg-elevated rounded-lg px-3 py-2.5 break-all font-mono">
                    {trackUrl(qrTrack.slug)}
                  </code>
                </div>
              )}

              <div className="p-4 rounded-xl bg-bg-elevated border border-bg-border text-sm text-text-secondary space-y-2">
                <p className="font-semibold text-text-primary text-xs uppercase tracking-wider mb-2">💡 QR Code Tips</p>
                <p className="text-xs">• Add to flyers, posters, and event banners</p>
                <p className="text-xs">• Post in WhatsApp status and Instagram stories</p>
                <p className="text-xs">• Print on merchandise or physical promo materials</p>
                <p className="text-xs">• Every scan is tracked in your analytics</p>
              </div>
            </div>

            <div className="card p-8 flex flex-col items-center justify-center gap-4">
              {qrTrack ? (
                <>
                  <QRCodeDisplay
                    value={`${trackUrl(qrTrack.slug)}?ref=qr`}
                    trackTitle={qrTrack.title}
                    size={180}
                    showDownload
                  />
                  <PlayerWatermark />
                </>
              ) : (
                <div className="text-center text-text-muted">
                  <QrCode size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No live tracks yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TrackStatusBadge({ status }: { status: Track['status'] }) {
  const map = {
    live:     { cls: 'badge-live',    icon: CheckCircle2, label: 'Live' },
    pending:  { cls: 'badge-pending', icon: Clock,        label: 'Pending' },
    rejected: { cls: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-400', icon: XCircle, label: 'Rejected' },
    takedown: { cls: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-bg-elevated text-text-muted', icon: XCircle, label: 'Removed' },
  } as const;
  const { cls, icon: Icon, label } = map[status] ?? map.rejected;
  return <span className={cls}><Icon size={10} />{label}</span>;
}

function BoostBadge({ status }: { status: Promotion['status'] }) {
  if (status === 'active')  return <span className="badge-boost text-xs">⚡ Active</span>;
  if (status === 'pending') return <span className="badge-pending text-xs">⏳ Pending</span>;
  return <span className="text-xs text-text-muted capitalize">{status}</span>;
}
