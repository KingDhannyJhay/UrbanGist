'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createTrackSlug } from '@/lib/utils';
import { GENRES } from '@/types';

export type SaveTrackState =
  | { status: 'idle' }
  | { status: 'success'; slug: string; trackId: string }
  | { status: 'error'; message: string };

/**
 * Server Action: save track metadata after files have been
 * uploaded DIRECTLY to Supabase Storage by the browser.
 * Payload is text-only — no file bytes, no size limit issues.
 */
export async function saveTrackMetadataAction(
  _prev: SaveTrackState,
  formData: FormData
): Promise<SaveTrackState> {
  // 1. Auth check
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'You must be signed in to upload.' };

  // 2. Extract text fields
  const title       = (formData.get('title')      as string | null)?.trim() ?? '';
  const genre       = (formData.get('genre')      as string | null)?.trim() ?? '';
  const subgenre    = (formData.get('subgenre')   as string | null)?.trim() || null;
  const description = (formData.get('description') as string | null)?.trim() || null;
  const lyrics      = (formData.get('lyrics')     as string | null)?.trim() || null;
  const coverPath   = (formData.get('coverPath')  as string | null)?.trim() ?? '';
  const audioPath   = (formData.get('audioPath')  as string | null)?.trim() ?? '';

  // 3. Validate
  if (!title)     return { status: 'error', message: 'Track title is required.' };
  if (title.length > 100) return { status: 'error', message: 'Title must be under 100 characters.' };
  if (!genre)     return { status: 'error', message: 'Genre is required.' };
  if (!coverPath) return { status: 'error', message: 'Cover art upload is required.' };
  if (!audioPath) return { status: 'error', message: 'Audio file upload is required.' };

  // Validate genre is one of our allowed values
  const validGenres = GENRES as readonly string[];
  if (!validGenres.includes(genre)) {
    return { status: 'error', message: 'Invalid genre selected.' };
  }

  const admin = createAdminSupabase();

  // 4. Get artist profile
  const { data: profile } = await admin
    .from('profiles')
    .select('slug, display_name')
    .eq('id', user.id)
    .single();

  if (!profile) return { status: 'error', message: 'Artist profile not found.' };

  // 5. Generate SEO slug
  const artistName = profile.display_name || profile.slug;
  const slug       = createTrackSlug(title, artistName);

  // 6. Check uniqueness
  const { data: existing } = await admin
    .from('tracks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return { status: 'error', message: 'A track with this title already exists. Try a slightly different title.' };
  }

  // 7. Build public URLs from storage paths
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const coverUrl    = `${supabaseUrl}/storage/v1/object/public/track-covers/${coverPath}`;
  const audioUrl    = `${supabaseUrl}/storage/v1/object/public/track-audio/${audioPath}`;

  // 8. Insert track record
  const { data: track, error: insertErr } = await admin
    .from('tracks')
    .insert({
      artist_id:   user.id,
      title,
      slug,
      genre,
      subgenre,
      description,
      lyrics,
      cover_url:   coverUrl,
      audio_url:   audioUrl,
      status:      'pending',
    })
    .select('id, slug')
    .single();

  if (insertErr) {
    console.error('[saveTrackMetadata]', insertErr.message);
    return { status: 'error', message: 'Failed to save track. Please try again.' };
  }

  // 9. Notify admins
  const { data: admins } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (admins?.length) {
    await admin.from('notifications').insert(
      admins.map(a => ({
        user_id: a.id,
        type:    'new_track_pending',
        title:   '🎵 New track pending review',
        body:    `"${title}" by ${artistName} is awaiting approval`,
        link:    '/admin',
      }))
    );
  }

  revalidateTag('tracks');
  revalidatePath('/dashboard');

  return { status: 'success', slug: track.slug, trackId: track.id };
}

// ── Admin: Approve track ──────────────────────────────────────────────────
export async function approveTrackAction(trackId: string): Promise<{ error?: string }> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin access required.' };

  const { error } = await admin
    .from('tracks')
    .update({ status: 'live', published_at: new Date().toISOString() })
    .eq('id', trackId);

  if (error) return { error: error.message };

  const { data: track } = await admin
    .from('tracks').select('slug, artist_id, title').eq('id', trackId).single();

  if (track) {
    await admin.from('notifications').insert({
      user_id: track.artist_id,
      type:    'track_approved',
      title:   '✅ Your track is live!',
      body:    `"${track.title}" has been approved and is now discoverable on UrbanGist.`,
      link:    `/track/${track.slug}`,
    });
    revalidateTag('tracks');
    revalidateTag(`track-${track.slug}`);
    revalidatePath('/');
    revalidatePath('/trending');
  }

  return {};
}

// ── Admin: Reject track ───────────────────────────────────────────────────
export async function rejectTrackAction(
  trackId: string,
  reason: string
): Promise<{ error?: string }> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin access required.' };

  const { error } = await admin
    .from('tracks')
    .update({ status: 'rejected', rejection_note: reason || null })
    .eq('id', trackId);

  if (error) return { error: error.message };

  const { data: track } = await admin
    .from('tracks').select('artist_id, title').eq('id', trackId).single();

  if (track) {
    await admin.from('notifications').insert({
      user_id: track.artist_id,
      type:    'track_rejected',
      title:   '⚠️ Track not approved',
      body:    reason
        ? `Rejection reason: ${reason}`
        : 'Your track did not meet our quality guidelines. Please review and resubmit.',
      link:    '/dashboard',
    });
  }

  revalidateTag('tracks');
  return {};
}
