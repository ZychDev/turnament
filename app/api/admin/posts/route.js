import { readDb, createPost, deletePost } from '@/lib/db';
import { bumpVersion } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function checkAuth(req) {
  const auth = req.headers.get('authorization');
  const { config } = await readDb();
  const pwd = config?.adminPassword || process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
  return auth === `Bearer ${pwd}`;
}

export async function POST(req) {
  if (!(await checkAuth(req))) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, content, mediaUrl, mediaType } = await req.json();
  if (!title || title.length < 1) return Response.json({ error: 'Title required' }, { status: 400 });
  if (title.length > 100) return Response.json({ error: 'Title too long (max 100)' }, { status: 400 });

  await createPost(title, content, mediaUrl, mediaType);
  bumpVersion();
  return Response.json({ success: true });
}

export async function DELETE(req) {
  if (!(await checkAuth(req))) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: 'Missing post id' }, { status: 400 });

  await deletePost(id);
  bumpVersion();
  return Response.json({ success: true });
}
