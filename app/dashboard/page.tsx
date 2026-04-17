import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import type { Track, Promotion, TrackAnalytics, Profile } from '@/types';
import DashboardClient from './DashboardClient';

// Force dynamic — uses session cookies
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Auth check — middleware handles redirect but we double-check here
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminSupabase();

  const [tracksRes, promoRes, profileRes] = await Promise.all([
    admin
      .from('tracks')
      .select('*')
      .eq('artist_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('promotions')
      .select('*')
      .eq('artist_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ]);

  const tracks     = (tracksRes.data ?? []) as Track[];
  const promotions = (promoRes.data   ?? []) as Promotion[];
  const profile    = profileRes.data as Profile | null;

  // Analytics for all artist tracks
  const trackIds = tracks.map(t => t.id);
  const analytics: TrackAnalytics[] = [];

  if (trackIds.length > 0) {
    const { data } = await admin
      .from('v_track_analytics')
      .select('*')
      .in('track_id', trackIds);
    if (data) analytics.push(...(data as TrackAnalytics[]));
  }

  return (
    <DashboardClient
      tracks={tracks}
      promotions={promotions}
      analytics={analytics}
      profile={profile}
    />
  );
}
