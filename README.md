# UrbanGist 🎵
### Nigeria's Music Discovery, Promotion & Education Platform

> Stream, discover and boost Afrobeats, Amapiano, Afrorap & Gospel.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

---

## Platform Modules

| Module | Route | Description |
|--------|-------|-------------|
| 🎧 UrbanGist Music | `/`, `/trending` | Discovery feed ranked by plays × shares × boosts |
| ⚡ UrbanGist Boost | `/boost` | Paid promotion: ₦1,000–₦5,000, 2×–6× rank multiplier |
| 📊 UrbanGist Studio | `/dashboard` | Artist analytics: plays, sources, completion rates |
| 📱 UrbanGist Share | `/track/[slug]` | QR codes + shareable links for WhatsApp/Instagram/TikTok |
| 📚 Learn on UrbanGist | `/learn` | SEO blog: artist guides, industry insights, tutorials |

## Tech Stack

- **Frontend:** Next.js 14 App Router, TailwindCSS, Syne + DM Sans fonts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Payments:** Paystack (inline checkout + webhook)
- **Hosting:** Vercel (ISR, Cron, Edge)
- **Security:** Middleware auth, rate limiting, HMAC webhooks, hashed IPs

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.local.example .env.local
# Fill in your Supabase and Paystack keys

# 3. Run database schema
# Paste supabase/schema.sql into Supabase SQL Editor, then
# Paste supabase/supplementary.sql

# 4. Start development server
npm run dev

# Open http://localhost:3000
```

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete beginner guide covering:
- Supabase setup (database, auth, storage)
- Paystack integration (webhook configuration)
- Vercel deployment + custom domain
- First admin setup
- Testing checklist

## Architecture Highlights

### Ranking Engine (`lib/trending.ts`)
```
score = (plays×1 + shares×4 + likes×2)
      × e^(-0.693 × ageHours / 72)    ← half-life decay
      × boostMultiplier                ← 1× to 6×
      × completionBonus                ← 1.2× if >80% listened
```
Recalculated on every event + Vercel Cron every 30 minutes.

### Cache Strategy
| Page | Strategy | Revalidation |
|------|----------|--------------|
| `/` | ISR 60s | `revalidateTag('tracks')` on approval |
| `/trending` | ISR 30s | `revalidateTag('tracks', 'boosts')` |
| `/track/[slug]` | ISR 30s | On boost/approve/event |
| `/artist/[slug]` | ISR 60s, top 200 pre-rendered | Fallback SSR |
| `/learn/[slug]` | ISR 300s | On article publish |
| `/dashboard` | Dynamic | Suspense streaming |
| `/admin` | Dynamic | Suspense streaming |

### Security Layers
1. **`middleware.ts`** — Route protection at the edge, session refresh
2. **Server Actions** — Server-side file validation, no client-spoofing
3. **Rate limiting** — Sliding window per IP on all public APIs
4. **HMAC webhooks** — Timing-safe Paystack signature verification
5. **Supabase RLS** — Row-level security on every table
6. **Storage policies** — MIME type + size enforcement on buckets

## Project Structure

```
urbangist/
├── app/                    # Next.js App Router
│   ├── actions/            # Server Actions (upload, content, auth)
│   ├── api/                # Route handlers (events, webhook, cron, revalidate)
│   ├── admin/              # Admin panel (approve tracks, write articles)
│   ├── artist/[slug]/      # Artist profiles (SSG top 200)
│   ├── auth/               # Login, signup
│   ├── boost/              # Paystack boost checkout
│   ├── dashboard/          # Artist studio (Suspense PPR)
│   ├── learn/              # Blog listing + article pages
│   ├── track/[slug]/       # Track pages (ISR 30s)
│   ├── trending/           # Trending feed
│   ├── upload/             # Track upload (Server Action)
│   └── [legal pages]/      # Static: about, privacy, terms, etc.
├── components/
│   ├── layout/             # Navigation, Footer
│   ├── player/             # AudioPlayer (full + compact)
│   └── ui/                 # Logo, TrackCard, QRCode, ShareModal
├── lib/
│   ├── trending.ts         # ← Ranking engine
│   ├── rate-limit.ts       # ← Rate limiter
│   ├── utils.ts            # Helpers (slugify, format, share URLs)
│   └── supabase/           # Client + server Supabase clients
├── supabase/
│   ├── schema.sql          # Main database schema + RLS
│   └── supplementary.sql   # RPCs, storage, FTS, indexes
├── middleware.ts           # ← Auth + security at the edge
├── types/index.ts          # Shared TypeScript types
└── vercel.json             # Cron job configuration
```

## License

Private — UrbanGist Media. All rights reserved.
