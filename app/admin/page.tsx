import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminSupabase();

  // Verify admin role
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  // Fetch all admin data in parallel
  const [pendingRes, allTracksRes, articlesRes, boostsRes] = await Promise.all([
    admin
      .from('tracks')
      .select('*, artist:profiles(display_name, slug)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin
      .from('tracks')
      .select('*, artist:profiles(display_name, slug)')
      .in('status', ['live', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('articles')
      .select('*, author:profiles(display_name)')
      .order('created_at', { ascending: false }),
    admin
      .from('promotions')
      .select('*, track:tracks(title), artist:profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  // Platform stats
  const [liveCount, artistCount, playCount, allBoostsRes] = await Promise.all([
    admin.from('tracks').select('id', { count: 'exact', head: true }).eq('status', 'live'),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('track_events').select('id', { count: 'exact', head: true }).eq('event_type', 'play'),
    admin.from('promotions').select('amount_ngn').in('status', ['active', 'expired']),
  ]);

  const revenue = (allBoostsRes.data ?? []).reduce(
    (sum: number, p: { amount_ngn: number }) => sum + p.amount_ngn,
    0
  );

  return (
    <AdminClient
      pendingTracks={(pendingRes.data ?? []) as Record<string, unknown>[]}
      allTracks={(allTracksRes.data ?? []) as Record<string, unknown>[]}
      articles={(articlesRes.data ?? []) as Record<string, unknown>[]}
      boosts={(boostsRes.data ?? []) as Record<string, unknown>[]}
      stats={{
        liveTracks:   liveCount.count   ?? 0,
        totalArtists: artistCount.count ?? 0,
        totalPlays:   playCount.count   ?? 0,
        revenue,
      }}
    />
  );
}
