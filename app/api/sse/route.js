import { readDb, getVersion } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      let lastVersion = 0;

      const send = () => {
        if (closed) return;
        try {
          const v = getVersion();
          if (v !== lastVersion) {
            lastVersion = v;
            const db = readDb();
            const { config, teams, bracket } = db;
            const data = JSON.stringify({ tournamentName: config.tournamentName, teams, bracket, version: v });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        } catch (e) {
          // ignore
        }
      };

      // Send initial data
      send();

      // Poll every 2 seconds
      const interval = setInterval(send, 2000);

      // Keep alive every 30s
      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch { /* ignore */ }
      }, 30000);

      // Cleanup after 5 minutes (reconnect)
      setTimeout(() => {
        closed = true;
        clearInterval(interval);
        clearInterval(keepAlive);
        try { controller.close(); } catch { /* ignore */ }
      }, 300000);
    },
    cancel() {
      closed = true;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
