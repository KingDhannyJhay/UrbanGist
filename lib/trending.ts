/**
 * lib/trending.ts — UrbanGist Ranking Engine
 *
 * Pure TypeScript. No native dependencies.
 * Only imported in Server Components and API Routes (never in client components).
 *
 * FORMULA:
 *   raw     = (plays × 1) + (shares × 4) + (likes × 2)
 *   decayed = raw × e^(−ln2 × ageHours / 72)
 *   final   = decayed × boostMultiplier × completionBonus
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const W_PLAY   = 1.0;
const W_SHARE  = 4.0;
const W_LIKE   = 2.0;
const HALF_LIFE_HOURS    = 72;       // score halves every 3 days
const COMPLETION_BONUS   = 1.2;      // 20% lift for tracks >80% listened
const COMPLETION_THRESHOLD = 80;     // percent
const MIN_SCORE          = 0.01;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TrackScoreInput {
  plays:            number;
  shares:           number;
  likes:            number;
  boostMultiplier:  number;
  publishedAt:      string | null;
  createdAt:        string;
  completionRate?:  number;  // 0–100
}

export interface TrackScoreResult {
  finalScore:  number;
  rawScore:    number;
  ageHours:    number;
  decayFactor: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core scoring function — pure, no I/O
// ─────────────────────────────────────────────────────────────────────────────

export function calculateScore(input: TrackScoreInput): TrackScoreResult {
  const { plays, shares, likes, boostMultiplier, publishedAt, createdAt, completionRate } = input;

  const baseline  = new Date(publishedAt ?? createdAt).getTime();
  const ageHours  = Math.max(0, (Date.now() - baseline) / 3_600_000);

  const rawScore  = plays * W_PLAY + shares * W_SHARE + likes * W_LIKE;
  const decay     = Math.exp(-Math.LN2 * (ageHours / HALF_LIFE_HOURS));
  const bonus     = (completionRate ?? 0) >= COMPLETION_THRESHOLD ? COMPLETION_BONUS : 1.0;

  const finalScore = Math.max(MIN_SCORE, rawScore * decay * boostMultiplier * bonus);

  return {
    finalScore:  Math.round(finalScore * 1000) / 1000,
    rawScore,
    ageHours,
    decayFactor: decay,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Server-side recalculation helpers
// These import server-only modules — only call from Route Handlers / Server Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recalculate a single track's score and persist it to the database.
 * Called after every play/share/like/boost event.
 */
export async function recalcSingleScore(trackId: string): Promise<number | null> {
  const { createAdminSupabase } = await import('./supabase/server');

  const admin = createAdminSupabase();
  const { data: track } = await admin
    .from('tracks')
    .select('play_count, share_count, like_count, boost_multiplier, published_at, created_at')
    .eq('id', trackId)
    .eq('status', 'live')
    .single();

  if (!track) return null;

  const { data: analytics } = await admin
    .from('v_track_analytics')
    .select('completion_rate')
    .eq('track_id', trackId)
    .maybeSingle();

  const { finalScore } = calculateScore({
    plays:           track.play_count        ?? 0,
    shares:          track.share_count       ?? 0,
    likes:           track.like_count        ?? 0,
    boostMultiplier: track.boost_multiplier  ?? 1,
    publishedAt:     track.published_at,
    createdAt:       track.created_at,
    completionRate:  analytics?.completion_rate ?? 0,
  });

  await admin
    .from('tracks')
    .update({ rank_score: finalScore, updated_at: new Date().toISOString() })
    .eq('id', trackId);

  return finalScore;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed ordering configuration
// ─────────────────────────────────────────────────────────────────────────────

export type FeedSection = 'trending' | 'new_drops' | 'rising';

export function getFeedOrderConfig(section: FeedSection): {
  orderBy:    string;
  ascending:  boolean;
  timeFilter: number | null;
} {
  switch (section) {
    case 'trending':
      return { orderBy: 'rank_score',  ascending: false, timeFilter: null };
    case 'new_drops':
      return { orderBy: 'published_at', ascending: false, timeFilter: null };
    case 'rising':
      return { orderBy: 'share_count', ascending: false, timeFilter: 72 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Boost impact preview (pure, client-safe)
// ─────────────────────────────────────────────────────────────────────────────

export const BOOST_MULTIPLIERS = {
  basic:    2.0,
  standard: 3.5,
  premium:  6.0,
} as const;

export function previewBoostImpact(
  current: TrackScoreInput,
  plan:    keyof typeof BOOST_MULTIPLIERS,
): { before: number; after: number; lift: string } {
  const before     = calculateScore(current).finalScore;
  const after      = calculateScore({ ...current, boostMultiplier: BOOST_MULTIPLIERS[plan] }).finalScore;
  const pct        = before > 0 ? Math.round(((after - before) / before) * 100) : 0;
  return { before, after, lift: `+${pct}%` };
}
