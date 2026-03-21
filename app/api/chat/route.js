import { readChat, addChatMessage } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { sanitize } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

const checkLimit = rateLimit(20, 60_000);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId');
  if (!matchId) {
    return Response.json({ error: 'matchId is required' }, { status: 400 });
  }
  const messages = await readChat(matchId);
  return Response.json(messages, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req) {
  const { success } = checkLimit(req);
  if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { matchId, nickname, message } = body;

  if (!matchId || !nickname || !message) {
    return Response.json({ error: 'matchId, nickname, and message are required' }, { status: 400 });
  }

  if (nickname.length > 20) {
    return Response.json({ error: 'Nickname must be 20 characters or less' }, { status: 400 });
  }

  if (message.length > 200) {
    return Response.json({ error: 'Message must be 200 characters or less' }, { status: 400 });
  }

  const row = await addChatMessage(matchId, sanitize(nickname), sanitize(message));
  return Response.json(row);
}
