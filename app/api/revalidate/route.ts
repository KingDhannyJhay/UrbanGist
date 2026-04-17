import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'crypto';

/**
 * POST /api/revalidate
 * On-demand cache invalidation secured with WEBHOOK_SECRET.
 * Body: { "tag": "tracks" } | { "path": "/trending" }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token      = authHeader.replace(/^Bearer\s+/i, '').trim();
  const secret     = process.env.WEBHOOK_SECRET ?? '';

  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured — WEBHOOK_SECRET not set.' }, { status: 500 });
  }

  // Timing-safe comparison
  let valid = false;
  try {
    const a = Buffer.from(token.padEnd(secret.length));
    const b = Buffer.from(secret.padEnd(token.length));
    valid   = a.length === b.length && timingSafeEqual(a, b) && token.length === secret.length;
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { tag?: string; path?: string };
  try { body = await request.json() as { tag?: string; path?: string }; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { tag, path } = body;

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag });
  }

  if (path) {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  }

  return NextResponse.json({ error: 'Provide either tag or path in request body.' }, { status: 400 });
}
