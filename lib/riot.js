// Riot Games API integration
// Docs: https://developer.riotgames.com/

// Read at call time, not module load time (env might not be ready at import)
function getApiKey() {
  return (process.env.RIOT_API_KEY || '').trim();
}
const EUNE_BASE = 'https://eun1.api.riotgames.com';
const EUROPE_BASE = 'https://europe.api.riotgames.com';
const DDRAGON = 'https://ddragon.leagueoflegends.com';

// Cache DDragon version + champion data
let cachedVersion = null;
let cachedChampions = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour

async function riotFetch(url) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('RIOT_API_KEY not set in environment variables');
  const res = await fetch(url, {
    headers: { 'X-Riot-Token': apiKey },
  });
  if (res.status === 404) return null;
  if (res.status === 429) throw new Error('Rate limited by Riot API. Try again in a few seconds.');
  if (res.status === 403) {
    throw new Error('Riot API key expired or invalid (403 Forbidden). Regenerate at developer.riotgames.com');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Riot API error: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
  }
  return res.json();
}

// Get latest DDragon version
let versionCacheTime = 0;
let championsCacheTime = 0;
export async function getDDragonVersion() {
  if (cachedVersion && Date.now() - versionCacheTime < CACHE_TTL) return cachedVersion;
  try {
    const versions = await fetch(`${DDRAGON}/api/versions.json`).then(r => r.json());
    cachedVersion = versions[0];
    versionCacheTime = Date.now();
    return cachedVersion;
  } catch {
    return cachedVersion || '15.6.1';
  }
}

// Get all champions with icons
export async function getChampions() {
  if (cachedChampions && Date.now() - championsCacheTime < CACHE_TTL) return cachedChampions;
  try {
    const version = await getDDragonVersion();
    const data = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`).then(r => r.json());
    cachedChampions = Object.values(data.data).map(c => ({
      id: c.id,
      name: c.name,
      key: c.key,
      icon: `${DDRAGON}/cdn/${version}/img/champion/${c.id}.png`,
    }));
    championsCacheTime = Date.now();
    return cachedChampions;
  } catch {
    return cachedChampions || [];
  }
}

// Lookup account by Riot ID (gameName#tagLine)
export async function getAccountByRiotId(gameName, tagLine) {
  return riotFetch(`${EUROPE_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
}

// Get summoner by PUUID
export async function getSummonerByPuuid(puuid) {
  return riotFetch(`${EUNE_BASE}/lol/summoner/v4/summoners/by-puuid/${puuid}`);
}

// Get ranked entries by PUUID (production key requires /by-puuid/)
export async function getRankedEntries(puuid) {
  return riotFetch(`${EUNE_BASE}/lol/league/v4/entries/by-puuid/${puuid}`);
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
  return riotFetch(`${EUNE_BASE}/lol/spectator/v5/active-games/by-summoner/${puuid}`);
}

// Get champion mastery (top champions)
export async function getChampionMastery(puuid, count = 5) {
  return riotFetch(`${EUNE_BASE}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`);
}

// ---- High-level helpers ----

// Map champion key (number) to champion name using DDragon data
let champKeyMap = null;
async function getChampKeyMap() {
  if (champKeyMap) return champKeyMap;
  const version = await getDDragonVersion();
  const data = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`).then(r => r.json());
  champKeyMap = {};
  for (const c of Object.values(data.data)) {
    champKeyMap[c.key] = c.id;
  }
  return champKeyMap;
}

// Full player profile (account + summoner + rank + recent matches)
export async function getPlayerProfile(gameName, tagLine) {
  // Try exact match first, then fallback to common tags
  let account = await getAccountByRiotId(gameName, tagLine).catch(() => null);
  if (!account) {
    account = await findAccountByName(gameName);
  }
  if (!account) return null;

  const summoner = await getSummonerByPuuid(account.puuid).catch(() => ({}));
  let ranked = [];
  try { ranked = await getRankedEntries(account.puuid) || []; } catch (e) { /* skip */ }

  // Get ranked solo/duo entry
  const soloQ = ranked?.find(e => e.queueType === 'RANKED_SOLO_5x5');
  const flexQ = ranked?.find(e => e.queueType === 'RANKED_FLEX_SR');

  // Champion mastery (top 5)
  let topChampions = [];
  try {
    const mastery = await getChampionMastery(account.puuid, 5);
    const keyMap = await getChampKeyMap();
    if (mastery) {
      topChampions = mastery.map(m => ({
        champion: keyMap[String(m.championId)] || `Champion ${m.championId}`,
        level: m.championLevel,
        points: m.championPoints,
      }));
    }
  } catch (e) { /* ignore */ }

  // Recent match IDs (last 10 for better winrate data)
  let recentMatchIds = [];
  try {
    recentMatchIds = await getMatchIds(account.puuid, 10, null) || [];
  } catch (e) { /* ignore */ }

  // Fetch match details for recent games
  const recentMatches = [];
  const champStats = {}; // track winrate per champion
  for (const id of recentMatchIds.slice(0, 10)) {
    try {
      const match = await getMatchDetails(id);
      if (match) {
        const player = match.info.participants.find(p => p.puuid === account.puuid);
        if (player) {
          const matchData = {
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
            damageDealt: player.totalDamageDealtToChampions,
            goldEarned: player.goldEarned,
            visionScore: player.visionScore,
            items: [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6].filter(i => i > 0),
          };
          recentMatches.push(matchData);

          // Track champion winrate
          if (!champStats[player.championName]) champStats[player.championName] = { wins: 0, games: 0, kills: 0, deaths: 0, assists: 0 };
          champStats[player.championName].games++;
          if (player.win) champStats[player.championName].wins++;
          champStats[player.championName].kills += player.kills;
          champStats[player.championName].deaths += player.deaths;
          champStats[player.championName].assists += player.assists;
        }
      }
    } catch (e) { /* skip failed matches */ }
  }

  // Champion winrates from recent matches
  const championWinrates = Object.entries(champStats)
    .map(([champ, s]) => ({
      champion: champ,
      games: s.games,
      wins: s.wins,
      winRate: ((s.wins / s.games) * 100).toFixed(0),
      avgKDA: s.deaths > 0 ? ((s.kills + s.assists) / s.deaths).toFixed(1) : 'Perfect',
    }))
    .sort((a, b) => b.games - a.games);

  // Check if currently in game
  let inGame = null;
  try {
    const current = await getCurrentGame(account.puuid);
    if (current) {
      const keyMap = await getChampKeyMap();
      const participant = current.participants?.find(p => p.puuid === account.puuid);
      inGame = {
        champion: keyMap[String(participant?.championId)] || '',
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
    topChampions,
    championWinrates,
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

// Try multiple taglines if the default one fails
const COMMON_TAGS = ['EUNE', 'EUW', 'eune', 'euw', 'EUW1', 'EUN1'];

export async function findAccountByName(gameName) {
  // First try with # if included
  const parsed = parseRiotId(gameName);
  const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine);
  if (account) return account;

  // If no # was provided, try common tags
  if (!gameName.includes('#')) {
    for (const tag of COMMON_TAGS) {
      if (tag === parsed.tagLine) continue; // already tried
      try {
        const acc = await getAccountByRiotId(parsed.gameName, tag);
        if (acc) return acc;
      } catch (e) { /* try next */ }
    }
  }
  return null;
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
