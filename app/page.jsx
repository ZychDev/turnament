'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { t } from '@/lib/i18n';

const TEAM_COLORS = ['#C89B3C', '#1A9FD4', '#E84057', '#7B5CB8', '#0ABDA0', '#E86B2A', '#3CB878', '#E8B84B'];
const ROLE_ICONS = { Top: '⚔️', Jungle: '🌿', Mid: '⚡', ADC: '🏹', Support: '🛡️' };
const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';
const DDRAGON_FALLBACK = `${DDRAGON_BASE}/cdn/14.1.1/img/champion/`;

function getTeamColor(teams, teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team?.color) return team.color;
  const idx = teams.findIndex(t => t.id === teamId);
  return idx >= 0 ? TEAM_COLORS[idx % TEAM_COLORS.length] : '#5A6880';
}
function getTeamName(teams, id) { return teams.find(t => t.id === id)?.name || 'TBD'; }
function getTeamTag(teams, id) { return teams.find(t => t.id === id)?.tag || '???'; }
function getTeam(teams, id) { return teams.find(t => t.id === id); }
function TeamIcon({ team, teams, size = 'md' }) {
  const color = getTeamColor(teams, team?.id);
  const cls = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  if (team?.customIcon) return <img src={team.customIcon} alt="" className={`${cls} rounded-lg object-cover border-2`} style={{ borderColor: color }} />;
  return <div className={`team-avatar ${size === 'sm' ? 'text-sm' : ''}`} style={{ borderColor: color, background: `${color}20` }}>{team?.avatar || '⚔️'}</div>;
}

// ---- Sound (singleton AudioContext) ----
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}
function playNotificationSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

// ---- Confetti ----
function Confetti() {
  const colors = ['#C89B3C', '#E84057', '#1A9FD4', '#3CB878', '#7B5CB8', '#E8B84B', '#F0E6D2'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 2,
    color: colors[i % colors.length], size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'circle' : 'square',
  }));
  return <>{pieces.map(p => (
    <div key={p.id} className="confetti-piece" style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, background: p.color, width: p.size, height: p.size, borderRadius: p.shape === 'circle' ? '50%' : '2px' }} />
  ))}</>;
}

