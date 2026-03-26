import { createPost, deletePost } from '@/lib/db';
import { bumpVersion } from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!(await checkAuth(req))) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Request too large or invalid JSON' }, { status: 400 }); }
  const { title, content, mediaUrl, mediaType } = body;
  if (!title || title.length < 1) return Response.json({ error: 'Title required' }, { status: 400 });
  if (title.length > 100) return Response.json({ error: 'Title too long (max 100)' }, { status: 400 });

  // Validate mediaUrl if provided
  if (mediaUrl) {
    const urlLower = mediaUrl.toLowerCase().trim();
    const isDataImage = urlLower.startsWith('data:image/');
    if (!isDataImage) {
      if (urlLower.startsWith('javascript:') || urlLower.startsWith('data:') || urlLower.startsWith('vbscript:')) {
        return Response.json({ error: 'Invalid media URL' }, { status: 400 });
      }
    }
  }

  // Allow larger size for base64 images (up to 2MB)
  const maxMediaLen = mediaUrl?.startsWith('data:image/') ? 2_000_000 : 500;
  await createPost(title, content?.slice(0, 5000), mediaUrl?.slice(0, maxMediaLen), mediaType);
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
