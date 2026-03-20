import { readDb, writeDb } from '@/lib/db';
import { getAccountByRiotId, parseRiotId, getSummonerByPuuid } from '@/lib/riot';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  // Rate limit: 5 registrations per hour per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rl = checkRateLimit(`register:${ip}`, 5, 3600000);
  if (!rl.allowed) return Response.json({ error: 'Too many registrations. Try again later.' }, { status: 429 });

  try {
    const body = await req.json();
    const { teamName, teamTag, captainDiscord, players } = body;

    // Validate
    if (!teamName || teamName.length < 2 || teamName.length > 30) {
      return Response.json({ error: 'Team name must be 2-30 characters' }, { status: 400 });
    }
    if (!teamTag || teamTag.length < 2 || teamTag.length > 5) {
      return Response.json({ error: 'Team tag must be 2-5 characters' }, { status: 400 });
    }
    if (!captainDiscord || captainDiscord.length < 2) {
      return Response.json({ error: 'Discord nick is required' }, { status: 400 });
    }
    if (!players || players.length < 5 || players.length > 6) {
      return Response.json({ error: 'Team must have 5-6 players' }, { status: 400 });
    }

    // Check max 8 teams
    const { teams, config } = await readDb();
    if (teams.length >= 8) {
      return Response.json({ error: 'Tournament is full (max 8 teams)' }, { status: 400 });
    }

    // Check duplicate team name/tag
    if (teams.some(t => t.name.toLowerCase() === teamName.toLowerCase())) {
      return Response.json({ error: 'Team name already taken' }, { status: 400 });
    }
    if (teams.some(t => t.tag.toLowerCase() === teamTag.toLowerCase())) {
      return Response.json({ error: 'Team tag already taken' }, { status: 400 });
    }

    // Validate players and verify Riot accounts
    const validatedPlayers = [];
    const errors = [];
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.summonerName || !p.role) {
        errors.push(`Player ${i + 1}: missing name or role`);
        continue;
      }

      // Verify Riot account exists (if API key available)
      let verified = false;
      if (process.env.RIOT_API_KEY) {
        try {
          const { gameName, tagLine } = parseRiotId(p.summonerName);
          const account = await getAccountByRiotId(gameName, tagLine);
          if (account) {
            verified = true;
          } else {
            errors.push(`Player ${i + 1} (${p.summonerName}): account not found on Riot servers`);
          }
        } catch (e) {
          // Don't block registration on API errors
          verified = true;
        }
      } else {
        verified = true;
      }

      if (verified) {
        validatedPlayers.push({
          summonerName: p.summonerName.trim(),
          role: p.role,
          captain: i === 0,
          opgg: p.summonerName.includes('#') ? p.summonerName.split('#')[0] : p.summonerName,
        });
      }
    }

    if (errors.length > 0) {
      return Response.json({ error: errors.join('; ') }, { status: 400 });
    }

    if (validatedPlayers.length < 5) {
      return Response.json({ error: 'Need at least 5 verified players' }, { status: 400 });
    }

    // Save the registration (pending admin approval)
    const registration = {
      id: `reg-${Date.now()}`,
      teamName,
      teamTag: teamTag.toUpperCase(),
      captainDiscord,
      players: validatedPlayers,
      submittedAt: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
    };

    // Store in config as pending registrations
    const pendingRegs = config?.pendingRegistrations || [];
    pendingRegs.push(registration);
    await writeDb({ config: { ...config, pendingRegistrations: pendingRegs } });

    return Response.json({ success: true, message: 'Registration submitted! Waiting for admin approval.' });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const { config } = await readDb();
  const registrations = (config?.pendingRegistrations || []).map(r => ({
    teamName: r.teamName,
    teamTag: r.teamTag,
    playerCount: r.players.length,
    submittedAt: r.submittedAt,
    status: r.status,
  }));
  return Response.json({ registrations }, { headers: { 'Cache-Control': 'no-store' } });
}
