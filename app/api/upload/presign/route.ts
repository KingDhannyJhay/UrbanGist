import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import crypto from 'crypto';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
]);
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
  'audio/flac', 'audio/aac', 'audio/ogg', 'audio/webm', 'audio/mp4',
]);

/**
 * POST /api/upload/presign
 *
 * Returns signed upload URLs for cover art and audio.
 * Files upload DIRECTLY from the browser to Supabase Storage —
 * they never pass through Vercel, so there is no 4.5MB body limit.
 *
 * Body: { coverType: string, audioType: string }
 * Returns: { uploadId, cover: { signedUrl, path }, audio: { signedUrl, path } }
 */
export async function POST(request: NextRequest) {
  // 1. Rate limit
  const ip    = getClientIp(request);
  const limit = checkRateLimit(`presign:${ip}`, RATE_LIMITS.upload);
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 });
  }

  // 2. Auth check — must be logged in
  const authSb = createServerSupabase();
  const { data: { user } } = await authSb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // 3. Parse body
  let body: { coverType?: string; audioType?: string };
  try { body = await request.json() as { coverType?: string; audioType?: string }; }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }

  const { coverType, audioType } = body;

  // 4. Validate MIME types
  if (!coverType || !ALLOWED_IMAGE_TYPES.has(coverType)) {
    return NextResponse.json({ error: `Cover must be JPEG, PNG, or WebP. Received: ${coverType ?? 'none'}` }, { status: 400 });
  }
  if (!audioType || !ALLOWED_AUDIO_TYPES.has(audioType)) {
    return NextResponse.json({ error: `Audio must be MP3, WAV, FLAC, or AAC. Received: ${audioType ?? 'none'}` }, { status: 400 });
  }

  // 5. Build storage paths
  const uploadId  = crypto.randomUUID();
  const coverExt  = mimeToExt(coverType, 'jpg');
  const audioExt  = mimeToExt(audioType, 'mp3');
  const coverPath = `${user.id}/${uploadId}-cover.${coverExt}`;
  const audioPath = `${user.id}/${uploadId}-audio.${audioExt}`;

  // 6. Generate signed upload URLs (60 minute expiry)
  const admin = createAdminSupabase();

  const [coverRes, audioRes] = await Promise.all([
    admin.storage.from('track-covers').createSignedUploadUrl(coverPath, { upsert: false }),
    admin.storage.from('track-audio').createSignedUploadUrl(audioPath, { upsert: false }),
  ]);

  if (coverRes.error) {
    console.error('[presign] cover URL error:', coverRes.error.message);
    return NextResponse.json({ error: 'Failed to generate cover upload URL.' }, { status: 500 });
  }
  if (audioRes.error) {
    console.error('[presign] audio URL error:', audioRes.error.message);
    return NextResponse.json({ error: 'Failed to generate audio upload URL.' }, { status: 500 });
  }

  return NextResponse.json({
    uploadId,
    cover: {
      signedUrl: coverRes.data.signedUrl,
      path:      coverPath,
    },
    audio: {
      signedUrl: audioRes.data.signedUrl,
      path:      audioPath,
    },
  });
}

function mimeToExt(mime: string, fallback: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg':  'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/mp3':  'mp3',
    'audio/wav':  'wav',
    'audio/wave': 'wav',
    'audio/flac': 'flac',
    'audio/aac':  'aac',
    'audio/ogg':  'ogg',
    'audio/webm': 'webm',
    'audio/mp4':  'm4a',
  };
  return map[mime] ?? fallback;
}
