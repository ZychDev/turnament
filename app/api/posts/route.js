import { readPosts, reactToPost, readPostComments, addPostComment } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { sanitize } from '@/lib/sanitize';

const reactLimiter = rateLimit(30, 60000);
const commentLimiter = rateLimit(10, 60000);

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('comments');

    if (postId) {
      const comments = await readPostComments(parseInt(postId));
      return Response.json({ comments }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const posts = await readPosts();
    return Response.json({ posts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('GET /api/posts error:', e);
    return Response.json({ error: e.message, posts: [] }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.type === 'reaction') {
      const rl = reactLimiter(req);
      if (!rl.success) return Response.json({ error: 'Too fast' }, { status: 429 });

      const { postId, emoji } = body;
      if (!postId || !emoji) return Response.json({ error: 'Missing fields' }, { status: 400 });

      const reactions = await reactToPost(parseInt(postId), emoji);
      if (!reactions) return Response.json({ error: 'Post not found' }, { status: 404 });
      return Response.json({ reactions });
    }

    if (body.type === 'comment') {
      const rl = commentLimiter(req);
      if (!rl.success) return Response.json({ error: 'Too many comments' }, { status: 429 });

      const { postId, nickname, message } = body;
      if (!postId || !nickname || !message) return Response.json({ error: 'Missing fields' }, { status: 400 });
      if (nickname.length > 20 || message.length > 300) return Response.json({ error: 'Too long' }, { status: 400 });

      await addPostComment(parseInt(postId), sanitize(nickname), sanitize(message));
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e) {
    console.error('POST /api/posts error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