// ---- LoL Ambient Background ----
function AmbientBackground() {
  const particles = useMemo(() => Array.from({ length: 65 }, (_, i) => ({
    id: i, left: Math.random() * 100, bottom: -(Math.random() * 20),
    duration: 5 + Math.random() * 10, delay: Math.random() * 10,
    size: 1.5 + Math.random() * 5,
    hue: Math.random() > 0.7 ? 'blue' : Math.random() > 0.5 ? 'red' : 'gold',
  })), []);

  const orbs = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    id: i, left: 5 + Math.random() * 90, top: 5 + Math.random() * 90,
    size: 60 + Math.random() * 180, duration: 10 + Math.random() * 14,
    delay: Math.random() * 8,
    dx: (Math.random() - 0.5) * 350, dy: (Math.random() - 0.5) * 350,
  })), []);

  const beams = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: i, left: 5 + i * 14 + Math.random() * 8,
    duration: 4 + Math.random() * 5, delay: Math.random() * 4,
  })), []);

  return (
    <>
      <div className="vignette" />
      <div className="particles-container">
        <div className="hex-grid" />

        {/* Floating particles */}
        {particles.map(p => (
          <div key={p.id} className={`particle particle-${p.hue}`} style={{
            left: `${p.left}%`, bottom: `${p.bottom}%`,
            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
            width: p.size, height: p.size,
          }} />
        ))}

        {/* Ambient orbs */}
        {orbs.map(o => (
          <div key={`orb-${o.id}`} className="ambient-orb" style={{
            left: `${o.left}%`, top: `${o.top}%`,
            width: o.size, height: o.size,
            '--orb-dx': `${o.dx}px`, '--orb-dy': `${o.dy}px`,
            animationDuration: `${o.duration}s`, animationDelay: `${o.delay}s`,
          }} />
        ))}

        {/* Rune circles */}
        <div className="rune-circle" style={{ width: 350, height: 350, left: '5%', top: '15%', animationDuration: '30s' }} />
        <div className="rune-circle" style={{ width: 250, height: 250, right: '8%', bottom: '10%', animationDuration: '22s', animationDirection: 'reverse' }} />
        <div className="rune-circle" style={{ width: 180, height: 180, left: '50%', top: '60%', animationDuration: '35s' }} />

        {/* Mist layers */}
        <div className="mist-layer" style={{ bottom: '0%', animationDuration: '18s', animationDelay: '0s' }} />
        <div className="mist-layer" style={{ bottom: '25%', animationDuration: '22s', animationDelay: '3s' }} />
        <div className="mist-layer" style={{ top: '10%', animationDuration: '25s', animationDelay: '6s' }} />

        {/* Light beams */}
        {beams.map(b => (
          <div key={`beam-${b.id}`} className="light-beam" style={{
            left: `${b.left}%`, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s`,
          }} />
        ))}
      </div>
    </>
  );
}

// ---- Toast ----
function Toast({ message, type, onDone }) {
  useEffect(() => { const tm = setTimeout(onDone, 3000); return () => clearTimeout(tm); }, [onDone]);
  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ---- Champion icon ----
// DDragon champion names are PascalCase (e.g. "Aatrox", "AurelionSol", "Mel")
// Handle common cases: lowercase input, spaces, apostrophes
function ChampIcon({ name, ddragon }) {
  if (!name || typeof name !== 'string') return null;
  const base = ddragon || DDRAGON_FALLBACK;
  // Capitalize first letter for simple names, preserve already correct names
  const normalized = name.charAt(0).toUpperCase() + name.slice(1);
  return <img src={`${base}${normalized}.png`} alt={name} className="w-5 h-5 rounded inline-block" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />;
}

// ---- Countdown ----
function Countdown({ targetTime, lang }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const diff = new Date(targetTime).getTime() - now;
  if (diff <= 0) return <span className="text-lolgreen text-xs font-bold">{lang === 'pl' ? 'Teraz!' : 'Now!'}</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div className="countdown flex gap-1">
      {h > 0 && <span className="countdown-unit"><span className="countdown-value">{h}</span><span className="countdown-label">{lang === 'pl' ? 'godz' : 'hrs'}</span></span>}
      <span className="countdown-unit"><span className="countdown-value">{String(m).padStart(2, '0')}</span><span className="countdown-label">min</span></span>
      <span className="countdown-unit"><span className="countdown-value">{String(s).padStart(2, '0')}</span><span className="countdown-label">sec</span></span>
    </div>
  );
}

// ---- Countdown Banner ----
function CountdownBanner({ bracket, teams, lang }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!bracket) return null;

  const allMatches = [];
  for (const s of ['winners', 'losers']) {
    if (bracket[s]) for (const r of bracket[s]) allMatches.push(...r.matches);
  }
  if (bracket.grandFinal) allMatches.push(...bracket.grandFinal.matches);

  // Check for LIVE match first
  const liveMatch = allMatches.find(m => m.status === 'live');
  if (liveMatch) {
    const t1 = teams.find(tt => tt.id === liveMatch.t1);
    const t2 = teams.find(tt => tt.id === liveMatch.t2);
    const liveContent = (
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
        <span className="live-dot"></span>
        <span className="font-cinzel font-bold text-lolred text-sm sm:text-base">{t(lang, 'matchLive')}</span>
        <span className="text-dim mx-1">—</span>
        <span className="font-bold text-sm" style={{ color: getTeamColor(teams, liveMatch.t1) }}>{t1?.tag || 'TBD'}</span>
        <span className="text-dim text-xs">vs</span>
        <span className="font-bold text-sm" style={{ color: getTeamColor(teams, liveMatch.t2) }}>{t2?.tag || 'TBD'}</span>
        <span className="text-gold2 font-bold text-sm ml-1">{(liveMatch.wins||[0,0])[0]} - {(liveMatch.wins||[0,0])[1]}</span>
        {liveMatch.streamUrl && <span className="text-xs text-lolred ml-1">📺 {lang === 'pl' ? 'Oglądaj' : 'Watch'}</span>}
      </div>
    );
    return (
      <div className="bg-lolred/10 border-b border-lolred/30 relative z-10">
        {liveMatch.streamUrl ? (
          <a href={liveMatch.streamUrl} target="_blank" rel="noopener noreferrer" className="block hover:bg-lolred/20 transition-colors cursor-pointer">
            {liveContent}
          </a>
        ) : liveContent}
      </div>
    );
  }

  // Find next upcoming match
  const upcoming = allMatches
    .filter(m => m.scheduledTime && !m.winner && m.status !== 'live')
    .map(m => ({ ...m, time: new Date(m.scheduledTime).getTime() }))
    .filter(m => m.time > now)
    .sort((a, b) => a.time - b.time);

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const diff = next.time - now;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const t1 = teams.find(tt => tt.id === next.t1);
  const t2 = teams.find(tt => tt.id === next.t2);

  return (
    <div className="bg-gold2/5 border-b border-gold2/20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span className="text-dim text-xs sm:text-sm">{t(lang, 'nextMatchIn')}</span>
        <div className="flex gap-1 sm:gap-2">
          {days > 0 && <div className="countdown-unit"><span className="countdown-num">{days}</span><span className="countdown-label">{t(lang, 'days')}</span></div>}
          <div className="countdown-unit"><span className="countdown-num">{String(hours).padStart(2, '0')}</span><span className="countdown-label">{t(lang, 'hours')}</span></div>
          <div className="countdown-unit"><span className="countdown-num">{String(minutes).padStart(2, '0')}</span><span className="countdown-label">{t(lang, 'minutes')}</span></div>
          <div className="countdown-unit"><span className="countdown-num">{String(seconds).padStart(2, '0')}</span><span className="countdown-label">{t(lang, 'seconds')}</span></div>
        </div>
        {t1 && t2 && (
          <div className="flex items-center gap-2">
            <span className="text-dim mx-1">—</span>
            <span className="font-bold text-xs sm:text-sm" style={{ color: getTeamColor(teams, next.t1) }}>{t1?.tag}</span>
            <span className="text-dim text-xs">vs</span>
            <span className="font-bold text-xs sm:text-sm" style={{ color: getTeamColor(teams, next.t2) }}>{t2?.tag}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- MVP Voting ----
function MvpVoting({ match, teams, lang }) {
  const [votes, setVotes] = useState({});
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/mvp-votes`).then(r => r.json()).then(all => {
      if (all[match.id]) setVotes(all[match.id]);
    }).catch(() => {});
    // Check cookie
    if (document.cookie.includes(`mvp_${match.id}=`)) setVoted(true);
  }, [match.id]);

  const allPlayers = [];
  for (const game of (match.games || [])) {
    for (const p of (game.players || [])) {
      if (!allPlayers.find(ap => ap.playerName === p.playerName && ap.teamId === p.teamId)) {
        allPlayers.push(p);
      }
    }
  }

  if (allPlayers.length === 0) return null;

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleVote = async (playerName) => {
    if (voted || loading) return;
    setLoading(true);
    try {
      const r = await fetch('/api/mvp-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, playerName }),
      });
      if (r.ok) {
        const d = await r.json();
        setVotes(d.votes);
        setVoted(true);
      }
    } catch {} finally { setLoading(false); }
  };

  // Group players by team
  const t1Players = allPlayers.filter(p => p.teamId === match.t1);
  const t2Players = allPlayers.filter(p => p.teamId === match.t2);

  const renderPlayer = (p) => {
    const pVotes = votes[p.playerName] || 0;
    const pct = totalVotes > 0 ? (pVotes / totalVotes * 100) : 0;
    const isTop = totalVotes > 0 && pVotes === Math.max(...Object.values(votes));
    return (
      <button key={`${p.teamId}-${p.playerName}`}
        onClick={() => handleVote(p.playerName)}
        disabled={voted || loading}
        className={`relative flex items-center gap-2 p-2 rounded text-left text-sm transition-all ${voted ? 'cursor-default' : 'hover:bg-gold2/10 cursor-pointer'} ${isTop && totalVotes > 0 ? 'ring-1 ring-gold2/40' : ''}`}>
        <div className="absolute inset-0 rounded bg-gold2/10 transition-all" style={{ width: `${pct}%` }} />
        <span className="relative z-10 font-semibold" style={{ color: getTeamColor(teams, p.teamId) }}>{p.playerName || p.role || '?'}</span>
        {totalVotes > 0 && <span className="relative z-10 text-xs text-dim ml-auto">{pVotes} ({pct.toFixed(0)}%)</span>}
      </button>
    );
  };

  return (
    <div className="mt-4 p-3 rounded-lg bg-bg3 border border-border">
      <h4 className="font-cinzel text-sm font-bold text-gold2 mb-2 flex items-center gap-2">
        👑 {t(lang, 'mvpVoting')}
        {voted && <span className="text-xs text-lolgreen font-normal">✓ {t(lang, 'voted')}</span>}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        <div className="space-y-1">{t1Players.map(renderPlayer)}</div>
        <div className="space-y-1">{t2Players.map(renderPlayer)}</div>
      </div>
    </div>
  );
}

// ---- Match Card ----
function MatchCard({ match: rawMatch, teams, bestOf, onClick, predictions, lang }) {
  const match = { wins: [0, 0], games: [], ...rawMatch };
  const t1Tag = getTeamTag(teams, match.t1);
  const t2Tag = getTeamTag(teams, match.t2);
  const t1Color = getTeamColor(teams, match.t1);
  const t2Color = getTeamColor(teams, match.t2);
  const isFinished = !!match.winner;
  const isLive = match.status === 'live';

  const pred = predictions?.[match.id] || {};
  const totalVotes = (pred[match.t1] || 0) + (pred[match.t2] || 0);
  const t1Pct = totalVotes > 0 ? ((pred[match.t1] || 0) / totalVotes * 100) : 50;

  return (
    <div className={`match-card p-0 overflow-hidden cursor-pointer ${isLive ? 'is-live' : ''}`} onClick={onClick}>
      <div className="text-[10px] text-dim px-2 py-1 border-b border-border uppercase tracking-wider flex justify-between items-center">
        <span>{match.id.replace(/-/g, ' ').toUpperCase()}</span>
        <span className="flex items-center gap-1">
          {bestOf > 1 && <span>BO{bestOf}</span>}
          {isLive && <span className="live-indicator"><span className="live-dot"></span>LIVE</span>}
        </span>
      </div>
      {[1, 2].map(slot => {
        const teamId = slot === 1 ? match.t1 : match.t2;
        const tag = slot === 1 ? t1Tag : t2Tag;
        const color = slot === 1 ? t1Color : t2Color;
        const winIdx = slot - 1;
        const isWinner = isFinished && match.winner === teamId;
        const isLoser = isFinished && match.winner !== teamId && match.winner;
        return (
          <div key={slot} className={`flex items-center justify-between px-3 py-1.5 ${slot === 2 ? 'border-t border-border' : ''} ${isWinner ? 'winner-row winner-flash' : ''} ${isLoser ? 'loser-row' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded" style={{ background: color }}></div>
              <span className="font-cinzel text-sm font-bold" style={{ color: teamId ? color : '#5A6880' }}>{tag}</span>
              {match.mvp && teams.find(tt => tt.id === teamId)?.players?.some(p => p.summonerName === match.mvp) && <span className="mvp-badge">MVP</span>}
            </div>
            <span className="text-sm font-bold" style={{ color: isWinner ? '#3CB878' : '#5A6880' }}>{(match.wins||[0,0])[winIdx]}</span>
          </div>
        );
      })}
      {totalVotes > 0 && match.t1 && match.t2 && !isFinished && (
        <div className="px-2 py-1 border-t border-border">
          <div className="prediction-bar"><div className="prediction-fill" style={{ width: `${t1Pct}%`, background: t1Color }}></div></div>
        </div>
      )}
      {match.streamUrl && match.status === 'live' && (
        <a href={match.streamUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          className="stream-link-bar flex items-center justify-center gap-2 px-2 py-1.5 border-t border-border bg-lolred/10 hover:bg-lolred/20 transition-colors">
          <span className="live-dot"></span>
          <span className="text-xs text-lolred font-bold uppercase tracking-wider">{lang === 'pl' ? 'Oglądaj transmisję' : 'Watch Stream'}</span>
        </a>
      )}
      {match.comment && <div className="px-2 py-1 border-t border-border text-[10px] text-dim truncate">{match.comment}</div>}
    </div>
  );
}

// ---- Bracket Connector ----
function BracketConnector({ count, matches }) {
  if (count === 0) return null;
  const pairs = Math.ceil(count / 2);
  return (
    <div className="bracket-connector">
      {Array.from({ length: pairs }, (_, i) => {
        const active = matches?.[i * 2]?.winner || matches?.[i * 2 + 1]?.winner;
        const ac = active ? 'active' : '';
        return (
          <div key={i} className="flex-1 relative">
            {/* Horizontal input from top match center */}
            <div className={`absolute left-0 right-1/2 connector-line-h ${ac}`} style={{ top: '25%' }}></div>
            {/* Horizontal input from bottom match center */}
            <div className={`absolute left-0 right-1/2 connector-line-h ${ac}`} style={{ top: '75%' }}></div>
            {/* Vertical line connecting both inputs */}
            <div className={`absolute connector-line-v ${ac}`} style={{ left: '50%', top: '25%', bottom: '25%', width: '2px' }}></div>
            {/* Horizontal output to next round */}
            <div className={`absolute left-1/2 right-0 connector-line-h ${ac}`} style={{ top: '50%' }}></div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Match Detail Modal (public — shows game stats) ----
// ---- Mini Chat ----
function MatchChat({ matchId, lang }) {
  const [messages, setMessages] = useState([]);
  const [nick, setNick] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('chatNick');
    if (saved) setNick(saved);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await fetch(`/api/chat?matchId=${matchId}`);
      if (r.ok) setMessages(await r.json());
    } catch {}
  }, [matchId]);

  useEffect(() => { fetchMessages(); const i = setInterval(fetchMessages, 3000); return () => clearInterval(i); }, [fetchMessages]);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!nick.trim() || !msg.trim() || sending) return;
    setSending(true);
    localStorage.setItem('chatNick', nick.trim());
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, nickname: nick.trim(), message: msg.trim() }) });
      if (r.ok) { setMsg(''); fetchMessages(); }
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="mt-4 border-t border-border pt-3">
      <h4 className="text-sm font-bold text-gold2 mb-2">{lang === 'pl' ? 'Komentarze' : 'Comments'}</h4>
      <div ref={chatRef} className="h-32 overflow-y-auto space-y-1 mb-2 p-2 rounded bg-bg3 text-xs">
        {messages.length === 0 && <p className="text-dim text-center py-4">{lang === 'pl' ? 'Brak komentarzy' : 'No comments yet'}</p>}
        {messages.map((m, i) => (
          <div key={i} className="flex gap-2">
            <span className="font-bold text-gold2 shrink-0">{m.nickname}:</span>
            <span className="text-gold break-all">{m.message}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input value={nick} onChange={e => setNick(e.target.value)} placeholder={lang === 'pl' ? 'Nick' : 'Name'} maxLength={20} className="w-20 text-xs py-1 px-2" />
        <input value={msg} onChange={e => setMsg(e.target.value)} placeholder={lang === 'pl' ? 'Napisz komentarz...' : 'Write a comment...'} maxLength={200} className="flex-1 text-xs py-1 px-2" />
        <button type="submit" disabled={sending} className="btn text-xs px-3 py-1">{lang === 'pl' ? 'Wyslij' : 'Send'}</button>
      </form>
    </div>
  );
}

function MatchDetailModal({ match: rawMatch, round, teams, lang, onClose, ddragon, onPlayerClick }) {
  const match = rawMatch ? { wins: [0, 0], games: [], ...rawMatch } : null;
  if (!match) return null;
  const t1 = getTeam(teams, match.t1);
  const t2 = getTeam(teams, match.t2);
  const isLive = match.status === 'live';

  // Helper: find riotTag for a player name from team rosters
  const getFullRiotId = (playerName) => {
    for (const team of [t1, t2].filter(Boolean)) {
      const p = (team.players || []).find(pl => pl.summonerName?.toLowerCase() === playerName?.toLowerCase());
      if (p?.riotTag) return `${p.summonerName}#${p.riotTag}`;
    }
    return playerName;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slideUp max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-cinzel text-xl font-bold text-gold2">{match.id.replace(/-/g, ' ').toUpperCase()}</h2>
            <p className="text-dim text-sm">{round?.name} {round?.bestOf > 1 ? `• BO${round.bestOf}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-dim hover:text-gold text-xl">✕</button>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-6 py-4 mb-4">
          <div className="text-center">
            {t1?.customIcon ? <img src={t1.customIcon} alt="" className="w-12 h-12 rounded-lg object-cover border-2 mx-auto mb-2" style={{ borderColor: getTeamColor(teams, match.t1) }} /> :
              <div className="team-avatar mx-auto mb-2" style={{ borderColor: getTeamColor(teams, match.t1), background: `${getTeamColor(teams, match.t1)}20` }}>{t1?.avatar || '⚔️'}</div>}
            <p className="font-cinzel font-bold" style={{ color: getTeamColor(teams, match.t1) }}>{t1?.tag || 'TBD'}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold font-cinzel">{(match.wins||[0,0])[0]} <span className="text-dim">-</span> {(match.wins||[0,0])[1]}</p>
            {isLive && <span className="live-indicator mt-1"><span className="live-dot"></span>LIVE</span>}
            {match.mvp && <p className="text-xs text-gold2 mt-1">MVP: {match.mvp}</p>}
          </div>
          <div className="text-center">
            {t2?.customIcon ? <img src={t2.customIcon} alt="" className="w-12 h-12 rounded-lg object-cover border-2 mx-auto mb-2" style={{ borderColor: getTeamColor(teams, match.t2) }} /> :
              <div className="team-avatar mx-auto mb-2" style={{ borderColor: getTeamColor(teams, match.t2), background: `${getTeamColor(teams, match.t2)}20` }}>{t2?.avatar || '⚔️'}</div>}
            <p className="font-cinzel font-bold" style={{ color: getTeamColor(teams, match.t2) }}>{t2?.tag || 'TBD'}</p>
          </div>
        </div>

        {/* Stream link button */}
        {match.streamUrl && (
          <a href={match.streamUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-lg bg-lolred/15 border border-lolred/30 hover:bg-lolred/25 transition-colors">
            <span className="live-dot"></span>
            <span className="text-lolred font-bold text-sm uppercase tracking-wider">
              {isLive ? (lang === 'pl' ? 'Oglądaj transmisję na żywo' : 'Watch Live Stream') : (lang === 'pl' ? 'Link do transmisji' : 'Stream Link')}
            </span>
          </a>
        )}

        {/* Game stats */}
        {(match.games || []).map((game, gi) => {
          const hasExtended = game.players?.some(p => p.damageDealt || p.goldEarned);
          return (
          <div key={gi} className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-bold text-gold2">{t(lang, 'game')} {gi + 1}</h4>
              {game.duration && <span className="text-dim text-xs">({game.duration})</span>}
              {game.imported && <span className="text-xs text-lolblue bg-lolblue/10 px-1.5 py-0.5 rounded">Riot API</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-dim border-b border-border">
                  <th className="text-left py-1 px-1">{t(lang, 'player')}</th>
                  <th className="text-left py-1 px-1">Champ</th>
                  <th className="text-right py-1 px-1">K</th>
                  <th className="text-right py-1 px-1">D</th>
                  <th className="text-right py-1 px-1">A</th>
                  <th className="text-right py-1 px-1">CS</th>
                  {hasExtended && <>
                    <th className="text-right py-1 px-1 hidden sm:table-cell">DMG</th>
                    <th className="text-right py-1 px-1 hidden sm:table-cell">Gold</th>
                    <th className="text-right py-1 px-1 hidden md:table-cell">Vision</th>
                    <th className="text-left py-1 px-1 hidden lg:table-cell">{lang === 'pl' ? 'Itemy' : 'Items'}</th>
                  </>}
                </tr></thead>
                <tbody>
                  {(game.players || []).map((p, pi) => (
                    <tr key={pi} className="border-b border-border/30">
                      <td className="py-1 px-1 font-semibold" style={{ color: getTeamColor(teams, p.teamId) }}>
                        <button onClick={() => onPlayerClick?.(getFullRiotId(p.playerName))} className="hover:text-gold2 transition-colors cursor-pointer">{p.playerName || p.role || '?'}</button>
                      </td>
                      <td className="py-1 px-1"><span className="flex items-center gap-1"><ChampIcon name={p.champion} ddragon={ddragon} />{p.champion}</span></td>
                      <td className="py-1 px-1 text-right text-lolgreen">{p.kills}</td>
                      <td className="py-1 px-1 text-right text-lolred">{p.deaths}</td>
                      <td className="py-1 px-1 text-right text-lolblue">{p.assists}</td>
                      <td className="py-1 px-1 text-right">{p.cs}</td>
                      {hasExtended && <>
                        <td className="py-1 px-1 text-right hidden sm:table-cell text-dim">{p.damageDealt ? `${(p.damageDealt / 1000).toFixed(1)}k` : '-'}</td>
                        <td className="py-1 px-1 text-right hidden sm:table-cell text-gold2">{p.goldEarned ? `${(p.goldEarned / 1000).toFixed(1)}k` : '-'}</td>
                        <td className="py-1 px-1 text-right hidden md:table-cell text-dim">{p.visionScore ?? '-'}</td>
                        <td className="py-1 px-1 hidden lg:table-cell">
                          <div className="flex gap-0.5">
                            {(p.items || []).filter(i => i > 0).map((item, ii) => (
                              <img key={ii} src={`${ddragon.replace('/champion/', '/item/')}${item}.png`} alt="" className="w-4 h-4 rounded" onError={e => e.target.style.display='none'} />
                            ))}
                          </div>
                        </td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })}

        {(!match.games || match.games.length === 0) && (
          <p className="text-dim text-center text-sm py-4">{t(lang, 'noData')}</p>
        )}

        {match.comment && (
          <div className="mt-3 p-3 rounded bg-bg3 text-sm text-dim">
            {match.comment}
          </div>
        )}

        {/* MVP Voting */}
        {match.winner && match.games?.length > 0 && <MvpVoting match={match} teams={teams} lang={lang} />}

        {/* Mini Chat */}
        {match.t1 && match.t2 && <MatchChat matchId={match.id} lang={lang} />}

        <button onClick={onClose} className="btn-secondary w-full mt-4">{t(lang, 'close')}</button>
      </div>
    </div>
  );
}

// ---- Player Profile Modal (mini op.gg) ----
function PlayerProfileModal({ summonerName, onClose, lang, ddragon }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = (bust = false) => {
    if (!summonerName) return;
    setLoading(true); setError(null);
    const q = bust ? `&_t=${Date.now()}` : '';
    fetch(`/api/riot/player?name=${encodeURIComponent(summonerName)}${q}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setProfile(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, [summonerName]);

  const tierIcon = (tier) => {
    const icons = { IRON: '🪨', BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎', EMERALD: '💚', DIAMOND: '💠', MASTER: '🏅', GRANDMASTER: '🔱', CHALLENGER: '👑' };
    return icons[tier] || '🎮';
  };

  const tierColor = (tier) => {
    const colors = { IRON: '#8B8589', BRONZE: '#CD7F32', SILVER: '#C0C0C0', GOLD: '#FFD700', PLATINUM: '#00CED1', EMERALD: '#50C878', DIAMOND: '#B9F2FF', MASTER: '#9B59B6', GRANDMASTER: '#E74C3C', CHALLENGER: '#F1C40F' };
    return colors[tier] || '#C8AA6E';
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 60 }} onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-cinzel text-xl font-bold">{lang === 'pl' ? 'Profil gracza' : 'Player Profile'}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchProfile(true)} disabled={loading} className="text-xs text-lolblue hover:text-blue-400 border border-lolblue/30 rounded px-2 py-1 transition-colors disabled:opacity-50" title={lang === 'pl' ? 'Odśwież dane' : 'Refresh data'}>
              {loading ? '...' : '🔄'}
            </button>
            <button onClick={onClose} className="text-dim hover:text-gold text-xl">✕</button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-gold2 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-dim mt-2">{lang === 'pl' ? 'Ładowanie profilu...' : 'Loading profile...'}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-lolred">{error}</p>
            <p className="text-dim text-sm mt-1">{lang === 'pl' ? 'Sprawdź czy nick jest poprawny (Nick#TAG)' : 'Check if the name is correct (Name#TAG)'}</p>
          </div>
        )}

        {profile && !loading && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-bg3">
              <img src={profile.profileIconUrl} alt="" className="w-16 h-16 rounded-lg border-2 border-gold2" />
              <div>
                <h3 className="font-cinzel text-lg font-bold">{profile.gameName}<span className="text-dim">#{profile.tagLine}</span></h3>
                <p className="text-dim text-sm">Level {profile.summonerLevel}</p>
                {profile.inGame && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs text-lolgreen font-bold bg-lolgreen/10 px-2 py-0.5 rounded">
                    <span className="live-dot" style={{background:'#3CB878'}}></span>
                    {lang === 'pl' ? 'W grze!' : 'In Game!'}
                  </span>
                )}
              </div>
            </div>

            {/* Ranked info */}
            <div className="grid grid-cols-2 gap-3">
              {/* Solo/Duo */}
              <div className="p-3 rounded-lg bg-bg3 border border-border">
                <p className="text-dim text-xs uppercase tracking-wider mb-2">Solo/Duo</p>
                {profile.soloQ ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tierIcon(profile.soloQ.tier)}</span>
                      <div>
                        <p className="font-bold" style={{ color: tierColor(profile.soloQ.tier) }}>
                          {profile.soloQ.tier} {profile.soloQ.rank}
                        </p>
                        <p className="text-dim text-xs">{profile.soloQ.lp} LP</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-lolgreen">{profile.soloQ.wins}W</span>
                      <span className="text-dim mx-1">/</span>
                      <span className="text-lolred">{profile.soloQ.losses}L</span>
                      <span className="text-dim ml-2">({profile.soloQ.winRate}%)</span>
                    </div>
                  </>
                ) : <p className="text-dim text-sm">{lang === 'pl' ? 'Brak rangi' : 'Unranked'}</p>}
              </div>

              {/* Flex */}
              <div className="p-3 rounded-lg bg-bg3 border border-border">
                <p className="text-dim text-xs uppercase tracking-wider mb-2">Flex</p>
                {profile.flexQ ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tierIcon(profile.flexQ.tier)}</span>
                      <div>
                        <p className="font-bold" style={{ color: tierColor(profile.flexQ.tier) }}>
                          {profile.flexQ.tier} {profile.flexQ.rank}
                        </p>
                        <p className="text-dim text-xs">{profile.flexQ.lp} LP</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-lolgreen">{profile.flexQ.wins}W</span>
                      <span className="text-dim mx-1">/</span>
                      <span className="text-lolred">{profile.flexQ.losses}L</span>
                      <span className="text-dim ml-2">({profile.flexQ.winRate}%)</span>
                    </div>
                  </>
                ) : <p className="text-dim text-sm">{lang === 'pl' ? 'Brak rangi' : 'Unranked'}</p>}
              </div>
            </div>

            {/* Performance Stats */}
            {profile.avgStats && (
              <div>
                <h4 className="text-sm font-bold text-gold2 mb-2">{lang === 'pl' ? `Statystyki (ostatnie ${profile.recentMatches?.length || 0} gier)` : `Stats (last ${profile.recentMatches?.length || 0} games)`}</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-bg3 text-center">
                    <p className="text-lg font-bold" style={{ color: parseInt(profile.avgStats.recentWinRate) >= 50 ? '#3CB878' : '#C84040' }}>{profile.avgStats.recentWinRate}%</p>
                    <p className="text-[10px] text-dim uppercase">Win Rate</p>
                  </div>
                  <div className="p-2 rounded bg-bg3 text-center">
                    <p className="text-lg font-bold text-gold2">{profile.avgStats.avgKills}/{profile.avgStats.avgDeaths}/{profile.avgStats.avgAssists}</p>
                    <p className="text-[10px] text-dim uppercase">Avg KDA</p>
                  </div>
                  <div className="p-2 rounded bg-bg3 text-center">
                    <p className="text-lg font-bold" style={{ color: parseFloat(profile.avgStats.avgCSPerMin) >= 7 ? '#3CB878' : parseFloat(profile.avgStats.avgCSPerMin) >= 5 ? '#C8AA6E' : '#C84040' }}>{profile.avgStats.avgCSPerMin}</p>
                    <p className="text-[10px] text-dim uppercase">CS/min</p>
                  </div>
                  <div className="p-2 rounded bg-bg3 text-center">
                    <p className="text-lg font-bold text-lolblue">{profile.avgStats.avgKP}%</p>
                    <p className="text-[10px] text-dim uppercase">Kill Part.</p>
                  </div>
                  <div className="p-2 rounded bg-bg3 text-center">
                    <p className="text-sm font-bold">{(profile.avgStats?.avgDamagePerMin || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-dim uppercase">DMG/min</p>
                  </div>
                  <div className="p-2 rounded bg-bg3 text-center">
                    <p className="text-sm font-bold">{profile.avgStats.avgGoldPerMin}</p>
                    <p className="text-[10px] text-dim uppercase">Gold/min</p>
                  </div>
                  <div className="p-2 rounded bg-bg3 text-center">
                    <p className="text-sm font-bold">{profile.avgStats.avgVision}</p>
                    <p className="text-[10px] text-dim uppercase">Vision</p>
                  </div>
                  <div className="p-2 rounded bg-bg3 text-center">
                    <p className="text-sm font-bold">{profile.avgStats.avgGameDuration}min</p>
                    <p className="text-[10px] text-dim uppercase">Avg Game</p>
                  </div>
                </div>

                {/* Fun facts / highlights */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.avgStats.favoriteRole && (
                    <span className="text-[11px] px-2 py-1 rounded bg-bg3 border border-border">
                      🎯 {lang === 'pl' ? 'Ulubiona rola' : 'Main role'}: <strong>{profile.avgStats.favoriteRole}</strong>
                    </span>
                  )}
                  {profile.avgStats.firstBloodRate > 0 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-bg3 border border-border">
                      🩸 First Blood: <strong>{profile.avgStats.firstBloodRate}%</strong>
                    </span>
                  )}
                  {profile.avgStats.winStreak >= 2 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-lolgreen/10 border border-lolgreen/30 text-lolgreen">
                      🔥 {profile.avgStats.winStreak} win streak!
                    </span>
                  )}
                  {profile.avgStats.lossStreak >= 3 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-lolred/10 border border-lolred/30 text-lolred">
                      💀 {profile.avgStats.lossStreak} loss streak
                    </span>
                  )}
                  {profile.avgStats.totalPentas > 0 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-gold2/10 border border-gold2/30 text-gold2">
                      👑 {profile.avgStats.totalPentas} Pentakill{profile.avgStats.totalPentas > 1 ? 's' : ''}!
                    </span>
                  )}
                  {profile.avgStats.totalQuadras > 0 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-bg3 border border-border">
                      ⚡ {profile.avgStats.totalQuadras} Quadra
                    </span>
                  )}
                  {profile.avgStats.totalTriples > 0 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-bg3 border border-border">
                      ✨ {profile.avgStats.totalTriples} Triple
                    </span>
                  )}
                  {parseFloat(profile.avgStats.avgCSPerMin) >= 8 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-lolgreen/10 border border-lolgreen/30 text-lolgreen">
                      🌾 {lang === 'pl' ? 'Świetny farming!' : 'Great farmer!'}
                    </span>
                  )}
                  {parseFloat(profile.avgStats.avgCSPerMin) < 4 && parseFloat(profile.avgStats.avgCSPerMin) > 0 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-lolred/10 border border-lolred/30 text-dim">
                      🌾 {lang === 'pl' ? 'Słaby farming' : 'Low CS'}
                    </span>
                  )}
                  {parseInt(profile.avgStats.avgKP) >= 70 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-lolblue/10 border border-lolblue/30 text-lolblue">
                      🤝 {lang === 'pl' ? 'Gracz zespołowy!' : 'Team player!'}
                    </span>
                  )}
                  {parseFloat(profile.avgStats.avgVision) >= 30 && (
                    <span className="text-[11px] px-2 py-1 rounded bg-bg3 border border-border">
                      👁️ {lang === 'pl' ? 'Dobry vision' : 'Good vision'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Top Champions (Mastery) */}
            {profile.topChampions?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gold2 mb-2">{lang === 'pl' ? 'Najlepsze postacie' : 'Top Champions'}</h4>
                <div className="flex gap-2 flex-wrap">
                  {profile.topChampions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg3 border border-border">
                      <ChampIcon name={c.champion} ddragon={ddragon} />
                      <div>
                        <p className="text-sm font-semibold">{c.champion}</p>
                        <p className="text-dim text-xs">M{c.level} - {c.points > 1000 ? `${(c.points / 1000).toFixed(0)}k` : c.points} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Champion Winrates */}
            {profile.championWinrates?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gold2 mb-2">{lang === 'pl' ? 'Winrate na championach' : 'Champion Winrates'}</h4>
                <div className="space-y-1">
                  {profile.championWinrates.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded bg-bg3 text-sm">
                      <ChampIcon name={c.champion} ddragon={ddragon} />
                      <span className="font-semibold w-20 truncate">{c.champion}</span>
                      <span className="text-dim text-xs">{c.games} {lang === 'pl' ? 'gier' : 'games'}</span>
                      <div className="flex-1 mx-2 h-1.5 bg-bg rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.winRate}%`, background: parseInt(c.winRate) >= 50 ? '#3CB878' : '#C84040' }}></div>
                      </div>
                      <span className={`text-xs font-bold ${parseInt(c.winRate) >= 50 ? 'text-lolgreen' : 'text-lolred'}`}>{c.winRate}%</span>
                      <span className="text-dim text-xs">KDA {c.avgKDA}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent matches */}
            {profile.recentMatches?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gold2 mb-2">{lang === 'pl' ? 'Ostatnie mecze' : 'Recent Matches'}</h4>
                <div className="space-y-1">
                  {profile.recentMatches.map((m, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${m.win ? 'bg-lolgreen/10 border-l-2 border-lolgreen' : 'bg-lolred/10 border-l-2 border-lolred'}`}>
                      <ChampIcon name={m.champion} ddragon={ddragon} />
                      <span className="font-semibold w-16 truncate">{m.champion}</span>
                      <span className={`font-bold text-xs w-5 ${m.win ? 'text-lolgreen' : 'text-lolred'}`}>{m.win ? 'W' : 'L'}</span>
                      {m.isCustom && <span className="text-[9px] bg-gold2/20 text-gold2 px-1 rounded font-bold">CUSTOM</span>}
                      <span className="text-dim text-xs">{m.kills}/{m.deaths}/{m.assists}</span>
                      <span className="text-dim text-xs">{m.cs} CS ({m.csPerMin}/m)</span>
                      {m.killParticipation > 0 && <span className="text-dim text-xs hidden sm:inline">{m.killParticipation}% KP</span>}
                      {m.damageDealt && <span className="text-dim text-xs hidden sm:inline">{(m.damageDealt/1000).toFixed(1)}k dmg</span>}
                      <span className="text-dim text-xs ml-auto">{Math.floor(m.gameDuration / 60)}min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Team Modal with match history ----
function TeamModal({ team, teams, bracket, lang, onClose, onPlayerClick }) {
  if (!team) return null;
  const color = getTeamColor(teams, team.id);
  const sections = [...(bracket?.winners || []), ...(bracket?.losers || []), ...(bracket?.grandFinal ? [bracket.grandFinal] : [])];
  const matchHistory = [];
  for (const round of sections) {
    for (const match of round.matches) {
      if (match.t1 === team.id || match.t2 === team.id) {
        matchHistory.push({
          matchId: match.id, roundName: round.name,
          opponent: match.t1 === team.id ? match.t2 : match.t1,
          wins: match.t1 === team.id ? (match.wins||[0,0]) : [(match.wins||[0,0])[1], (match.wins||[0,0])[0]],
          result: match.winner === team.id ? 'W' : match.winner ? 'L' : null,
          isLive: match.status === 'live', mvp: match.mvp,
        });
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TeamIcon team={team} teams={teams} />
            <h2 className="font-cinzel text-2xl font-bold" style={{ color }}>[{team.tag}] {team.name}</h2>
          </div>
          <button onClick={onClose} className="text-dim hover:text-gold text-xl">✕</button>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gold2">{t(lang, 'roster')}</h3>
        <div className="space-y-1 mb-4 stagger-children">
          {(team.players || []).map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded bg-bg3">
              <span>{ROLE_ICONS[p.role] || '🎮'}</span>
              {p.role && <span className="text-dim text-sm w-16">{p.role}</span>}
              <button onClick={() => onPlayerClick?.(p.riotTag ? `${p.summonerName}#${p.riotTag}` : p.summonerName)} className="font-semibold hover:text-gold2 transition-colors cursor-pointer text-left">{p.summonerName}{p.riotTag && <span className="text-dim text-xs ml-0.5">#{p.riotTag}</span>}</button>
              {p.captain && <span title="Kapitan">👑</span>}
              {p.opgg && <a href={p.opgg.startsWith('http') ? p.opgg : `https://www.op.gg/summoners/eune/${encodeURIComponent(p.opgg)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-lolblue hover:underline ml-auto" onClick={e => e.stopPropagation()}>op.gg</a>}
            </div>
          ))}
        </div>
        {matchHistory.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mb-2 text-gold2">{t(lang, 'matchHistory')}</h3>
            <div className="space-y-1 mb-4">
              {matchHistory.map(mh => {
                const opTeam = getTeam(teams, mh.opponent);
                return (
                  <div key={mh.matchId} className="flex items-center justify-between px-3 py-2 rounded bg-bg3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-xs w-5 ${mh.result === 'W' ? 'text-lolgreen' : mh.result === 'L' ? 'text-lolred' : 'text-dim'}`}>{mh.result || '-'}</span>
                      <span className="text-dim text-xs">{mh.roundName}</span>
                      <span>vs</span>
                      <span className="font-cinzel font-bold" style={{ color: getTeamColor(teams, mh.opponent) }}>{opTeam ? `[${opTeam.tag}] ${opTeam.name}` : 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{(mh.wins||[0,0])[0]} - {(mh.wins||[0,0])[1]}</span>
                      {mh.isLive && <span className="live-indicator"><span className="live-dot"></span>LIVE</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <button onClick={onClose} className="btn-secondary w-full mt-2">{t(lang, 'close')}</button>
      </div>
    </div>
  );
}

// ---- Predictions Panel ----
function PredictionsPanel({ bracket, teams, predictions, onVote, lang }) {
  const allMatches = [];
  const sections = [...(bracket?.winners || []), ...(bracket?.losers || []), ...(bracket?.grandFinal ? [bracket.grandFinal] : [])];
  for (const round of sections) {
    for (const match of round.matches) {
      if (match.t1 && match.t2 && !match.winner) allMatches.push({ ...match, roundName: round.name, roundId: round.id });
    }
  }
  if (allMatches.length === 0) return (
    <div className="text-center py-12">
      <p className="text-3xl mb-3">🗳️</p>
      <p className="text-dim text-lg">{lang === 'pl' ? 'Brak meczy do głosowania' : 'No matches to vote on'}</p>
      <p className="text-dim text-sm mt-1">{lang === 'pl' ? 'Poczekaj aż zostaną ustalone pary' : 'Wait for matchups to be set'}</p>
    </div>
  );

  const totalVotesAll = allMatches.reduce((s, m) => {
    const pred = predictions?.[m.id] || {};
    return s + (pred[m.t1] || 0) + (pred[m.t2] || 0);
  }, 0);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Summary */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h3 className="font-cinzel font-bold text-gold2">{lang === 'pl' ? 'Predykcje kibiców' : 'Fan Predictions'}</h3>
          <p className="text-dim text-sm">{lang === 'pl' ? 'Kliknij drużynę, na którą stawiasz' : 'Click the team you think will win'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gold2">{totalVotesAll}</p>
          <p className="text-[10px] text-dim uppercase">{lang === 'pl' ? 'głosów' : 'votes'}</p>
        </div>
      </div>

      {/* Matches */}
      <div className="space-y-3 stagger-children">
        {allMatches.map(match => {
          const pred = predictions?.[match.id] || {};
          const t1Votes = pred[match.t1] || 0;
          const t2Votes = pred[match.t2] || 0;
          const total = t1Votes + t2Votes;
          const t1Pct = total > 0 ? Math.round(t1Votes / total * 100) : 50;
          const t2Pct = 100 - t1Pct;
          const voted = typeof document !== 'undefined' && document.cookie.includes(`voted_${match.id}`);
          const t1Color = getTeamColor(teams, match.t1);
          const t2Color = getTeamColor(teams, match.t2);
          const t1 = teams.find(tt => tt.id === match.t1);
          const t2 = teams.find(tt => tt.id === match.t2);
          const isGrandFinal = match.roundId === 'gf';

          return (
            <div key={match.id} className={`card overflow-hidden ${isGrandFinal ? 'border-gold2/40' : ''}`}>
              {/* Header */}
              <div className={`px-3 py-1.5 border-b border-border text-[11px] text-dim uppercase tracking-wider font-semibold flex items-center justify-between ${isGrandFinal ? 'bg-gold2/5' : 'bg-bg3/50'}`}>
                <span>{match.roundName}</span>
                {total > 0 && <span>{total} {lang === 'pl' ? 'głosów' : 'votes'}</span>}
              </div>

              <div className="p-4">
                {/* Team buttons */}
                <div className="flex items-stretch gap-3">
                  <button onClick={() => !voted && onVote(match.id, match.t1)} disabled={voted}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${voted ? 'cursor-default' : 'hover:scale-[1.02] hover:shadow-lg cursor-pointer'} ${total > 0 && t1Pct > t2Pct ? 'border-opacity-60' : 'border-opacity-30'}`}
                    style={{ borderColor: t1Color, background: `${t1Color}08` }}>
                    <TeamIcon team={t1} teams={teams} />
                    <span className="font-cinzel font-bold text-sm" style={{ color: t1Color }}>{t1?.tag || '?'}</span>
                    {total > 0 && (
                      <span className="text-xl font-black" style={{ color: t1Pct >= t2Pct ? t1Color : 'var(--dim)' }}>{t1Pct}%</span>
                    )}
                  </button>

                  <div className="flex flex-col items-center justify-center">
                    <span className="text-dim text-xs font-bold">VS</span>
                  </div>

                  <button onClick={() => !voted && onVote(match.id, match.t2)} disabled={voted}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${voted ? 'cursor-default' : 'hover:scale-[1.02] hover:shadow-lg cursor-pointer'} ${total > 0 && t2Pct > t1Pct ? 'border-opacity-60' : 'border-opacity-30'}`}
                    style={{ borderColor: t2Color, background: `${t2Color}08` }}>
                    <TeamIcon team={t2} teams={teams} />
                    <span className="font-cinzel font-bold text-sm" style={{ color: t2Color }}>{t2?.tag || '?'}</span>
                    {total > 0 && (
                      <span className="text-xl font-black" style={{ color: t2Pct > t1Pct ? t2Color : 'var(--dim)' }}>{t2Pct}%</span>
                    )}
                  </button>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span style={{ color: t1Color }}>{t1?.tag} — {t1Votes} {lang === 'pl' ? 'gł.' : 'v.'} ({t1Pct}%)</span>
                      <span style={{ color: t2Color }}>({t2Pct}%) {t2Votes} {lang === 'pl' ? 'gł.' : 'v.'} — {t2?.tag}</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex bg-bg3 border border-border">
                      <div className="h-full transition-all duration-500" style={{ width: `${t1Pct}%`, background: `linear-gradient(90deg, ${t1Color}, ${t1Color}CC)` }}></div>
                      <div className="h-full transition-all duration-500" style={{ width: `${t2Pct}%`, background: `linear-gradient(90deg, ${t2Color}CC, ${t2Color})` }}></div>
                    </div>
                  </div>
                )}

                {/* Status */}
                {voted && (
                  <p className="text-dim text-xs mt-2 text-center flex items-center justify-center gap-1">
                    ✓ {lang === 'pl' ? 'Zagłosowano' : 'Voted'}
                  </p>
                )}
                {!voted && total === 0 && (
                  <p className="text-dim text-xs mt-3 text-center">{lang === 'pl' ? 'Bądź pierwszy! Kliknij drużynę powyżej.' : 'Be the first! Click a team above.'}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Mobile Bracket List ----
function BracketListView({ bracket, teams, onMatchClick, lang }) {
  const sections = [
    { title: t(lang, 'winnersBracket'), rounds: bracket.winners || [], color: 'text-lolgreen' },
    { title: t(lang, 'losersBracket'), rounds: bracket.losers || [], color: 'text-lolred' },
    ...(bracket.grandFinal ? [{ title: t(lang, 'grandFinal'), rounds: [bracket.grandFinal], color: 'text-gold2' }] : []),
  ];
  return (
    <div className="space-y-6 animate-fadeIn">
      {sections.map((sec, si) => (
        <div key={si}>
          <h3 className={`font-cinzel text-lg font-bold ${sec.color} mb-3`}>{sec.title}</h3>
          {sec.rounds.map(round => (
            <div key={round.id} className="mb-4">
              <div className="text-xs text-dim font-semibold mb-2 px-1">{round.name}</div>
              <div className="space-y-2">
                {round.matches.map(match => {
                  const isLive = match.t1 && match.t2 && !match.winner && (match.wins?.[0] > 0 || match.wins?.[1] > 0);
                  const t1Name = getTeamTag(teams, match.t1);
                  const t2Name = getTeamTag(teams, match.t2);
                  const w1 = match.wins?.[0] || 0;
                  const w2 = match.wins?.[1] || 0;
                  return (
                    <div key={match.id} onClick={() => onMatchClick(match, round)}
                      className={`card p-3 cursor-pointer hover:border-gold2/50 transition-colors ${isLive ? 'border-lolgreen/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`font-cinzel font-bold text-sm truncate ${match.winner === match.t1 ? 'text-lolgreen' : ''}`}
                            style={{ color: match.winner !== match.t1 ? getTeamColor(teams, match.t1) : undefined }}>
                            {t1Name}
                          </span>
                          <span className="text-dim text-xs">vs</span>
                          <span className={`font-cinzel font-bold text-sm truncate ${match.winner === match.t2 ? 'text-lolgreen' : ''}`}
                            style={{ color: match.winner !== match.t2 ? getTeamColor(teams, match.t2) : undefined }}>
                            {t2Name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {(match.t1 && match.t2) && <span className="font-bold text-sm">{w1} - {w2}</span>}
                          {isLive && <span className="live-indicator text-xs"><span className="live-dot"></span>LIVE</span>}
                          {match.winner && <span className="text-lolgreen text-xs">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---- Bracket View with auto-scroll to LIVE ----
function BracketView({ bracket, teams, onTeamClick, onMatchClick, predictions, lang }) {
  const containerRef = useRef(null);
  const [listMode, setListMode] = useState(false);

  // Auto-scroll to LIVE match
  useEffect(() => {
    if (!containerRef.current || listMode) return;
    const liveEl = containerRef.current.querySelector('.is-live');
    if (liveEl) liveEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [bracket, listMode]);

  // Default to list on small screens
  useEffect(() => {
    if (window.innerWidth < 640) setListMode(true);
  }, []);

  if (!bracket) return null;

  const renderRoundWithConnectors = (rounds) => {
    const elements = [];
    rounds.forEach((round, ri) => {
      elements.push(
        <div key={round.id} className="bracket-round">
          <div className="text-xs text-dim text-center mb-1 font-semibold">{round.name}</div>
          {round.matches.map(match => (
            <MatchCard key={match.id} match={match} teams={teams} bestOf={round.bestOf} predictions={predictions} lang={lang}
              onClick={() => onMatchClick(match, round)}
            />
          ))}
        </div>
      );
      if (ri < rounds.length - 1 && round.matches.length > 1) {
        elements.push(<BracketConnector key={`c-${round.id}`} count={round.matches.length} matches={round.matches} />);
      } else if (ri < rounds.length - 1) {
        const active = round.matches[0]?.winner;
        elements.push(<div key={`s-${round.id}`} className="flex items-center"><div className={`w-8 h-[2px] connector-line-h ${active ? 'active' : ''}`}></div></div>);
      }
    });
    return elements;
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center">
        <button onClick={async () => {
          const el = containerRef.current?.closest('.space-y-4');
          if (!el) return;
          const { default: html2canvas } = await import('html2canvas');
          const canvas = await html2canvas(el, { backgroundColor: '#0a0e13', scale: 2, useCORS: true });
          const link = document.createElement('a');
          link.download = 'bracket.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }} className="btn-secondary text-xs px-3 py-1">
          {lang === 'pl' ? 'Eksportuj PNG' : 'Export PNG'}
        </button>
        <div className="flex gap-2">
          <button onClick={() => setListMode(false)} className={`px-3 py-1 text-xs rounded transition-colors ${!listMode ? 'bg-gold2/20 text-gold2 border border-gold2/40' : 'btn-secondary'}`}>
            {lang === 'pl' ? 'Drabinka' : 'Bracket'}
          </button>
          <button onClick={() => setListMode(true)} className={`px-3 py-1 text-xs rounded transition-colors ${listMode ? 'bg-gold2/20 text-gold2 border border-gold2/40' : 'btn-secondary'}`}>
            {lang === 'pl' ? 'Lista' : 'List'}
          </button>
        </div>
      </div>

      {listMode ? (
        <BracketListView bracket={bracket} teams={teams} onMatchClick={onMatchClick} lang={lang} />
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="font-cinzel text-xl font-bold text-lolgreen mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lolgreen"></span>{t(lang, 'winnersBracket')}
            </h3>
            <div className="bracket-container" ref={containerRef}>{renderRoundWithConnectors(bracket.winners || [])}</div>
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-lolred mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lolred"></span>{t(lang, 'losersBracket')}
            </h3>
            <div className="bracket-container">{renderRoundWithConnectors(bracket.losers || [])}</div>
          </div>
          {bracket.grandFinal && (
            <div>
              <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gold2"></span>{t(lang, 'grandFinal')}
              </h3>
              <div className="flex justify-center">
                <div className="min-w-[240px]">
                  {bracket.grandFinal.matches.map(match => (
                    <MatchCard key={match.id} match={match} teams={teams} bestOf={bracket.grandFinal.bestOf} predictions={predictions} lang={lang}
                      onClick={() => onMatchClick(match, bracket.grandFinal)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Teams Grid ----
function TeamsGrid({ teams, onTeamClick, onPlayerClick, lang }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {teams.map(team => {
        const color = getTeamColor(teams, team.id);
        return (
          <div key={team.id} className="card p-4 cursor-pointer hover:transform hover:scale-[1.02]" onClick={() => onTeamClick(team)}>
            <div className="flex items-center gap-3 mb-3">
              <TeamIcon team={team} teams={teams} />
              <h3 className="font-cinzel text-lg font-bold" style={{ color }}>[{team.tag}] {team.name}</h3>
            </div>
            <div className="space-y-1">
              {(team.players || []).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-xs">{ROLE_ICONS[p.role] || '🎮'}</span>
                  {p.role && <span className="text-dim w-14">{p.role}</span>}
                  <button onClick={e => { e.stopPropagation(); onPlayerClick?.(p.riotTag ? `${p.summonerName}#${p.riotTag}` : p.summonerName); }} className="hover:text-gold2 transition-colors cursor-pointer">{p.summonerName}{p.riotTag && <span className="text-dim text-xs ml-0.5">#{p.riotTag}</span>}</button>
                  {p.captain && <span>👑</span>}
                  {p.opgg && <a href={p.opgg.startsWith('http') ? p.opgg : `https://www.op.gg/summoners/eune/${encodeURIComponent(p.opgg)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-lolblue hover:underline ml-auto">op.gg</a>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {teams.length === 0 && <p className="text-dim col-span-4 text-center py-8">{t(lang, 'noTeams')}</p>}
    </div>
  );
}

// ---- Schedule with Countdown ----
// ---- Upcoming Progress Bar ----
function UpcomingBar({ scheduledTime }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const target = new Date(scheduledTime).getTime();
      const diff = target - now;
      if (diff <= 0) { setProgress(100); return; }
      // Show progress in the last 60 minutes before match
      const window = 60 * 60 * 1000;
      if (diff > window) { setProgress(0); return; }
      setProgress(Math.round(((window - diff) / window) * 100));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [scheduledTime]);
  if (progress <= 0) return null;
  return (
    <div className="w-full mt-2 h-1.5 rounded-full bg-bg3 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 ${progress >= 90 ? 'schedule-bar-pulse' : ''}`}
        style={{ width: `${progress}%`, background: progress >= 90 ? '#E84057' : progress >= 50 ? '#C89B3C' : '#1A9FD4' }} />
    </div>
  );
}

function ScheduleView({ schedule, teams, lang }) {
  // Group by status: LIVE first, then upcoming, then finished
  const live = schedule.filter(m => m.status === 'live');
  const upcoming = schedule.filter(m => !m.winner && m.status !== 'live' && m.t1 && m.t2);
  const finished = schedule.filter(m => m.winner);
  const tbd = schedule.filter(m => !m.winner && m.status !== 'live' && (!m.t1 || !m.t2));

  const renderMatch = (match) => {
    const isLive = match.status === 'live';
    const isFinished = !!match.winner;
    const isFuture = match.scheduledTime && !isFinished && !isLive && new Date(match.scheduledTime).getTime() > Date.now();
    const isUpcomingSoon = isFuture && (new Date(match.scheduledTime).getTime() - Date.now()) < 60 * 60 * 1000;
    const t1Color = getTeamColor(teams, match.t1);
    const t2Color = getTeamColor(teams, match.t2);
    const t1Tag = getTeamTag(teams, match.t1);
    const t2Tag = getTeamTag(teams, match.t2);
    const winnerIsT1 = match.winner === match.t1;

    return (
      <div key={match.id} className={`card overflow-hidden ${isLive ? 'border-lolred/50 schedule-live-glow' : ''} ${isUpcomingSoon ? 'border-gold2/30' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-bg3/50">
          <span className="text-[11px] text-dim uppercase tracking-wider font-semibold">{match.roundName}</span>
          <div className="flex items-center gap-2">
            {match.streamUrl && (
              <a href={match.streamUrl} target="_blank" rel="noopener noreferrer"
                className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${isLive ? 'text-lolred hover:text-red-400' : 'text-lolblue hover:text-blue-400'}`}>
                {isLive && <span className="live-dot" style={{width:5,height:5}}></span>}
                {isLive ? '📺 LIVE' : '📺'}
              </a>
            )}
            {isLive && <span className="text-[11px] font-bold text-lolred flex items-center gap-1"><span className="live-dot"></span>LIVE</span>}
            {isFinished && <span className="text-[11px] font-bold text-lolgreen">{lang === 'pl' ? 'Zakończony' : 'Finished'}</span>}
          </div>
        </div>

        {/* Teams */}
        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* Team 1 */}
            <div className={`flex-1 flex items-center gap-2 p-2 rounded-lg transition-colors ${isFinished && winnerIsT1 ? 'bg-lolgreen/10' : 'bg-bg3/30'}`}>
              <TeamIcon team={teams.find(tt => tt.id === match.t1)} teams={teams} />
              <div className="flex-1 min-w-0">
                <p className="font-cinzel font-bold text-sm truncate" style={{ color: t1Color }}>{t1Tag}</p>
              </div>
              {isFinished && <span className={`text-lg font-black ${winnerIsT1 ? 'text-lolgreen' : 'text-dim'}`}>{(match.wins||[0,0])[0]}</span>}
              {isFinished && winnerIsT1 && <span className="text-lolgreen text-xs">✓</span>}
            </div>

            {/* VS */}
            <div className="flex flex-col items-center">
              <span className="text-dim text-xs font-bold">VS</span>
              {match.bestOf > 1 && <span className="text-[10px] text-dim">BO{match.bestOf}</span>}
            </div>

            {/* Team 2 */}
            <div className={`flex-1 flex items-center gap-2 p-2 rounded-lg transition-colors ${isFinished && !winnerIsT1 && match.winner ? 'bg-lolgreen/10' : 'bg-bg3/30'}`}>
              <TeamIcon team={teams.find(tt => tt.id === match.t2)} teams={teams} />
              <div className="flex-1 min-w-0">
                <p className="font-cinzel font-bold text-sm truncate" style={{ color: t2Color }}>{t2Tag}</p>
              </div>
              {isFinished && <span className={`text-lg font-black ${!winnerIsT1 && match.winner ? 'text-lolgreen' : 'text-dim'}`}>{(match.wins||[0,0])[1]}</span>}
              {isFinished && !winnerIsT1 && match.winner && <span className="text-lolgreen text-xs">✓</span>}
            </div>
          </div>

          {/* MVP */}
          {match.mvp && <p className="text-xs text-gold2 mt-2 text-center">🏆 MVP: <strong>{match.mvp}</strong></p>}

          {/* Date / Countdown */}
          <div className="mt-2 flex items-center justify-center gap-2">
            {isFuture && <Countdown targetTime={match.scheduledTime} lang={lang} />}
            {match.scheduledTime && !isFuture && (
              <span className="text-xs text-dim">📅 {new Date(match.scheduledTime).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>

        {/* Progress bars */}
        {isLive && (
          <div className="w-full h-1 bg-bg3">
            <div className="h-full bg-lolred schedule-bar-pulse" style={{ width: '100%' }} />
          </div>
        )}
        {isFuture && <div className="px-3 pb-2"><UpcomingBar scheduledTime={match.scheduledTime} /></div>}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* LIVE */}
      {live.length > 0 && (
        <div>
          <h3 className="font-cinzel text-lg font-bold text-lolred mb-3 flex items-center gap-2">
            <span className="live-dot"></span> {lang === 'pl' ? 'Trwające mecze' : 'Live Matches'}
          </h3>
          <div className="space-y-3">{live.map(renderMatch)}</div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="font-cinzel text-lg font-bold text-lolblue mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lolblue"></span> {lang === 'pl' ? 'Nadchodzące mecze' : 'Upcoming Matches'} <span className="text-dim text-sm font-normal">({upcoming.length})</span>
          </h3>
          <div className="space-y-3">{upcoming.map(renderMatch)}</div>
        </div>
      )}

      {/* Finished */}
      {finished.length > 0 && (
        <div>
          <h3 className="font-cinzel text-lg font-bold text-lolgreen mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lolgreen"></span> {lang === 'pl' ? 'Zakończone' : 'Finished'} <span className="text-dim text-sm font-normal">({finished.length})</span>
          </h3>
          <div className="space-y-3">{finished.map(renderMatch)}</div>
        </div>
      )}

      {/* TBD */}
      {tbd.length > 0 && (
        <div>
          <h3 className="font-cinzel text-lg font-bold text-dim mb-3">{lang === 'pl' ? 'Oczekujące na drużyny' : 'Waiting for teams'} ({tbd.length})</h3>
          <div className="space-y-2">
            {tbd.map(m => (
              <div key={m.id} className="card px-3 py-2 flex items-center justify-between opacity-50">
                <span className="text-xs text-dim uppercase">{m.roundName}</span>
                <span className="text-xs text-dim">TBD vs TBD</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {schedule.length === 0 && <p className="text-dim text-center py-8">{t(lang, 'noMatches')}</p>}
    </div>
  );
}

// ---- Stats ----
function StatsView({ stats, lang, onPlayerClick, ddragon }) {
  const exportStatsPNG = () => {
    const canvas = document.createElement('canvas');
    const players = stats.players || [];
    const W = 800, rowH = 32, headerH = 60, padY = 20;
    canvas.width = W;
    canvas.height = headerH + padY * 2 + (players.length + 1) * rowH + 40;
    const ctx = canvas.getContext('2d');
    // Background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Title
    ctx.fillStyle = '#C89B3C';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(lang === 'pl' ? 'Ranking graczy' : 'Player Ranking', 20, headerH - 10);
    // Table header
    const cols = ['#', lang === 'pl' ? 'Gracz' : 'Player', lang === 'pl' ? 'Drużyna' : 'Team', 'K', 'D', 'A', 'CS', 'KDA', lang === 'pl' ? 'Gry' : 'Games'];
    const colX = [20, 50, 220, 340, 400, 460, 520, 590, 680];
    const y0 = headerH + padY;
    ctx.fillStyle = '#8A9BB4';
    ctx.font = 'bold 13px sans-serif';
    cols.forEach((c, ci) => ctx.fillText(c, colX[ci], y0));
    // Rows
    players.forEach((p, i) => {
      const y = y0 + (i + 1) * rowH;
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(26,42,62,0.3)'; ctx.fillRect(0, y - 14, W, rowH); }
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#8A9BB4'; ctx.fillText(`${i + 1}`, colX[0], y);
      ctx.fillStyle = '#E0E4EC'; ctx.fillText(p.summonerName || '', colX[1], y);
      ctx.fillStyle = '#8A9BB4'; ctx.fillText(p.team?.tag || '', colX[2], y);
      ctx.fillStyle = '#3CB878'; ctx.fillText(`${p.kills}`, colX[3], y);
      ctx.fillStyle = '#C84040'; ctx.fillText(`${p.deaths}`, colX[4], y);
      ctx.fillStyle = '#1A9FD4'; ctx.fillText(`${p.assists}`, colX[5], y);
      ctx.fillStyle = '#E0E4EC'; ctx.fillText(`${p.cs}`, colX[6], y);
      ctx.fillStyle = '#C89B3C'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(`${p.kda}`, colX[7], y);
      ctx.fillStyle = '#8A9BB4'; ctx.font = '13px sans-serif'; ctx.fillText(`${p.games}`, colX[8], y);
    });
    // Watermark
    ctx.fillStyle = '#5A6880';
    ctx.font = '11px sans-serif';
    ctx.fillText('Jaskinia Cup', 20, canvas.height - 15);
    // Download
    const link = document.createElement('a');
    link.download = 'stats.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-cinzel text-xl font-bold text-gold2">{t(lang, 'playerRanking')}</h3>
          {stats.players?.length > 0 && (
            <button onClick={exportStatsPNG} className="btn-secondary text-xs px-3 py-1">
              📊 {lang === 'pl' ? 'Eksport PNG' : 'Export PNG'}
            </button>
          )}
        </div>
        {stats.players?.length > 0 ? (
          <>
            {/* Top 3 podium */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {stats.players.slice(0, 3).map((p, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                const borderColors = ['border-gold2', 'border-gray-400', 'border-amber-700'];
                const teamColor = p.team ? getTeamColor(stats.teams?.map(t => t.team) || [], p.teamId) : '#C8AA6E';
                return (
                  <div key={i} className={`card p-4 text-center border-2 ${borderColors[i]} ${i === 0 ? 'bg-gold2/5' : ''}`}>
                    <p className="text-2xl mb-1">{medals[i]}</p>
                    <button onClick={() => onPlayerClick?.(p.riotTag ? `${p.summonerName}#${p.riotTag}` : p.summonerName)}
                      className="font-cinzel font-bold text-sm hover:text-gold2 transition-colors cursor-pointer">{p.summonerName}</button>
                    <p className="text-xs text-dim">{p.team?.tag}{p.role ? ` • ${ROLE_ICONS[p.role] || ''} ${p.role}` : ''}</p>
                    <p className="text-xl font-black text-gold2 mt-1">{p.kda} <span className="text-xs text-dim font-normal">KDA</span></p>
                    <p className="text-xs mt-1">
                      <span className="text-lolgreen">{p.kills}K</span> / <span className="text-lolred">{p.deaths}D</span> / <span className="text-lolblue">{p.assists}A</span>
                    </p>
                    <div className="flex justify-center gap-1 mt-2">{(p.champions || []).slice(0, 3).map((c, ci) => <ChampIcon key={ci} name={c} ddragon={ddragon} />)}</div>
                    <p className="text-[10px] text-dim mt-1">{p.games} {lang === 'pl' ? 'gier' : 'games'} • {p.cs} CS</p>
                  </div>
                );
              })}
            </div>

            {/* Full table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-dim border-b-2 border-border text-xs uppercase tracking-wider">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">{t(lang, 'player')}</th>
                  <th className="text-left py-2 px-2 hidden sm:table-cell">{t(lang, 'team')}</th>
                  <th className="text-left py-2 px-2">{t(lang, 'role')}</th>
                  <th className="text-right py-2 px-2 text-lolgreen">K</th>
                  <th className="text-right py-2 px-2 text-lolred">D</th>
                  <th className="text-right py-2 px-2 text-lolblue">A</th>
                  <th className="text-right py-2 px-2 hidden sm:table-cell">CS</th>
                  <th className="text-right py-2 px-2 text-gold2">KDA</th>
                  <th className="text-right py-2 px-2 hidden sm:table-cell">{t(lang, 'games')}</th>
                  <th className="text-left py-2 px-2 hidden md:table-cell">Champs</th>
                </tr></thead>
                <tbody>
                  {stats.players.map((p, i) => (
                    <tr key={i} className={`border-b border-border/30 hover:bg-bg3/50 transition-colors ${i < 3 ? 'bg-gold2/3' : ''}`}>
                      <td className="py-2.5 px-2 text-dim font-bold">{i + 1}</td>
                      <td className="py-2.5 px-2 font-semibold"><button onClick={() => onPlayerClick?.(p.riotTag ? `${p.summonerName}#${p.riotTag}` : p.summonerName)} className="hover:text-gold2 transition-colors cursor-pointer text-left">{p.summonerName}</button></td>
                      <td className="py-2.5 px-2 text-dim hidden sm:table-cell">{p.team?.tag}</td>
                      <td className="py-2.5 px-2">{p.role ? `${ROLE_ICONS[p.role] || ''} ${p.role}` : ''}</td>
                      <td className="py-2.5 px-2 text-right text-lolgreen font-semibold">{p.kills}</td>
                      <td className="py-2.5 px-2 text-right text-lolred font-semibold">{p.deaths}</td>
                      <td className="py-2.5 px-2 text-right text-lolblue font-semibold">{p.assists}</td>
                      <td className="py-2.5 px-2 text-right hidden sm:table-cell">{p.cs}</td>
                      <td className="py-2.5 px-2 text-right font-black text-gold2 text-base">{p.kda}</td>
                      <td className="py-2.5 px-2 text-right text-dim hidden sm:table-cell">{p.games}</td>
                      <td className="py-2.5 px-2 hidden md:table-cell">
                        <div className="flex gap-1">{(p.champions || []).slice(0, 3).map((c, ci) => <ChampIcon key={ci} name={c} ddragon={ddragon} />)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : <p className="text-dim text-center py-4">{t(lang, 'noData')}</p>}
      </div>

      {/* Team Ranking */}
      <div>
        <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4">{t(lang, 'teamRanking')}</h3>
        {stats.teams?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.teams.map((tm, i) => {
              const wr = tm.wins + tm.losses > 0 ? ((tm.wins / (tm.wins + tm.losses)) * 100).toFixed(0) : 0;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={i} className={`card p-4 ${i === 0 ? 'border-gold2/40' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {i < 3 && <span className="text-lg">{medals[i]}</span>}
                      <span className="font-cinzel font-bold">{tm.team?.tag}</span>
                    </div>
                    <span className="text-xl font-black" style={{ color: parseInt(wr) >= 50 ? '#3CB878' : '#C84040' }}>{wr}%</span>
                  </div>
                  <p className="text-sm text-dim">{tm.team?.name}</p>
                  <div className="flex gap-3 mt-2 text-sm">
                    <span className="text-lolgreen font-bold">{tm.wins}W</span>
                    <span className="text-lolred font-bold">{tm.losses}L</span>
                  </div>
                  {/* Win rate bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-bg3 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${wr}%`, background: parseInt(wr) >= 50 ? '#3CB878' : '#C84040' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-dim text-center py-4">{t(lang, 'noData')}</p>}
      </div>
    </div>
  );
}

// ---- Hall of Fame / Highlights ----
function HallOfFameView({ bracket, teams, stats, lang, ddragon }) {
  // Find Grand Final winner
  const gfMatch = bracket?.grandFinal?.matches?.[0];
  const champion = gfMatch?.winner ? teams.find(t => t.id === gfMatch.winner) : null;
  const runnerUp = gfMatch?.winner ? teams.find(t => t.id === (gfMatch.winner === gfMatch.t1 ? gfMatch.t2 : gfMatch.t1)) : null;

  // All matches for fun stats
  const allMatches = [];
  for (const s of ['winners', 'losers']) { if (bracket?.[s]) for (const r of bracket[s]) allMatches.push(...r.matches); }
  if (bracket?.grandFinal) allMatches.push(...bracket.grandFinal.matches);
  const finishedMatches = allMatches.filter(m => m.winner);

  // Closest matches (smallest win margin)
  const closestMatches = finishedMatches
    .filter(m => (m.wins||[0,0])[0] > 0 && (m.wins||[0,0])[1] > 0)
    .sort((a, b) => Math.abs((a.wins||[0,0])[0] - (a.wins||[0,0])[1]) - Math.abs((b.wins||[0,0])[0] - (b.wins||[0,0])[1]))
    .slice(0, 3);

  // Top KDA players
  const topPlayers = (stats.players || []).slice(0, 5);

  // Most played champions
  const champCounts = {};
  for (const m of allMatches) {
    for (const g of (m.games || [])) {
      for (const p of (g.players || [])) {
        if (p.champion) champCounts[p.champion] = (champCounts[p.champion] || 0) + 1;
      }
    }
  }
  const topChamps = Object.entries(champCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // MVPs per match
  const mvps = finishedMatches.filter(m => m.mvp).map(m => ({
    matchId: m.id, mvp: m.mvp,
    t1: teams.find(t => t.id === m.t1), t2: teams.find(t => t.id === m.t2),
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Champion spotlight */}
      {champion ? (
        <div className="card p-6 text-center relative overflow-hidden border-gold2/50">
          <div className="absolute inset-0 bg-gradient-to-b from-gold2/10 via-transparent to-gold2/5 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-gold2 text-sm font-semibold uppercase tracking-widest mb-2">{lang === 'pl' ? 'Mistrz turnieju' : 'Tournament Champion'}</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              {champion.customIcon ? <img src={champion.customIcon} alt="" className="w-16 h-16 rounded-lg object-cover border-2 border-gold2" /> :
                <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl border-2 border-gold2 bg-gold2/10">{champion.avatar || '⚔️'}</div>}
            </div>
            <h2 className="font-cinzel text-3xl font-black text-gold2">[{champion.tag}] {champion.name}</h2>
            <p className="text-dim text-sm mt-1">{(gfMatch.wins||[0,0])[0]} - {(gfMatch.wins||[0,0])[1]} vs {runnerUp ? `[${runnerUp.tag}] ${runnerUp.name}` : 'TBD'}</p>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-cinzel text-xl text-gold2">{lang === 'pl' ? 'Mistrz jeszcze nie wyłoniony' : 'Champion not yet decided'}</p>
          <p className="text-dim text-sm mt-1">{lang === 'pl' ? 'Turniej trwa!' : 'Tournament in progress!'}</p>
        </div>
      )}

      {/* Top Players */}
      {topPlayers.length > 0 && (
        <div>
          <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4 flex items-center gap-2">
            <span>🌟</span> {lang === 'pl' ? 'Najlepsi gracze' : 'Top Players'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 stagger-children">
            {topPlayers.map((p, i) => (
              <div key={i} className={`card p-4 text-center ${i === 0 ? 'border-gold2/50 sm:col-span-1' : ''}`}>
                <p className="text-2xl mb-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</p>
                <p className="font-bold text-sm">{p.summonerName}</p>
                <p className="text-dim text-xs">{p.team?.tag}{p.role ? ` • ${p.role}` : ''}</p>
                <p className="text-gold2 font-bold mt-1">{p.kda} KDA</p>
                <p className="text-dim text-[10px]">{p.kills}K / {p.deaths}D / {p.assists}A</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Popular Champions */}
      {topChamps.length > 0 && (
        <div>
          <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4 flex items-center gap-2">
            <span>⚔️</span> {lang === 'pl' ? 'Popularne championy' : 'Popular Champions'}
          </h3>
          <div className="flex flex-wrap gap-3 stagger-children">
            {topChamps.map(([champ, count], i) => (
              <div key={champ} className="card p-3 flex items-center gap-2">
                <ChampIcon name={champ} ddragon={ddragon} />
                <div>
                  <p className="font-semibold text-sm">{champ}</p>
                  <p className="text-dim text-xs">{count}x {lang === 'pl' ? 'wybrany' : 'picked'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MVPs */}
      {mvps.length > 0 && (
        <div>
          <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4 flex items-center gap-2">
            <span>👑</span> {lang === 'pl' ? 'MVP meczy' : 'Match MVPs'}
          </h3>
          <div className="space-y-2 stagger-children">
            {mvps.map(m => (
              <div key={m.matchId} className="card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="mvp-badge">MVP</span>
                  <span className="font-bold">{m.mvp}</span>
                </div>
                <span className="text-dim text-sm">
                  {m.t1?.tag || '?'} vs {m.t2?.tag || '?'} • {m.matchId.replace(/-/g, ' ').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closest Matches */}
      {closestMatches.length > 0 && (
        <div>
          <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4 flex items-center gap-2">
            <span>🔥</span> {lang === 'pl' ? 'Najbliższe mecze' : 'Closest Matches'}
          </h3>
          <div className="space-y-2 stagger-children">
            {closestMatches.map(m => {
              const mt1 = teams.find(t => t.id === m.t1);
              const mt2 = teams.find(t => t.id === m.t2);
              return (
                <div key={m.id} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-cinzel font-bold" style={{ color: getTeamColor(teams, m.t1) }}>{mt1?.tag || '?'}</span>
                    <span className="font-bold text-lg">{(m.wins||[0,0])[0]} - {(m.wins||[0,0])[1]}</span>
                    <span className="font-cinzel font-bold" style={{ color: getTeamColor(teams, m.t2) }}>{mt2?.tag || '?'}</span>
                  </div>
                  <span className="text-dim text-sm">{m.id.replace(/-/g, ' ').toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tournament stats summary */}
      <div>
        <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4 flex items-center gap-2">
          <span>📊</span> {lang === 'pl' ? 'Statystyki turnieju' : 'Tournament Stats'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gold2">{teams.length}</p>
            <p className="text-dim text-xs">{lang === 'pl' ? 'Drużyn' : 'Teams'}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-lolgreen">{finishedMatches.length}</p>
            <p className="text-dim text-xs">{lang === 'pl' ? 'Meczy rozegranych' : 'Matches played'}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-lolblue">{allMatches.length - finishedMatches.length}</p>
            <p className="text-dim text-xs">{lang === 'pl' ? 'Meczy pozostało' : 'Matches remaining'}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-lolred">{topChamps.length}</p>
            <p className="text-dim text-xs">{lang === 'pl' ? 'Unikalnych championów' : 'Unique champions'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Rules View ----
function RulesView({ rules, lang }) {
  if (!rules) {
    return (
      <div className="animate-fadeIn text-center py-12">
        <div className="text-4xl mb-4">📜</div>
        <p className="text-dim">{t(lang, 'rulesEmpty')}</p>
      </div>
    );
  }

  // Simple markdown-like rendering
  const renderRules = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let inList = false;
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(<ul key={`list-${elements.length}`} className="space-y-1 ml-4 mb-4">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h2 key={i} className="font-cinzel text-xl font-bold text-gold2 mt-6 mb-3 pb-2 border-b border-gold2/20">
            {trimmed.slice(2)}
          </h2>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={i} className="font-cinzel text-lg font-bold text-gold mt-5 mb-2">
            {trimmed.slice(3)}
          </h3>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={i} className="font-semibold text-foreground mt-4 mb-2">
            {trimmed.slice(4)}
          </h4>
        );
      } else if (trimmed.match(/^[-*] /)) {
        inList = true;
        listItems.push(
          <li key={i} className="flex items-start gap-2 text-sm text-dim">
            <span className="text-gold2 mt-0.5">◆</span>
            <span>{trimmed.slice(2)}</span>
          </li>
        );
      } else if (trimmed.match(/^\d+\. /)) {
        flushList();
        const num = trimmed.match(/^(\d+)\. /)?.[1] || '•';
        const content = trimmed.replace(/^\d+\. /, '');
        elements.push(
          <div key={i} className="flex items-start gap-3 mb-2 ml-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold2/20 text-gold2 text-xs font-bold flex items-center justify-center">{num}</span>
            <span className="text-sm text-dim pt-0.5">{content}</span>
          </div>
        );
      } else if (trimmed === '') {
        flushList();
        elements.push(<div key={i} className="h-2" />);
      } else if (trimmed.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={i} className="border-l-2 border-gold2/40 pl-4 py-1 mb-2 text-sm text-dim italic bg-gold2/5 rounded-r">
            {trimmed.slice(2)}
          </blockquote>
        );
      } else if (trimmed.startsWith('---')) {
        flushList();
        elements.push(<hr key={i} className="border-border my-4" />);
      } else {
        flushList();
        elements.push(<p key={i} className="text-sm text-dim mb-2 leading-relaxed">{trimmed}</p>);
      }
    });
    flushList();
    return elements;
  };

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gold2/20 flex items-center justify-center text-xl">📜</div>
          <h2 className="font-cinzel text-2xl font-bold text-gold2">{t(lang, 'rulesTitle')}</h2>
        </div>
        <div className="rules-content">
          {renderRules(rules)}
        </div>
      </div>
    </div>
  );
}

// ---- News / Posts View ----
function NewsView({ lang }) {
  const [posts, setPosts] = useState([]);
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [commentNick, setCommentNick] = useState('');
  const [commentMsg, setCommentMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [myReactions, setMyReactions] = useState({});
  const REACTIONS = ['🔥', '❤️', '👍', '😂', '💀', '👑', '⚔️', '🏆'];

  useEffect(() => {
    fetch('/api/posts').then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
    const saved = localStorage.getItem('newsNick');
    if (saved) setCommentNick(saved);
    try { setMyReactions(JSON.parse(localStorage.getItem('myReactions') || '{}')); } catch { }
  }, []);

  const loadComments = async (postId) => {
    const r = await fetch(`/api/posts?comments=${postId}`);
    if (r.ok) { const d = await r.json(); setComments(c => ({ ...c, [postId]: d.comments || [] })); }
  };

  const togglePost = (postId) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    loadComments(postId);
  };

  const [reacting, setReacting] = useState(false);
  const react = async (postId, emoji) => {
    const key = `${postId}`;
    if (myReactions[key] || reacting) return;
    setReacting(true);
    try {
      const r = await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reaction', postId, emoji }),
      });
      if (r.ok) {
        const d = await r.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, reactions: d.reactions } : p));
        const updated = { ...myReactions, [key]: emoji };
        setMyReactions(updated);
        localStorage.setItem('myReactions', JSON.stringify(updated));
      }
    } catch {} finally { setReacting(false); }
  };

  const sendComment = async (postId) => {
    if (!commentNick.trim() || !commentMsg.trim()) return;
    setSending(true); setCommentError('');
    localStorage.setItem('newsNick', commentNick);
    const r = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'comment', postId, nickname: commentNick, message: commentMsg }),
    });
    if (r.ok) { setCommentMsg(''); loadComments(postId); }
    else { try { const e = await r.json(); setCommentError(e.error || 'Błąd'); } catch { setCommentError('Błąd wysyłania'); } }
    setSending(false);
  };

  const getYoutubeId = (url) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return lang === 'pl' ? 'przed chwilą' : 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  if (posts.length === 0) {
    return (
      <div className="animate-fadeIn text-center py-12">
        <div className="text-4xl mb-4">📰</div>
        <p className="text-dim">{lang === 'pl' ? 'Brak aktualności' : 'No news yet'}</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto space-y-6">
      {posts.map(post => (
        <div key={post.id} className="card overflow-hidden">
          {/* Media */}
          {post.mediaUrl && post.mediaType === 'image' && (
            <img src={post.mediaUrl} alt="" className="w-full max-h-80 object-cover" onError={e => e.target.style.display='none'} />
          )}
          {post.mediaUrl && post.mediaType === 'video' && (
            <video src={post.mediaUrl} controls className="w-full max-h-80" />
          )}
          {post.mediaUrl && post.mediaType === 'youtube' && getYoutubeId(post.mediaUrl) && (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe src={`https://www.youtube.com/embed/${getYoutubeId(post.mediaUrl)}`}
                className="absolute inset-0 w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}

          {/* Content */}
          <div className="p-5">
            <h2 className="font-cinzel text-xl font-bold text-gold2 mb-2">{post.title}</h2>
            {post.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>
            )}
            <span className="text-dim text-xs">{timeAgo(post.createdAt)}</span>

            {/* Reactions */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border">
              {myReactions[`${post.id}`] && (
                <span className="text-dim text-xs mr-1">{lang === 'pl' ? 'Twoja reakcja:' : 'Your reaction:'}</span>
              )}
              {REACTIONS.map(emoji => {
                const count = post.reactions?.[emoji] || 0;
                const isMyReaction = myReactions[`${post.id}`] === emoji;
                const hasReacted = !!myReactions[`${post.id}`];
                return (
                  <button key={emoji} onClick={() => react(post.id, emoji)}
                    disabled={hasReacted}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
                      isMyReaction ? 'bg-gold2/25 border-2 border-gold2 scale-110' :
                      hasReacted ? 'opacity-50 cursor-not-allowed bg-bg3 border border-border' :
                      count > 0 ? 'bg-gold2/10 border border-gold2/20 hover:scale-110' :
                      'bg-bg3 border border-border hover:border-gold2/30 hover:scale-110'
                    }`}>
                    <span>{emoji}</span>
                    {count > 0 && <span className={`text-xs font-bold ${isMyReaction ? 'text-gold2' : 'text-dim'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Comments toggle */}
            <button onClick={() => togglePost(post.id)} className="text-sm text-dim hover:text-gold2 mt-3 transition-colors">
              {expandedPost === post.id
                ? (lang === 'pl' ? 'Ukryj komentarze' : 'Hide comments')
                : (lang === 'pl' ? `Komentarze${comments[post.id]?.length ? ` (${comments[post.id].length})` : ''}` : `Comments${comments[post.id]?.length ? ` (${comments[post.id].length})` : ''}`)}
            </button>

            {/* Comments section */}
            {expandedPost === post.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {(comments[post.id] || []).map(c => (
                  <div key={c.id} className="flex gap-2 text-sm">
                    <span className="font-bold text-gold2 flex-shrink-0">{c.nickname}</span>
                    <span className="text-dim">{c.message}</span>
                    <span className="text-dim/50 text-xs ml-auto flex-shrink-0">{timeAgo(c.timestamp)}</span>
                  </div>
                ))}
                {(comments[post.id] || []).length === 0 && (
                  <p className="text-dim text-xs">{lang === 'pl' ? 'Brak komentarzy' : 'No comments yet'}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <input value={commentNick} onChange={e => setCommentNick(e.target.value)} className="w-24 text-xs py-1 px-2" placeholder="Nick" maxLength={20} />
                  <input value={commentMsg} onChange={e => setCommentMsg(e.target.value)} className="flex-1 text-xs py-1 px-2" placeholder={lang === 'pl' ? 'Napisz komentarz...' : 'Write a comment...'} maxLength={300}
                    onKeyDown={e => e.key === 'Enter' && sendComment(post.id)} />
                  <button onClick={() => sendComment(post.id)} disabled={sending || !commentNick.trim() || !commentMsg.trim()} className="btn text-xs py-1 px-3">
                    {sending ? '...' : '→'}
                  </button>
                </div>
                {commentError && <p className="text-lolred text-xs mt-1">{commentError}</p>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Registration Form ----
function RegistrationForm({ teams, lang }) {
  const ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [captainDiscord, setCaptainDiscord] = useState('');
  const [players, setPlayers] = useState(
    Array.from({ length: 5 }, (_, i) => ({ summonerName: '', role: '', captain: i === 0 }))
  );
  const [sub, setSub] = useState({ summonerName: '', role: 'Sub' });
  const [hasSub, setHasSub] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [verifying, setVerifying] = useState({});

  const updatePlayer = (idx, field, value) => {
    const newPlayers = [...players];
    newPlayers[idx] = { ...newPlayers[idx], [field]: value };
    setPlayers(newPlayers);
  };

  // Verify single player nick via Riot API
  const verifyPlayer = async (idx) => {
    const name = players[idx].summonerName;
    if (!name) return;
    setVerifying(v => ({ ...v, [idx]: 'loading' }));
    try {
      const res = await fetch(`/api/riot/player?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      setVerifying(v => ({ ...v, [idx]: data.error ? 'error' : 'ok' }));
    } catch {
      setVerifying(v => ({ ...v, [idx]: 'error' }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const allPlayers = [...players];
      if (hasSub && sub.summonerName) allPlayers.push(sub);

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, teamTag, captainDiscord, players: allPlayers }),
      });
      const data = await res.json();
      if (data.error) setMessage({ type: 'error', text: data.error });
      else setMessage({ type: 'success', text: lang === 'pl' ? 'Rejestracja wysłana! Czekaj na zatwierdzenie admina.' : 'Registration submitted! Waiting for admin approval.' });
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
    setLoading(false);
  };

  const isFull = teams.length >= 8;

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">📝</div>
        <h2 className="font-cinzel text-2xl font-bold text-gold2">{lang === 'pl' ? 'Rejestracja drużyny' : 'Team Registration'}</h2>
        <p className="text-dim text-sm mt-1">{lang === 'pl' ? 'Wypełnij formularz, aby zapisać drużynę' : 'Fill in the form to register your team'}</p>
      </div>

      {isFull ? (
        <div className="card p-8 text-center">
          <p className="text-lolred font-bold text-lg">{lang === 'pl' ? 'Turniej jest pełny (8/8 drużyn)' : 'Tournament is full (8/8 teams)'}</p>
          <p className="text-dim mt-2">{lang === 'pl' ? 'Brak wolnych miejsc' : 'No spots available'}</p>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          {/* Team info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-dim text-sm">{lang === 'pl' ? 'Nazwa drużyny' : 'Team Name'} *</label>
              <input value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full" placeholder="np. Jaskinia Warriors" maxLength={30} />
            </div>
            <div>
              <label className="text-dim text-sm">{lang === 'pl' ? 'Skrót (TAG)' : 'Tag'} *</label>
              <input value={teamTag} onChange={e => setTeamTag(e.target.value.toUpperCase())} className="w-full" placeholder="np. JW" maxLength={5} />
            </div>
          </div>
          <div>
            <label className="text-dim text-sm">{lang === 'pl' ? 'Discord kapitana' : 'Captain Discord'} *</label>
            <input value={captainDiscord} onChange={e => setCaptainDiscord(e.target.value)} className="w-full" placeholder="np. kapitan#1234" />
          </div>

          {/* Players */}
          <div>
            <h3 className="text-sm font-bold text-gold2 mb-2">{lang === 'pl' ? 'Skład (5 graczy)' : 'Roster (5 players)'}</h3>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={p.role} onChange={e => updatePlayer(i, 'role', e.target.value)}
                    className="text-sm w-24 py-1.5 px-1 bg-bg2 border border-border rounded text-dim">
                    <option value="">{lang === 'pl' ? 'Rola' : 'Role'}</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="flex-1 relative">
                    <input value={p.summonerName} onChange={e => updatePlayer(i, 'summonerName', e.target.value)}
                      onBlur={() => verifyPlayer(i)}
                      className="w-full" placeholder={`Nick#TAG ${i === 0 ? '(kapitan)' : ''}`} />
                    {verifying[i] === 'loading' && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-dim animate-pulse">...</span>}
                    {verifying[i] === 'ok' && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-lolgreen text-sm">✓</span>}
                    {verifying[i] === 'error' && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-lolred text-sm">✗</span>}
                  </div>
                  {i === 0 && <span title="Kapitan" className="text-sm">👑</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Substitute */}
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={hasSub} onChange={e => setHasSub(e.target.checked)} />
              <span className="text-dim">{lang === 'pl' ? 'Gracz rezerwowy (opcjonalnie)' : 'Substitute player (optional)'}</span>
            </label>
            {hasSub && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-dim text-sm w-16">Sub</span>
                <input value={sub.summonerName} onChange={e => setSub({ ...sub, summonerName: e.target.value })}
                  className="flex-1" placeholder="Nick#TAG" />
              </div>
            )}
          </div>

          {/* Submit */}
          {message && (
            <p className={`text-sm ${message.type === 'error' ? 'text-lolred' : 'text-lolgreen'}`}>{message.text}</p>
          )}
          <button onClick={handleSubmit} disabled={loading || !teamName || !teamTag || !captainDiscord || players.some(p => !p.summonerName)}
            className="btn w-full">
            {loading ? '...' : (lang === 'pl' ? 'Wyślij zgłoszenie' : 'Submit Registration')}
          </button>
          <p className="text-dim text-xs text-center">{lang === 'pl' ? 'Rejestracja wymaga zatwierdzenia przez organizatora' : 'Registration requires admin approval'}</p>
        </div>
      )}
    </div>
  );
}

// ---- Main Page ----
export default function Home() {
  const [tab, setTab] = useState('bracket');
  const [data, setData] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState({ players: [], teams: [] });
  const [predictions, setPredictions] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [toast, setToast] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState('pl');
  const [theme, setTheme] = useState('dark');
  const [ddragon, setDdragon] = useState(DDRAGON_FALLBACK);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const prevDataRef = useRef(null);
  const retryDelayRef = useRef(5000);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') || 'pl';
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setLang(savedLang); setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    // DDragon version with localStorage cache (24h)
    const cachedVer = localStorage.getItem('ddragonVer');
    const cachedTime = parseInt(localStorage.getItem('ddragonTime') || '0');
    if (cachedVer && Date.now() - cachedTime < 86400000) {
      setDdragon(`${DDRAGON_BASE}/cdn/${cachedVer}/img/champion/`);
    } else {
      fetch(`${DDRAGON_BASE}/api/versions.json`).then(r => r.json()).then(v => {
        if (v?.[0]) {
          setDdragon(`${DDRAGON_BASE}/cdn/${v[0]}/img/champion/`);
          localStorage.setItem('ddragonVer', v[0]);
          localStorage.setItem('ddragonTime', String(Date.now()));
        }
      }).catch(() => {});
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next); localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };
  const toggleLang = () => { const next = lang === 'pl' ? 'en' : 'pl'; setLang(next); localStorage.setItem('lang', next); };

  function getAllMatchesFromBracket(bracket) {
    if (!bracket) return [];
    const m = [];
    for (const s of ['winners', 'losers']) { if (bracket[s]) for (const r of bracket[s]) m.push(...r.matches); }
    if (bracket.grandFinal) m.push(...bracket.grandFinal.matches);
    return m;
  }

  // SSE with exponential backoff
  useEffect(() => {
    let es; let retryTimeout;
    const connect = () => {
      es = new EventSource('/api/sse');
      es.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          retryDelayRef.current = 5000; setError(false);
          if (prevDataRef.current) {
            const oldM = getAllMatchesFromBracket(prevDataRef.current.bracket);
            const newM = getAllMatchesFromBracket(newData.bracket);
            for (const nm of newM) {
              const om = oldM.find(m => m.id === nm.id);
              // Notify on match win
              if (om && !om.winner && nm.winner) {
                playNotificationSound();
                const winnerTeam = newData.teams.find(t => t.id === nm.winner);
                setToast({ message: `${winnerTeam?.name || ''} ${t(lang, 'winsMatch')}`, type: 'success', key: Date.now() });
                if (nm.id.startsWith('gf')) setShowConfetti(true);
                break;
              }
              // Notify when match goes LIVE
              if (om && om.status !== 'live' && nm.status === 'live') {
                playNotificationSound();
                const t1 = newData.teams.find(t => t.id === nm.t1);
                const t2 = newData.teams.find(t => t.id === nm.t2);
                setToast({ message: `🔴 LIVE: ${t1?.tag || '?'} vs ${t2?.tag || '?'}`, type: 'info', key: Date.now() });
                break;
              }
            }
          }
          prevDataRef.current = newData; setData(newData);
        } catch {}
      };
      es.onerror = () => {
        es.close(); setError(true);
        retryTimeout = setTimeout(connect, retryDelayRef.current);
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, 60000);
      };
    };
    connect();
    // Pause SSE when tab is hidden, reconnect when visible
    const handleVisibility = () => {
      if (document.hidden) { es?.close(); }
      else { es?.close(); connect(); }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { es?.close(); clearTimeout(retryTimeout); document.removeEventListener('visibilitychange', handleVisibility); };
  }, [lang]);

  const fetchExtra = useCallback(async () => {
    try {
      const [schedRes, statsRes, predRes] = await Promise.all([fetch('/api/schedule'), fetch('/api/stats'), fetch('/api/predictions')]);
      if (schedRes.ok) setSchedule(await schedRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (predRes.ok) setPredictions(await predRes.json());
    } catch {}
  }, []);

  useEffect(() => { fetchExtra(); const i = setInterval(fetchExtra, 30000); return () => clearInterval(i); }, [fetchExtra]);
  useEffect(() => { if (tab === 'schedule' || tab === 'stats' || tab === 'predictions') fetchExtra(); }, [tab, fetchExtra]);

  const vote = async (matchId, teamId) => {
    try {
      const r = await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, teamId }) });
      if (r.ok) { setToast({ message: t(lang, 'voted') + '!', type: 'success', key: Date.now() }); fetchExtra(); }
      else { const err = await r.json().catch(() => ({})); setToast({ message: err.error || 'Error', type: 'error', key: Date.now() }); }
    } catch { setToast({ message: 'Connection error', type: 'error', key: Date.now() }); }
  };

  useEffect(() => { if (showConfetti) { const tm = setTimeout(() => setShowConfetti(false), 4000); return () => clearTimeout(tm); } }, [showConfetti]);

  const handleMatchClick = (match, round) => {
    setSelectedMatch({ match, round });
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <AmbientBackground />
        <div className="text-gold2 font-cinzel text-2xl animate-pulse relative z-10">{t(lang, 'loadingTournament')}</div>
        {error && (
          <div className="relative z-10 text-center">
            <p className="text-lolred text-sm mb-2">{lang === 'pl' ? 'Nie udalo sie polaczyc z serwerem' : 'Could not connect to server'}</p>
            <button onClick={() => { retryDelayRef.current = 5000; setError(false); }} className="btn-secondary text-sm">{lang === 'pl' ? 'Sprobuj ponownie' : 'Retry'}</button>
          </div>
        )}
      </div>
    );
  }

  const tabs = [
    { id: 'bracket', label: t(lang, 'bracket') },
    { id: 'teams', label: t(lang, 'teams') },
    { id: 'schedule', label: t(lang, 'schedule') },
    { id: 'stats', label: t(lang, 'stats') },
    { id: 'predictions', label: t(lang, 'predictions') },
    { id: 'halloffame', label: t(lang, 'hallOfFame') },
    { id: 'rules', label: t(lang, 'rules') },
    { id: 'news', label: lang === 'pl' ? 'Aktualności' : 'News' },
    { id: 'register', label: lang === 'pl' ? 'Rejestracja' : 'Register' },
  ];

  return (
    <div className="min-h-screen relative">
      <AmbientBackground />
      {showConfetti && <Confetti />}

      <header className="border-b border-border bg-bg2 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div className="min-w-0">
            <h1 className="font-cinzel text-2xl sm:text-3xl font-black text-gold2 tracking-wide truncate">{data.tournamentName}</h1>
            <p className="text-dim text-sm mt-1">{t(lang, 'tournamentSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="btn-secondary text-xs px-2 py-1">{lang === 'pl' ? 'EN' : 'PL'}</button>
            <button onClick={toggleTheme} className="theme-toggle" title={t(lang, theme === 'dark' ? 'lightMode' : 'darkMode')}></button>
            <a href="/admin" className="btn-secondary text-sm">{t(lang, 'adminPanel')}</a>
          </div>
        </div>
      </header>

      <CountdownBanner bracket={data.bracket} teams={data.teams} lang={lang} />

      <nav className="border-b border-border bg-bg2/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex gap-4 sm:gap-6 overflow-x-auto">
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`py-3 px-1 text-sm font-semibold transition-colors whitespace-nowrap ${tab === tb.id ? 'tab-active' : 'tab-inactive'}`}
            >{tb.label}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <div key={tab} className="tab-content">
          {tab === 'bracket' && <BracketView bracket={data.bracket} teams={data.teams} onTeamClick={setSelectedTeam} onMatchClick={handleMatchClick} predictions={predictions} lang={lang} />}
          {tab === 'teams' && <TeamsGrid teams={data.teams} onTeamClick={setSelectedTeam} onPlayerClick={name => setPlayerProfile(name)} lang={lang} />}
          {tab === 'schedule' && <ScheduleView schedule={schedule} teams={data.teams} lang={lang} />}
          {tab === 'stats' && <StatsView stats={stats} lang={lang} onPlayerClick={name => setPlayerProfile(name)} ddragon={ddragon} />}
          {tab === 'predictions' && <PredictionsPanel bracket={data.bracket} teams={data.teams} predictions={predictions} onVote={vote} lang={lang} />}
          {tab === 'halloffame' && <HallOfFameView bracket={data.bracket} teams={data.teams} stats={stats} lang={lang} ddragon={ddragon} />}
          {tab === 'rules' && <RulesView rules={data.rules} lang={lang} />}
          {tab === 'news' && <NewsView lang={lang} />}
          {tab === 'register' && <RegistrationForm teams={data.teams} lang={lang} />}
        </div>
      </main>

      {selectedTeam && <TeamModal team={selectedTeam} teams={data.teams} bracket={data.bracket} lang={lang} onClose={() => setSelectedTeam(null)} onPlayerClick={name => setPlayerProfile(name)} />}
      {selectedMatch && <MatchDetailModal match={selectedMatch.match} round={selectedMatch.round} teams={data.teams} lang={lang} onClose={() => setSelectedMatch(null)} ddragon={ddragon} onPlayerClick={name => setPlayerProfile(name)} />}
      {playerProfile && <PlayerProfileModal summonerName={playerProfile} lang={lang} ddragon={ddragon} onClose={() => setPlayerProfile(null)} />}
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
