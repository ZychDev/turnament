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

async function riotFetch(url, timeoutMs = 10000) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('RIOT_API_KEY not set in environment variables');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': apiKey },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.status === 404) return null;
    if (res.status === 429) throw new Error('Rate limited by Riot API. Try again in a few seconds.');
    if (res.status === 403) {
      throw new Error('Riot API key expired or invalid (403 Forbidden). Regenerate at developer.riotgames.com');
    }
    if (!res.ok) {
      throw new Error(`Riot API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('Riot API request timed out (10s). Try again.');
    throw e;
  }
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

  // Recent match IDs — fetch both normal and custom games, merge & deduplicate
  let recentMatchIds = [];
  try {
    const [normalIds, customIds] = await Promise.all([
      getMatchIds(account.puuid, 10, null).catch(() => []),
      getMatchIds(account.puuid, 5, 'custom').catch(() => []),
    ]);
    const all = [...(normalIds || []), ...(customIds || [])];
    recentMatchIds = [...new Set(all)].slice(0, 15);
  } catch (e) { /* ignore */ }

  // Fetch match details for recent games
  const recentMatches = [];
  const champStats = {}; // track winrate per champion
  for (const id of recentMatchIds.slice(0, 10)) {
    try {
      const match = await getMatchDetails(id);
      if (match?.info?.participants) {
        const player = match.info.participants.find(p => p.puuid === account.puuid);
        if (player) {
          const gameMins = match.info.gameDuration / 60;
          const cs = player.totalMinionsKilled + player.neutralMinionsKilled;
          const teamKills = match.info.participants.filter(p => p.teamId === player.teamId).reduce((s, p) => s + p.kills, 0);
          const matchData = {
            matchId: id,
            champion: player.championName,
            kills: player.kills,
            deaths: player.deaths,
            assists: player.assists,
            cs,
            csPerMin: gameMins > 0 ? (cs / gameMins).toFixed(1) : '0',
            win: player.win,
            role: player.teamPosition,
            gameMode: match.info.gameMode,
            gameType: match.info.gameType || '',
            queueId: match.info.queueId,
            isCustom: match.info.gameType === 'CUSTOM_GAME' || match.info.queueId === 0,
            gameDuration: match.info.gameDuration,
            timestamp: match.info.gameCreation,
            damageDealt: player.totalDamageDealtToChampions,
            damagePerMin: gameMins > 0 ? Math.round(player.totalDamageDealtToChampions / gameMins) : 0,
            goldEarned: player.goldEarned,
            goldPerMin: gameMins > 0 ? Math.round(player.goldEarned / gameMins) : 0,
            visionScore: player.visionScore,
            wardsPlaced: player.wardsPlaced || 0,
            wardsKilled: player.wardsKilled || 0,
            killParticipation: teamKills > 0 ? Math.round(((player.kills + player.assists) / teamKills) * 100) : 0,
            firstBlood: player.firstBloodKill || false,
            doubleKills: player.doubleKills || 0,
            tripleKills: player.tripleKills || 0,
            quadraKills: player.quadraKills || 0,
            pentaKills: player.pentaKills || 0,
            turretKills: player.turretKills || 0,
            objectivesStolen: player.objectivesStolen || 0,
            longestLiving: player.longestTimeSpentLiving || 0,
            totalHealing: player.totalHealsOnTeammates || 0,
            damageTaken: player.totalDamageTaken || 0,
            items: [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6].filter(i => i > 0),
          };
          recentMatches.push(matchData);

          // Track champion winrate
          if (!champStats[player.championName]) champStats[player.championName] = { wins: 0, games: 0, kills: 0, deaths: 0, assists: 0, cs: 0, damage: 0, gold: 0 };
          const cs2 = champStats[player.championName];
          cs2.games++;
          if (player.win) cs2.wins++;
          cs2.kills += player.kills;
          cs2.deaths += player.deaths;
          cs2.assists += player.assists;
          cs2.cs += cs;
          cs2.damage += player.totalDamageDealtToChampions;
          cs2.gold += player.goldEarned;
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

  // Aggregate stats from recent matches
  const totalGames = recentMatches.length;
  const wins = recentMatches.filter(m => m.win).length;
  const avgStats = totalGames > 0 ? {
    avgKills: (recentMatches.reduce((s, m) => s + m.kills, 0) / totalGames).toFixed(1),
    avgDeaths: (recentMatches.reduce((s, m) => s + m.deaths, 0) / totalGames).toFixed(1),
    avgAssists: (recentMatches.reduce((s, m) => s + m.assists, 0) / totalGames).toFixed(1),
    avgCS: Math.round(recentMatches.reduce((s, m) => s + m.cs, 0) / totalGames),
    avgCSPerMin: (recentMatches.reduce((s, m) => s + parseFloat(m.csPerMin), 0) / totalGames).toFixed(1),
    avgDamage: Math.round(recentMatches.reduce((s, m) => s + m.damageDealt, 0) / totalGames),
    avgDamagePerMin: Math.round(recentMatches.reduce((s, m) => s + m.damagePerMin, 0) / totalGames),
    avgGoldPerMin: Math.round(recentMatches.reduce((s, m) => s + m.goldPerMin, 0) / totalGames),
    avgVision: (recentMatches.reduce((s, m) => s + m.visionScore, 0) / totalGames).toFixed(1),
    avgKP: Math.round(recentMatches.reduce((s, m) => s + m.killParticipation, 0) / totalGames),
    recentWinRate: ((wins / totalGames) * 100).toFixed(0),
    totalDoubles: recentMatches.reduce((s, m) => s + m.doubleKills, 0),
    totalTriples: recentMatches.reduce((s, m) => s + m.tripleKills, 0),
    totalQuadras: recentMatches.reduce((s, m) => s + m.quadraKills, 0),
    totalPentas: recentMatches.reduce((s, m) => s + m.pentaKills, 0),
    firstBloodRate: Math.round((recentMatches.filter(m => m.firstBlood).length / totalGames) * 100),
    avgGameDuration: Math.round(recentMatches.reduce((s, m) => s + m.gameDuration, 0) / totalGames / 60),
    favoriteRole: (() => {
      const roles = {};
      recentMatches.forEach(m => { if (m.role) roles[m.role] = (roles[m.role] || 0) + 1; });
      return Object.entries(roles).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    })(),
    winStreak: (() => { let s = 0; for (const m of recentMatches) { if (m.win) s++; else break; } return s; })(),
    lossStreak: (() => { let s = 0; for (const m of recentMatches) { if (!m.win) s++; else break; } return s; })(),
  } : null;

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
    avgStats,
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
