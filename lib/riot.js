// Riot Games API integration
// Docs: https://developer.riotgames.com/

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const EUNE_BASE = 'https://eun1.api.riotgames.com';
const EUROPE_BASE = 'https://europe.api.riotgames.com';
const DDRAGON = 'https://ddragon.leagueoflegends.com';

// Cache DDragon version + champion data
let cachedVersion = null;
let cachedChampions = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour

async function riotFetch(url) {
  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY },
  });
  if (res.status === 404) return null;
  if (res.status === 429) throw new Error('Rate limited by Riot API. Try again in a few seconds.');
  if (!res.ok) throw new Error(`Riot API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Get latest DDragon version
export async function getDDragonVersion() {
  if (cachedVersion && Date.now() - cacheTime < CACHE_TTL) return cachedVersion;
  const versions = await fetch(`${DDRAGON}/api/versions.json`).then(r => r.json());
  cachedVersion = versions[0];
  cacheTime = Date.now();
  return cachedVersion;
}

// Get all champions with icons
export async function getChampions() {
  if (cachedChampions && Date.now() - cacheTime < CACHE_TTL) return cachedChampions;
  const version = await getDDragonVersion();
  const data = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`).then(r => r.json());
  cachedChampions = Object.values(data.data).map(c => ({
    id: c.id,
    name: c.name,
    key: c.key,
    icon: `${DDRAGON}/cdn/${version}/img/champion/${c.id}.png`,
  }));
  return cachedChampions;
}

// Lookup account by Riot ID (gameName#tagLine)
export async function getAccountByRiotId(gameName, tagLine) {
  return riotFetch(`${EUROPE_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
}

// Get summoner by PUUID
export async function getSummonerByPuuid(puuid) {
  return riotFetch(`${EUNE_BASE}/lol/summoner/v4/summoners/by-puuid/${puuid}`);
}

// Get ranked entries for summoner
export async function getRankedEntries(summonerId) {
  return riotFetch(`${EUNE_BASE}/lol/league/v4/entries/by-summoner/${summonerId}`);
}

// Get match IDs for a player (last N matches)
export async function getMatchIds(puuid, count = 10, type = 'ranked') {
  const params = new URLSearchParams({ count: String(count) });
  if (type) params.set('type', type);
  return riotFetch(`${EUROPE_BASE}/lol/match/v5/matches/by-puuid/${puuid}/ids?${params}`);
}

// Get match details
export async function getMatchDetails(matchId) {
  return riotFetch(`${EUROPE_BASE}/lol/match/v5/matches/${matchId}`);
}

// Get current game (live)
export async function getCurrentGame(puuid) {
  return riotFetch(`${EUROPE_BASE}/lol/spectator/v5/active-games/by-summoner/${puuid}`);
}

// ---- High-level helpers ----

// Full player profile (account + summoner + rank + recent matches)
export async function getPlayerProfile(gameName, tagLine) {
  const account = await getAccountByRiotId(gameName, tagLine);
  if (!account) return null;

  const summoner = await getSummonerByPuuid(account.puuid);
  const ranked = await getRankedEntries(summoner.id);

  // Get ranked solo/duo entry
  const soloQ = ranked?.find(e => e.queueType === 'RANKED_SOLO_5x5');
  const flexQ = ranked?.find(e => e.queueType === 'RANKED_FLEX_SR');

  // Recent match IDs (last 5)
  let recentMatchIds = [];
  try {
    recentMatchIds = await getMatchIds(account.puuid, 5, null) || [];
  } catch (e) { /* ignore */ }

  // Fetch match details for recent games
  const recentMatches = [];
  for (const id of recentMatchIds.slice(0, 5)) {
    try {
      const match = await getMatchDetails(id);
      if (match) {
        const player = match.info.participants.find(p => p.puuid === account.puuid);
        if (player) {
          recentMatches.push({
            matchId: id,
            champion: player.championName,
            kills: player.kills,
            deaths: player.deaths,
            assists: player.assists,
            cs: player.totalMinionsKilled + player.neutralMinionsKilled,
            win: player.win,
            role: player.teamPosition,
            gameMode: match.info.gameMode,
            gameDuration: match.info.gameDuration,
            timestamp: match.info.gameCreation,
          });
        }
      }
    } catch (e) { /* skip failed matches */ }
  }

  // Check if currently in game
  let inGame = null;
  try {
    const current = await getCurrentGame(account.puuid);
    if (current) {
      const participant = current.participants?.find(p => p.puuid === account.puuid);
      inGame = {
        champion: participant?.championId,
        gameMode: current.gameMode,
        gameLength: current.gameLength,
      };
    }
  } catch (e) { /* not in game */ }

  const version = await getDDragonVersion();

  return {
    gameName: account.gameName,
    tagLine: account.tagLine,
    puuid: account.puuid,
    summonerLevel: summoner.summonerLevel,
    profileIconUrl: `${DDRAGON}/cdn/${version}/img/profileicon/${summoner.profileIconId}.png`,
    soloQ: soloQ ? {
      tier: soloQ.tier,
      rank: soloQ.rank,
      lp: soloQ.leaguePoints,
      wins: soloQ.wins,
      losses: soloQ.losses,
      winRate: ((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100).toFixed(1),
    } : null,
    flexQ: flexQ ? {
      tier: flexQ.tier,
      rank: flexQ.rank,
      lp: flexQ.leaguePoints,
      wins: flexQ.wins,
      losses: flexQ.losses,
      winRate: ((flexQ.wins / (flexQ.wins + flexQ.losses)) * 100).toFixed(1),
    } : null,
    recentMatches,
    inGame,
  };
}

// Parse "Nick#TAG" or "Nick" (default tag EUW/EUNE)
export function parseRiotId(input) {
  const trimmed = (input || '').trim();
  if (trimmed.includes('#')) {
    const [gameName, tagLine] = trimmed.split('#');
    return { gameName: gameName.trim(), tagLine: tagLine.trim() };
  }
  // Default to EUNE tag
  return { gameName: trimmed, tagLine: 'EUNE' };
}

// Tier to number for comparison
const TIER_ORDER = { IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4, EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9 };
const RANK_ORDER = { IV: 0, III: 1, II: 2, I: 3 };

export function isDiamondPlus(tier) {
  return TIER_ORDER[tier] >= TIER_ORDER.DIAMOND;
}

export function tierToNumber(tier, rank) {
  return (TIER_ORDER[tier] || 0) * 4 + (RANK_ORDER[rank] || 0);
}
