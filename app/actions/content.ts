'use server';

import { createAdminSupabase } from '@/lib/supabase/server';

// ── Contact form ──────────────────────────────────────────────────────────
export type ContactState =
  | { status: 'idle' }
  | { status: 'success'; name: string }
  | { status: 'error'; message: string };

export async function contactFormAction(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name    = (formData.get('name')    as string | null)?.trim() ?? '';
  const email   = (formData.get('email')   as string | null)?.trim() ?? '';
  const topic   = (formData.get('topic')   as string | null)?.trim() ?? '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';

  // Validation
  if (!name)    return { status: 'error', message: 'Name is required.' };
  if (!email)   return { status: 'error', message: 'Email is required.' };
  if (!message) return { status: 'error', message: 'Message is required.' };
  if (message.length < 20)
    return { status: 'error', message: 'Please write at least 20 characters.' };

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { status: 'error', message: 'Please enter a valid email address.' };

  // Honeypot / simple spam check
  if (message.includes('http') && message.split('http').length > 3)
    return { status: 'error', message: 'Your message was flagged as spam.' };

  try {
    const admin = createAdminSupabase();

    // Store in DB (optional — a contact_messages table)
    // For now, notify all admin users
    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins?.length) {
      await admin.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          type:    'contact_message',
          title:   `📧 New message from ${name}`,
          body:    `Topic: ${topic || 'General'} | ${message.slice(0, 120)}…`,
          link:    '/admin',
        }))
      );
    }

    return { status: 'success', name };
  } catch (err: unknown) {
    console.error('[Contact action]', err);
    return { status: 'error', message: 'Failed to send. Please email us directly at hello@urbangist.com.ng' };
  }
}

// ── Article view increment ────────────────────────────────────────────────
export async function incrementArticleView(articleId: string) {
  const admin = createAdminSupabase();
  await admin.rpc('increment_article_view', { p_article_id: articleId });
}

// ── Publish / Draft article (admin) ──────────────────────────────────────
export type ArticleState =
  | { status: 'idle' }
  | { status: 'success'; slug: string }
  | { status: 'error'; message: string };

export async function saveArticleAction(
  _prev: ArticleState,
  formData: FormData
): Promise<ArticleState> {
  // Server-side admin check
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const { revalidatePath, revalidateTag } = await import('next/cache');

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Unauthorized' };

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin')
    return { status: 'error', message: 'Admin access required.' };

  const title       = (formData.get('title')    as string)?.trim() ?? '';
  const slug        = (formData.get('slug')     as string)?.trim() ?? '';
  const excerpt     = (formData.get('excerpt')  as string)?.trim() || null;
  const content     = (formData.get('content')  as string)?.trim() ?? '';
  const category    = (formData.get('category') as string)?.trim() ?? 'guide';
  const coverUrl    = (formData.get('coverUrl') as string)?.trim() || null;
  const seoTitle    = (formData.get('seoTitle') as string)?.trim() || null;
  const seoDesc     = (formData.get('seoDesc')  as string)?.trim() || null;
  const featured    = formData.get('featured') === 'true';
  const status      = (formData.get('status')   as 'draft' | 'published') ?? 'draft';

  if (!title)   return { status: 'error', message: 'Title is required.' };
  if (!content) return { status: 'error', message: 'Content is required.' };
  if (!slug)    return { status: 'error', message: 'Slug is required.' };

  const { error } = await admin.from('articles').insert({
    author_id:       user.id,
    title, slug, excerpt, content, category,
    cover_url:       coverUrl,
    seo_title:       seoTitle,
    seo_description: seoDesc,
    featured, status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  });

  if (error) {
    if (error.code === '23505')
      return { status: 'error', message: 'An article with this slug already exists.' };
    return { status: 'error', message: error.message };
  }

  revalidateTag('articles');
  revalidatePath('/learn');
  revalidatePath(`/learn/${slug}`);

  return { status: 'success', slug };
}
