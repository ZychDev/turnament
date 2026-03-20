export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.RIOT_API_KEY;
  const keyInfo = key ? `Set (${key.length} chars, starts: ${key.slice(0, 10)}..., ends: ...${key.slice(-5)})` : 'NOT SET';

  // Try a simple API call
  let testResult = 'not tested';
  if (key) {
    try {
      const res = await fetch('https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Support19/EUNE', {
        headers: { 'X-Riot-Token': key.trim() },
      });
      testResult = `${res.status} ${res.statusText}`;
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        testResult += ` - ${body.slice(0, 300)}`;
      } else {
        const data = await res.json();
        testResult += ` - Found: ${data.gameName}#${data.tagLine}`;
      }
    } catch (e) {
      testResult = `Error: ${e.message}`;
    }
  }

  return Response.json({ keyInfo, testResult }, { headers: { 'Cache-Control': 'no-store' } });
}
