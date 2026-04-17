import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import slugify from 'slugify';
import { formatDistanceToNow, format } from 'date-fns';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// SEO-safe slug generator
export function createSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
    replacement: '-',
  });
}

// Track slug: "lambo-by-artist-name"
export function createTrackSlug(title: string, artistName: string): string {
  return createSlug(`${title}-by-${artistName}`);
}

// Format number with K/M suffixes
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// Format currency in Naira
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

// Format duration seconds → mm:ss
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Relative time
export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

// Date display
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

// SEO description truncation
export function truncate(str: string, maxLen: number = 160): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3).trimEnd() + '…';
}

// Generate canonical track URL
export function trackUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/track/${slug}`;
}

// Generate canonical artist URL
export function artistUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/artist/${slug}`;
}

// Build shareable URLs with UTM source
export function buildShareUrl(trackSlug: string, source: string): string {
  const base = trackUrl(trackSlug);
  return `${base}?ref=${source}`;
}

// WhatsApp share link
export function whatsappShareLink(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
}

// Twitter/X share link
export function twitterShareLink(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

// Generate Paystack reference
export function generatePaystackRef(prefix = 'UG'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Detect UTM source from URL
export function detectSource(url: string): string {
  if (url.includes('ref=whatsapp')) return 'whatsapp';
  if (url.includes('ref=instagram')) return 'instagram';
  if (url.includes('ref=tiktok')) return 'tiktok';
  if (url.includes('ref=twitter')) return 'twitter';
  if (url.includes('ref=qr')) return 'qr';
  return 'direct';
}

// Safe image URL with fallback
export function safeImgUrl(url?: string | null, fallback = '/images/default-cover.jpg'): string {
  if (!url || url.trim() === '') return fallback;
  return url;
}
