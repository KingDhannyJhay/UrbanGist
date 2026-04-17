// ============================================================
// UrbanGist — Shared TypeScript Types
// ============================================================

export type UserRole = 'artist' | 'admin' | 'listener';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  slug: string;
  role: UserRole;
  verified: boolean;
  social_links: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  created_at: string;
  updated_at: string;
}

export type TrackStatus = 'pending' | 'live' | 'rejected' | 'takedown';

export interface Track {
  id: string;
  artist_id: string;
  title: string;
  slug: string;
  genre: string;
  subgenre?: string;
  cover_url: string;
  audio_url: string;
  duration_sec?: number;
  description?: string;
  lyrics?: string;
  release_date?: string;
  seo_title?: string;
  seo_description?: string;
  status: TrackStatus;
  rejection_note?: string;
  play_count: number;
  share_count: number;
  like_count: number;
  rank_score: number;
  boost_multiplier: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface LiveTrack extends Track {
  artist_name: string;
  artist_slug: string;
  artist_avatar: string | null;
  artist_verified: boolean;
}

export type EventType = 'play' | 'share' | 'like' | 'download';
export type EventSource = 'direct' | 'whatsapp' | 'instagram' | 'tiktok' | 'twitter' | 'qr' | 'other';

export interface TrackEvent {
  id: string;
  track_id: string;
  event_type: EventType;
  source: EventSource;
  user_id?: string;
  session_id?: string;
  completed?: boolean;
  progress_pct?: number;
  country_code?: string;
  created_at: string;
}

export type BoostPlan = 'basic' | 'standard' | 'premium';

export interface BoostPlanConfig {
  price: number;
  hours: number;
  multiplier: number;
  label: string;
  description: string;
  badge?: string;
}

export const BOOST_PLANS: Record<BoostPlan, BoostPlanConfig> = {
  basic: {
    price: 1000,
    hours: 24,
    multiplier: 2.0,
    label: 'Basic Boost',
    description: '24-hour visibility boost',
    badge: '🔥',
  },
  standard: {
    price: 3000,
    hours: 72,
    multiplier: 3.5,
    label: 'Standard Boost',
    description: '3-day ranking power-up',
    badge: '⚡',
  },
  premium: {
    price: 5000,
    hours: 168,
    multiplier: 6.0,
    label: 'Premium Boost',
    description: '7-day featured placement',
    badge: '👑',
  },
};

export type PromoStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'failed';

export interface Promotion {
  id: string;
  track_id: string;
  artist_id: string;
  plan: BoostPlan;
  amount_ngn: number;
  boost_multiplier: number;
  duration_hours: number;
  start_date?: string;
  end_date?: string;
  status: PromoStatus;
  paystack_ref?: string;
  paystack_txn_id?: string;
  paid_at?: string;
  created_at: string;
}

export type ArticleCategory = 'guide' | 'platform' | 'industry' | 'news' | 'tutorial';
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_url?: string;
  category: ArticleCategory;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  status: ArticleStatus;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  // Joined
  author?: Profile;
}

export interface TrackAnalytics {
  track_id: string;
  total_plays: number;
  total_shares: number;
  total_likes: number;
  completed_plays: number;
  completion_rate: number;
  from_whatsapp: number;
  from_instagram: number;
  from_tiktok: number;
  from_qr: number;
  first_event?: string;
  last_event?: string;
}

export const GENRES = [
  'Afrobeats',
  'Afrorap',
  'Amapiano',
  'Gospel',
  'Afropop',
  'Highlife',
  'Fuji',
  'Afrojuju',
  'R&B',
  'Hip-Hop',
  'Dancehall',
  'Afro-Soul',
  'Alternative',
  'Pop',
] as const;

export type Genre = (typeof GENRES)[number];

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}
