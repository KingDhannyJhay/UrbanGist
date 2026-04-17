'use client';

import { useState, useTransition, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipTapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { approveTrackAction, rejectTrackAction } from '@/app/actions/upload';
import { saveArticleAction } from '@/app/actions/content';
import { createSlug, formatCount, formatNaira, timeAgo, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Shield, Music2, BookOpen, Zap, BarChart2, Plus, Save,
  CheckCircle, XCircle, Eye, Loader2, ArrowUpRight,
  Bold, Italic, Heading2, List, Link as LinkIcon, Quote,
} from 'lucide-react';

interface AdminStats {
  liveTracks:   number;
  totalArtists: number;
  totalPlays:   number;
  revenue:      number;
}

type TrackRecord = Record<string, unknown>;

interface Props {
  pendingTracks: TrackRecord[];
  allTracks:     TrackRecord[];
  articles:      TrackRecord[];
  boosts:        TrackRecord[];
  stats:         AdminStats;
}

type AdminTab = 'overview' | 'tracks' | 'articles' | 'write' | 'boosts';

export default function AdminClient({
  pendingTracks: initialPending,
  allTracks,
  articles,
  boosts,
  stats,
}: Props) {
  const [activeTab,    setActiveTab]    = useState<AdminTab>('overview');
  const [isPending,    startTransition] = useTransition();
  const [pending,      setPending]      = useState<TrackRecord[]>(initialPending);
  const [articleError, setArticleError] = useState('');
  const [savingArt,    setSavingArt]    = useState(false);

  const [article, setArticle] = useState({
    title: '', slug: '', excerpt: '', category: 'guide',
    coverUrl: '', seoTitle: '', seoDesc: '', featured: false,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      TipTapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your article…' }),
    ],
    editorProps: { attributes: { class: 'ProseMirror' } },
  });

  const handleApprove = useCallback((trackId: string) => {
    // Optimistic: remove from list immediately
    setPending(prev => prev.filter(t => t.id !== trackId));
    startTransition(async () => {
      const res = await approveTrackAction(trackId);
      if (res.error) {
        toast.error(res.error);
        // Re-fetch would be ideal here; for now just show error
      } else {
        toast.success('Track approved ✅');
      }
    });
  }, []);

  const handleReject = useCallback((trackId: string) => {
    const reason = window.prompt('Rejection reason (optional):') ?? '';
    // Optimistic: remove from list immediately
    setPending(prev => prev.filter(t => t.id !== trackId));
    startTransition(async () => {
      const res = await rejectTrackAction(trackId, reason);
      if (res.error) toast.error(res.error);
      else toast.success('Track rejected.');
    });
  }, []);

  const handleSaveArticle = async (status: 'draft' | 'published') => {
    if (!article.title) { setArticleError('Title is required.'); return; }
    const content = editor?.getHTML();
    if (!content || content === '<p></p>') { setArticleError('Content is required.'); return; }
    setArticleError('');
    setSavingArt(true);

    const fd = new FormData();
    fd.set('title',    article.title);
    fd.set('slug',     article.slug || createSlug(article.title));
    fd.set('excerpt',  article.excerpt);
    fd.set('content',  content);
    fd.set('category', article.category);
    fd.set('coverUrl', article.coverUrl);
    fd.set('seoTitle', article.seoTitle);
    fd.set('seoDesc',  article.seoDesc);
    fd.set('featured', String(article.featured));
    fd.set('status',   status);

    const res = await saveArticleAction({ status: 'idle' }, fd);
    setSavingArt(false);

    if (res.status === 'error') {
      setArticleError(res.message);
      toast.error(res.message);
    } else {
      toast.success(status === 'published' ? 'Article published! 🎉' : 'Draft saved.');
      editor?.commands.clearContent();
      setArticle({ title:'', slug:'', excerpt:'', category:'guide', coverUrl:'', seoTitle:'', seoDesc:'', featured: false });
      setActiveTab('articles');
    }
  };

  const TABS: { id: AdminTab; label: string; icon: typeof Shield; badge?: number }[] = [
    { id: 'overview', label: 'Overview',   icon: BarChart2 },
    { id: 'tracks',   label: 'Tracks',     icon: Music2,   badge: pending.length },
    { id: 'articles', label: 'Articles',   icon: BookOpen },
    { id: 'write',    label: 'Write Post', icon: Plus },
    { id: 'boosts',   label: 'Boosts',     icon: Zap },
  ];

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 py-8 border-b border-[#2A2A2A] mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#F8F8F8]"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
              Admin Panel
            </h1>
            <p className="text-xs text-[#525252]">UrbanGist Content Management</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] w-fit mb-8 flex-wrap">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                activeTab === id ? 'bg-green-500 text-[#0B0B0B]' : 'text-[#A3A3A3] hover:text-[#F8F8F8]',
              )}
              style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
            >
              <Icon size={14} />
              {label}
              {badge != null && badge > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === id ? 'bg-[#0B0B0B]/20' : 'bg-red-900/60 text-red-300',
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ──────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { l: 'Live Tracks',   v: formatCount(stats.liveTracks),   c: 'text-green-500' },
                { l: 'Total Artists', v: formatCount(stats.totalArtists), c: 'text-blue-400' },
                { l: 'Total Plays',   v: formatCount(stats.totalPlays),   c: 'text-purple-400' },
                { l: 'Total Revenue', v: formatNaira(stats.revenue),      c: 'text-yellow-400' },
              ].map(({ l, v, c }) => (
                <div key={l} className="stat-card">
                  <span className="stat-label">{l}</span>
                  <span className={`stat-value ${c}`}>{v}</span>
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-[#F8F8F8] mb-4 flex items-center gap-2"
                    style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
                  ⏳ Pending Review
                  <span className="badge-pending">{pending.length}</span>
                </h3>
                <div className="space-y-3">
                  {pending.slice(0, 5).map(t => (
                    <div key={t.id as string} className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1C]">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={t.cover_url as string} alt={t.title as string} fill sizes="40px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#F8F8F8] truncate">{t.title as string}</p>
                        <p className="text-xs text-[#525252]">
                          {(t.artist as Record<string, string>)?.display_name} · {t.genre as string}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(t.id as string)}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-semibold hover:bg-green-500 hover:text-[#0B0B0B] transition-all disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(t.id as string)}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-lg bg-red-950/50 text-red-400 text-xs font-semibold hover:bg-red-900 transition-all"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {pending.length > 5 && (
                  <button onClick={() => setActiveTab('tracks')} className="text-sm text-green-500 mt-3">
                    View all {pending.length} pending →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TRACKS ────────────────────────────────────── */}
        {activeTab === 'tracks' && (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <h2 className="font-bold text-[#F8F8F8] mb-4"
                    style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
                  ⏳ Pending Review
                </h2>
                <div className="card overflow-hidden">
                  <table className="admin-table w-full">
                    <thead>
                      <tr>
                        <th>Track</th><th>Artist</th><th>Genre</th>
                        <th>Submitted</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map(t => (
                        <tr key={t.id as string}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                                <Image src={t.cover_url as string} alt="" fill sizes="36px" className="object-cover" />
                              </div>
                              <span className="text-sm font-semibold text-[#F8F8F8]">{t.title as string}</span>
                            </div>
                          </td>
                          <td className="text-sm">{(t.artist as Record<string, string>)?.display_name}</td>
                          <td><span className="badge-genre text-xs">{t.genre as string}</span></td>
                          <td className="text-xs text-[#525252]">{timeAgo(t.created_at as string)}</td>
                          <td>
                            <div className="flex gap-2">
                              <a
                                href={t.audio_url as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#1C1C1C] text-[#525252] hover:text-green-500"
                                title="Preview audio"
                              >
                                <Eye size={13} />
                              </a>
                              <button
                                onClick={() => handleApprove(t.id as string)}
                                disabled={isPending}
                                className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-semibold hover:bg-green-500 hover:text-[#0B0B0B] transition-all disabled:opacity-50"
                              >
                                {isPending ? <Loader2 size={12} className="animate-spin" /> : '✓ Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(t.id as string)}
                                disabled={isPending}
                                className="px-3 py-1.5 rounded-lg bg-red-950/50 text-red-400 text-xs font-semibold hover:bg-red-900 transition-all"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h2 className="font-bold text-[#F8F8F8] mb-4"
                  style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
                All Tracks
              </h2>
              <div className="card overflow-hidden">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      <th>Track</th><th>Artist</th><th>Status</th>
                      <th className="hidden md:table-cell">Plays</th>
                      <th className="hidden lg:table-cell">Boost</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTracks.map(t => (
                      <tr key={t.id as string}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                              <Image src={t.cover_url as string} alt="" fill sizes="36px" className="object-cover" />
                            </div>
                            <span className="text-sm font-semibold text-[#F8F8F8] max-w-[120px] truncate block">
                              {t.title as string}
                            </span>
                          </div>
                        </td>
                        <td className="text-sm">{(t.artist as Record<string, string>)?.display_name}</td>
                        <td>
                          <span className={t.status === 'live' ? 'badge-live text-xs' : 'text-xs text-red-400 capitalize'}>
                            {t.status as string}
                          </span>
                        </td>
                        <td className="hidden md:table-cell text-sm">
                          {formatCount(t.play_count as number)}
                        </td>
                        <td className="hidden lg:table-cell text-sm">
                          {(t.boost_multiplier as number) > 1
                            ? <span className="text-purple-400 text-xs">⚡ {t.boost_multiplier as number}×</span>
                            : <span className="text-[#525252] text-xs">—</span>}
                        </td>
                        <td>
                          {t.status === 'live' && (
                            <Link
                              href={`/track/${t.slug as string}`}
                              target="_blank"
                              className="text-xs text-green-500 hover:underline flex items-center gap-1"
                            >
                              View <ArrowUpRight size={11} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ARTICLES LIST ─────────────────────────────── */}
        {activeTab === 'articles' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#F8F8F8]"
                  style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
                Articles
              </h2>
              <button onClick={() => setActiveTab('write')} className="btn-primary text-sm">
                <Plus size={14} /> Write New Post
              </button>
            </div>
            <div className="card overflow-hidden">
              <table className="admin-table w-full">
                <thead>
                  <tr>
                    <th>Title</th><th>Category</th><th>Status</th>
                    <th className="hidden md:table-cell">Published</th>
                    <th className="hidden lg:table-cell">Views</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-[#525252] py-10">
                        No articles yet. Write your first post!
                      </td>
                    </tr>
                  )}
                  {articles.map(a => (
                    <tr key={a.id as string}>
                      <td className="text-sm font-semibold text-[#F8F8F8] max-w-[200px] truncate">
                        {a.title as string}
                      </td>
                      <td><span className="badge-genre capitalize text-xs">{a.category as string}</span></td>
                      <td>
                        <span className={a.status === 'published' ? 'badge-live text-xs' : 'badge-pending text-xs'}>
                          {a.status as string}
                        </span>
                      </td>
                      <td className="hidden md:table-cell text-xs text-[#525252]">
                        {a.published_at ? formatDate(a.published_at as string) : '—'}
                      </td>
                      <td className="hidden lg:table-cell text-sm">
                        {formatCount(a.view_count as number)}
                      </td>
                      <td>
                        {a.status === 'published' && (
                          <Link href={`/learn/${a.slug as string}`} target="_blank"
                            className="text-xs text-green-500 hover:underline">
                            View →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WRITE ARTICLE ─────────────────────────────── */}
        {activeTab === 'write' && (
          <div className="max-w-4xl space-y-5">
            <h2 className="font-bold text-[#F8F8F8] text-xl"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
              Write New Article
            </h2>

            {articleError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/20 text-sm text-red-400">
                {articleError}
              </div>
            )}

            <div className="card p-6 space-y-5">
              <div>
                <label className="label">Article Title *</label>
                <input
                  className="input text-base font-semibold"
                  placeholder="How to Go Viral on TikTok as a Nigerian Artist…"
                  value={article.title}
                  onChange={e => setArticle(p => ({
                    ...p,
                    title: e.target.value,
                    slug:  createSlug(e.target.value),
                  }))}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">URL Slug</label>
                  <input
                    className="input font-mono text-sm"
                    value={article.slug}
                    onChange={e => setArticle(p => ({ ...p, slug: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={article.category}
                    onChange={e => setArticle(p => ({ ...p, category: e.target.value }))}
                  >
                    <option value="guide">🎯 Artist Guide</option>
                    <option value="platform">📱 Platform Tutorial</option>
                    <option value="industry">📈 Industry Insights</option>
                    <option value="news">📰 News</option>
                    <option value="tutorial">🎓 Tutorial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Excerpt</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Short summary shown in article cards…"
                  value={article.excerpt}
                  onChange={e => setArticle(p => ({ ...p, excerpt: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Cover Image URL</label>
                <input
                  className="input"
                  placeholder="https://…"
                  value={article.coverUrl}
                  onChange={e => setArticle(p => ({ ...p, coverUrl: e.target.value }))}
                />
              </div>
            </div>

            {/* SEO */}
            <div className="card p-5 space-y-4">
              <h3 className="text-xs font-bold text-[#F8F8F8] uppercase tracking-wider">🔍 SEO</h3>
              <div>
                <label className="label">SEO Title</label>
                <input
                  className="input"
                  placeholder="Optimized title for Google (60 chars max)…"
                  value={article.seoTitle}
                  onChange={e => setArticle(p => ({ ...p, seoTitle: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Meta Description <span className="text-[#525252]">(max 160)</span></label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  maxLength={160}
                  placeholder="Description shown in Google results…"
                  value={article.seoDesc}
                  onChange={e => setArticle(p => ({ ...p, seoDesc: e.target.value }))}
                />
                <p className="text-xs text-[#525252] mt-1">{article.seoDesc.length}/160</p>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="featured"
                  checked={article.featured}
                  onChange={e => setArticle(p => ({ ...p, featured: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="featured" className="text-sm text-[#A3A3A3] cursor-pointer">
                  Featured article (shows at top of /learn page)
                </label>
              </div>
            </div>

            {/* TipTap Editor */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-1 p-3 border-b border-[#2A2A2A] bg-[#1C1C1C] flex-wrap">
                {[
                  { icon: Bold,     cmd: () => editor?.chain().focus().toggleBold().run(),     title: 'Bold' },
                  { icon: Italic,   cmd: () => editor?.chain().focus().toggleItalic().run(),   title: 'Italic' },
                  { icon: Heading2, cmd: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), title: 'Heading' },
                  { icon: List,     cmd: () => editor?.chain().focus().toggleBulletList().run(), title: 'List' },
                  { icon: Quote,    cmd: () => editor?.chain().focus().toggleBlockquote().run(), title: 'Quote' },
                ].map(({ icon: Icon, cmd, title }) => (
                  <button
                    key={title}
                    onClick={cmd}
                    title={title}
                    className="p-2 rounded-lg text-[#525252] hover:text-[#F8F8F8] hover:bg-[#161616] transition-colors"
                  >
                    <Icon size={15} />
                  </button>
                ))}
                <div className="w-px h-5 bg-[#2A2A2A] mx-1" />
                <button
                  title="Add link"
                  onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) editor?.chain().focus().setLink({ href: url }).run();
                  }}
                  className="p-2 rounded-lg text-[#525252] hover:text-green-500 hover:bg-[#161616] transition-colors"
                >
                  <LinkIcon size={15} />
                </button>
              </div>
              <div className="bg-[#161616] min-h-[400px]">
                <EditorContent editor={editor} />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => handleSaveArticle('draft')} disabled={savingArt} className="btn-secondary">
                {savingArt ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Draft
              </button>
              <button onClick={() => handleSaveArticle('published')} disabled={savingArt} className="btn-primary">
                {savingArt ? <Loader2 size={15} className="animate-spin" /> : '🚀'}
                Publish
              </button>
            </div>
          </div>
        )}

        {/* ── BOOSTS ────────────────────────────────────── */}
        {activeTab === 'boosts' && (
          <div>
            <h2 className="font-bold text-[#F8F8F8] mb-5"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
              Boost Promotions
            </h2>
            <div className="card overflow-hidden">
              <table className="admin-table w-full">
                <thead>
                  <tr>
                    <th>Track</th><th>Artist</th><th>Plan</th>
                    <th>Amount</th><th>Status</th>
                    <th className="hidden md:table-cell">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {boosts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-[#525252] py-10">No boosts yet</td>
                    </tr>
                  )}
                  {boosts.map(b => (
                    <tr key={b.id as string}>
                      <td className="text-sm font-medium text-[#F8F8F8]">
                        {(b.track as Record<string, string>)?.title}
                      </td>
                      <td className="text-sm">{(b.artist as Record<string, string>)?.display_name}</td>
                      <td><span className="badge-genre capitalize text-xs">{b.plan as string}</span></td>
                      <td className="text-sm">{formatNaira(b.amount_ngn as number)}</td>
                      <td>
                        <span className={b.status === 'active' ? 'badge-boost text-xs' : 'text-xs text-[#525252] capitalize'}>
                          {b.status as string}
                        </span>
                      </td>
                      <td className="hidden md:table-cell text-xs text-[#525252]">
                        {b.end_date ? formatDate(b.end_date as string) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
