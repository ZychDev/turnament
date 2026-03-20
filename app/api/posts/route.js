import { readPosts, reactToPost, readPostComments, addPostComment } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('comments');

  if (postId) {
    const comments = await readPostComments(parseInt(postId));
    return Response.json({ comments }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const posts = await readPosts();
  return Response.json({ posts }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const body = await req.json();

  if (body.type === 'reaction') {
    const rl = checkRateLimit(`react:${ip}`, 30, 60000);
    if (!rl.allowed) return Response.json({ error: 'Too fast' }, { status: 429 });

    const { postId, emoji } = body;
    if (!postId || !emoji) return Response.json({ error: 'Missing fields' }, { status: 400 });

    const reactions = await reactToPost(postId, emoji);
    if (!reactions) return Response.json({ error: 'Post not found' }, { status: 404 });
    return Response.json({ reactions });
  }

  if (body.type === 'comment') {
    const rl = checkRateLimit(`postcomment:${ip}`, 10, 60000);
    if (!rl.allowed) return Response.json({ error: 'Too many comments' }, { status: 429 });

    const { postId, nickname, message } = body;
    if (!postId || !nickname || !message) return Response.json({ error: 'Missing fields' }, { status: 400 });
    if (nickname.length > 20 || message.length > 300) return Response.json({ error: 'Too long' }, { status: 400 });

    await addPostComment(postId, nickname.trim(), message.trim());
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid type' }, { status: 400 });
}
