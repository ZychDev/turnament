'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { t } from '@/lib/i18n';

const TEAM_COLORS = ['#C89B3C', '#1A9FD4', '#E84057', '#7B5CB8', '#0ABDA0', '#E86B2A', '#3CB878', '#E8B84B'];
const ROLE_ICONS = { Top: '⚔️', Jungle: '🌿', Mid: '⚡', ADC: '🏹', Support: '🛡️' };
const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/';

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
function ChampIcon({ name }) {
  if (!name) return null;
  const formatted = name.charAt(0).toUpperCase() + name.slice(1).replace(/[^a-zA-Z]/g, '');
  return <img src={`${DDRAGON}${formatted}.png`} alt={name} className="w-5 h-5 rounded inline-block" onError={(e) => { e.target.style.display = 'none'; }} />;
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

// ---- Match Card ----
function MatchCard({ match, teams, bestOf, onClick, predictions, lang }) {
  const t1Tag = getTeamTag(teams, match.t1);
  const t2Tag = getTeamTag(teams, match.t2);
  const t1Color = getTeamColor(teams, match.t1);
  const t2Color = getTeamColor(teams, match.t2);
  const isFinished = !!match.winner;
  const isLive = match.status === 'live';

  const pred = predictions?.[match.id];
  const totalVotes = pred ? (pred[match.t1] || 0) + (pred[match.t2] || 0) : 0;
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
            <span className="text-sm font-bold" style={{ color: isWinner ? '#3CB878' : '#5A6880' }}>{match.wins[winIdx]}</span>
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
  return (
    <div className="bracket-connector">
      {Array.from({ length: Math.ceil(count / 2) }, (_, i) => {
        const active = matches?.[i * 2]?.winner || matches?.[i * 2 + 1]?.winner;
        return (
          <div key={i} className="flex-1 flex flex-col justify-center relative">
            <div className={`absolute right-0 w-1/2 connector-bracket ${active ? 'active' : ''}`} style={{ top: '25%', bottom: '25%' }}></div>
            <div className={`absolute left-0 w-1/2 top-1/2 connector-line-h ${active ? 'active' : ''}`}></div>
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

function MatchDetailModal({ match, round, teams, lang, onClose }) {
  if (!match) return null;
  const t1 = getTeam(teams, match.t1);
  const t2 = getTeam(teams, match.t2);
  const isLive = match.status === 'live';

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
            <p className="text-3xl font-bold font-cinzel">{match.wins[0]} <span className="text-dim">-</span> {match.wins[1]}</p>
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
        {(match.games || []).map((game, gi) => (
          <div key={gi} className="mb-3">
            <h4 className="text-sm font-bold text-gold2 mb-2">{t(lang, 'game')} {gi + 1}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-dim border-b border-border">
                  <th className="text-left py-1 px-1">{t(lang, 'player')}</th>
                  <th className="text-left py-1 px-1">Champ</th>
                  <th className="text-right py-1 px-1">K</th>
                  <th className="text-right py-1 px-1">D</th>
                  <th className="text-right py-1 px-1">A</th>
                  <th className="text-right py-1 px-1">CS</th>
                </tr></thead>
                <tbody>
                  {(game.players || []).map((p, pi) => (
                    <tr key={pi} className="border-b border-border/30">
                      <td className="py-1 px-1 font-semibold" style={{ color: getTeamColor(teams, p.teamId) }}>{p.playerName || p.role}</td>
                      <td className="py-1 px-1 flex items-center gap-1"><ChampIcon name={p.champion} />{p.champion}</td>
                      <td className="py-1 px-1 text-right text-lolgreen">{p.kills}</td>
                      <td className="py-1 px-1 text-right text-lolred">{p.deaths}</td>
                      <td className="py-1 px-1 text-right text-lolblue">{p.assists}</td>
                      <td className="py-1 px-1 text-right">{p.cs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {(!match.games || match.games.length === 0) && (
          <p className="text-dim text-center text-sm py-4">{t(lang, 'noData')}</p>
        )}

        {match.comment && (
          <div className="mt-3 p-3 rounded bg-bg3 text-sm text-dim">
            {match.comment}
          </div>
        )}

        {/* Mini Chat */}
        {match.t1 && match.t2 && <MatchChat matchId={match.id} lang={lang} />}

        <button onClick={onClose} className="btn-secondary w-full mt-4">{t(lang, 'close')}</button>
      </div>
    </div>
  );
}

// ---- Team Modal with match history ----
function TeamModal({ team, teams, bracket, lang, onClose }) {
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
          wins: match.t1 === team.id ? match.wins : [match.wins[1], match.wins[0]],
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
              <span className="text-dim text-sm w-16">{p.role}</span>
              <span className="font-semibold">{p.summonerName}</span>
              {p.captain && <span title="Kapitan">👑</span>}
              {p.opgg && <a href={p.opgg.startsWith('http') ? p.opgg : `https://www.op.gg/summoners/eune/${encodeURIComponent(p.opgg)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-lolblue hover:underline ml-auto">op.gg</a>}
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
                      <span className="font-bold">{mh.wins[0]} - {mh.wins[1]}</span>
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
      if (match.t1 && match.t2 && !match.winner) allMatches.push({ ...match, roundName: round.name });
    }
  }
  if (allMatches.length === 0) return <p className="text-dim text-center py-8">{t(lang, 'noMatches')}</p>;

  return (
    <div className="space-y-3 stagger-children">
      <p className="text-dim text-sm">{t(lang, 'votePrediction')}</p>
      {allMatches.map(match => {
        const pred = predictions?.[match.id] || {};
        const total = (pred[match.t1] || 0) + (pred[match.t2] || 0);
        const t1Pct = total > 0 ? Math.round((pred[match.t1] || 0) / total * 100) : 50;
        const t2Pct = 100 - t1Pct;
        const voted = typeof document !== 'undefined' && document.cookie.includes(`voted_${match.id}`);

        return (
          <div key={match.id} className="card p-4">
            <div className="text-xs text-dim mb-2">{match.roundName} — {match.id.replace(/-/g, ' ').toUpperCase()}</div>
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => !voted && onVote(match.id, match.t1)} disabled={voted}
                className={`flex-1 p-2 rounded font-cinzel font-bold text-sm border transition-all ${voted ? 'opacity-60 cursor-default' : 'hover:border-gold2 cursor-pointer'}`}
                style={{ borderColor: getTeamColor(teams, match.t1), color: getTeamColor(teams, match.t1) }}>
                [{getTeamTag(teams, match.t1)}] {getTeamName(teams, match.t1)}
              </button>
              <span className="text-dim text-sm">vs</span>
              <button onClick={() => !voted && onVote(match.id, match.t2)} disabled={voted}
                className={`flex-1 p-2 rounded font-cinzel font-bold text-sm border transition-all ${voted ? 'opacity-60 cursor-default' : 'hover:border-gold2 cursor-pointer'}`}
                style={{ borderColor: getTeamColor(teams, match.t2), color: getTeamColor(teams, match.t2) }}>
                [{getTeamTag(teams, match.t2)}] {getTeamName(teams, match.t2)}
              </button>
            </div>
            {total > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: getTeamColor(teams, match.t1) }}>{t1Pct}%</span>
                  <span className="text-dim">{total} {t(lang, 'votes')}</span>
                  <span style={{ color: getTeamColor(teams, match.t2) }}>{t2Pct}%</span>
                </div>
                <div className="prediction-bar flex">
                  <div className="prediction-fill" style={{ width: `${t1Pct}%`, background: getTeamColor(teams, match.t1) }}></div>
                  <div className="prediction-fill" style={{ width: `${t2Pct}%`, background: getTeamColor(teams, match.t2) }}></div>
                </div>
              </div>
            )}
            {voted && <p className="text-dim text-xs mt-1 text-center">{t(lang, 'voted')}</p>}
          </div>
        );
      })}
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
function TeamsGrid({ teams, onTeamClick, lang }) {
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
                  <span className="text-dim w-14">{p.role}</span>
                  <span>{p.summonerName}</span>
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
  return (
    <div className="space-y-2 stagger-children">
      {schedule.map(match => {
        const isLive = match.status === 'live';
        const status = match.winner ? t(lang, 'finished') : isLive ? 'LIVE' : (match.t1 && match.t2 ? t(lang, 'waiting') : 'TBD');
        const statusColor = match.winner ? '#3CB878' : isLive ? '#E84057' : (match.t1 && match.t2 ? '#1A9FD4' : '#5A6880');
        const isFuture = match.scheduledTime && !match.winner && !isLive && new Date(match.scheduledTime).getTime() > Date.now();
        const isUpcomingSoon = isFuture && (new Date(match.scheduledTime).getTime() - Date.now()) < 60 * 60 * 1000;
        return (
          <div key={match.id} className={`card p-3 ${isLive ? 'border-lolred/50 schedule-live-glow' : ''} ${isUpcomingSoon ? 'border-gold2/30' : ''}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span className="text-xs text-dim uppercase w-20 sm:w-24">{match.roundName}</span>
                <span className="font-cinzel font-bold" style={{ color: getTeamColor(teams, match.t1) }}>{getTeamTag(teams, match.t1)}</span>
                <span className="text-dim text-sm">vs</span>
                <span className="font-cinzel font-bold" style={{ color: getTeamColor(teams, match.t2) }}>{getTeamTag(teams, match.t2)}</span>
                {match.winner && <span className="text-sm text-dim">{match.wins[0]} - {match.wins[1]}</span>}
                {match.mvp && <span className="mvp-badge">MVP: {match.mvp}</span>}
              </div>
              <div className="flex items-center gap-3">
                {match.streamUrl && (
                  <a href={match.streamUrl} target="_blank" rel="noopener noreferrer"
                    className={`text-xs font-semibold flex items-center gap-1 transition-colors ${isLive ? 'text-lolred hover:text-red-400' : 'text-lolblue hover:text-blue-400'}`}>
                    {isLive && <span className="live-dot"></span>}
                    {isLive ? (lang === 'pl' ? 'Transmisja LIVE' : 'LIVE Stream') : (lang === 'pl' ? 'Transmisja' : 'Stream')}
                  </a>
                )}
                {isFuture && <Countdown targetTime={match.scheduledTime} lang={lang} />}
                {match.scheduledTime && !isFuture && (
                  <span className="text-sm text-dim">{new Date(match.scheduledTime).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1" style={{ color: statusColor, border: `1px solid ${statusColor}` }}>
                  {isLive && <span className="live-dot"></span>}{status}
                </span>
              </div>
            </div>
            {isLive && (
              <div className="w-full mt-2 h-1.5 rounded-full bg-bg3 overflow-hidden">
                <div className="h-full rounded-full bg-lolred schedule-bar-pulse" style={{ width: '100%' }} />
              </div>
            )}
            {isFuture && <UpcomingBar scheduledTime={match.scheduledTime} />}
          </div>
        );
      })}
      {schedule.length === 0 && <p className="text-dim text-center py-8">{t(lang, 'noMatches')}</p>}
    </div>
  );
}

// ---- Stats ----
function StatsView({ stats, lang }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4">{t(lang, 'playerRanking')}</h3>
        {stats.players?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-dim border-b border-border">
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">{t(lang, 'player')}</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">{t(lang, 'team')}</th>
                <th className="text-left py-2 px-2">{t(lang, 'role')}</th>
                <th className="text-right py-2 px-2">K</th>
                <th className="text-right py-2 px-2">D</th>
                <th className="text-right py-2 px-2">A</th>
                <th className="text-right py-2 px-2 hidden sm:table-cell">CS</th>
                <th className="text-right py-2 px-2">KDA</th>
                <th className="text-right py-2 px-2 hidden sm:table-cell">{t(lang, 'games')}</th>
                <th className="text-left py-2 px-2 hidden md:table-cell">Champs</th>
              </tr></thead>
              <tbody>
                {stats.players.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-bg3 transition-colors">
                    <td className="py-2 px-2 text-dim">{i + 1}</td>
                    <td className="py-2 px-2 font-semibold">{p.summonerName}</td>
                    <td className="py-2 px-2 text-dim hidden sm:table-cell">{p.team?.tag}</td>
                    <td className="py-2 px-2">{ROLE_ICONS[p.role] || ''} {p.role}</td>
                    <td className="py-2 px-2 text-right text-lolgreen">{p.kills}</td>
                    <td className="py-2 px-2 text-right text-lolred">{p.deaths}</td>
                    <td className="py-2 px-2 text-right text-lolblue">{p.assists}</td>
                    <td className="py-2 px-2 text-right hidden sm:table-cell">{p.cs}</td>
                    <td className="py-2 px-2 text-right font-bold text-gold2">{p.kda}</td>
                    <td className="py-2 px-2 text-right text-dim hidden sm:table-cell">{p.games}</td>
                    <td className="py-2 px-2 hidden md:table-cell">
                      <div className="flex gap-1">{(p.champions || []).slice(0, 3).map((c, ci) => <ChampIcon key={ci} name={c} />)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-dim text-center py-4">{t(lang, 'noData')}</p>}
      </div>
      <div>
        <h3 className="font-cinzel text-xl font-bold text-gold2 mb-4">{t(lang, 'teamRanking')}</h3>
        {stats.teams?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-dim border-b border-border">
                <th className="text-left py-2 px-3">#</th>
                <th className="text-left py-2 px-3">{t(lang, 'team')}</th>
                <th className="text-right py-2 px-3">W</th>
                <th className="text-right py-2 px-3">L</th>
                <th className="text-right py-2 px-3">WR%</th>
              </tr></thead>
              <tbody>
                {stats.teams.map((tm, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-bg3 transition-colors">
                    <td className="py-2 px-3 text-dim">{i + 1}</td>
                    <td className="py-2 px-3 font-cinzel font-bold">{tm.team?.tag} {tm.team?.name}</td>
                    <td className="py-2 px-3 text-right text-lolgreen">{tm.wins}</td>
                    <td className="py-2 px-3 text-right text-lolred">{tm.losses}</td>
                    <td className="py-2 px-3 text-right font-bold text-gold2">{tm.wins + tm.losses > 0 ? ((tm.wins / (tm.wins + tm.losses)) * 100).toFixed(0) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-dim text-center py-4">{t(lang, 'noData')}</p>}
      </div>
    </div>
  );
}

// ---- Hall of Fame / Highlights ----
function HallOfFameView({ bracket, teams, stats, lang }) {
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
    .filter(m => m.wins[0] > 0 && m.wins[1] > 0)
    .sort((a, b) => Math.abs(a.wins[0] - a.wins[1]) - Math.abs(b.wins[0] - b.wins[1]))
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
            <p className="text-dim text-sm mt-1">{gfMatch.wins[0]} - {gfMatch.wins[1]} vs {runnerUp ? `[${runnerUp.tag}] ${runnerUp.name}` : 'TBD'}</p>
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
                <p className="text-dim text-xs">{p.team?.tag} • {p.role}</p>
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
                <ChampIcon name={champ} />
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
                    <span className="font-bold text-lg">{m.wins[0]} - {m.wins[1]}</span>
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
        const num = trimmed.match(/^(\d+)\. /)[1];
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
  const prevDataRef = useRef(null);
  const retryDelayRef = useRef(5000);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') || 'pl';
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setLang(savedLang); setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
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
              if (om && !om.winner && nm.winner) {
                playNotificationSound();
                const winnerTeam = newData.teams.find(t => t.id === nm.winner);
                setToast({ message: `${winnerTeam?.name || ''} ${t(lang, 'winsMatch')}`, type: 'success', key: Date.now() });
                if (nm.id.startsWith('gf')) setShowConfetti(true);
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
    return () => { es?.close(); clearTimeout(retryTimeout); };
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
          {tab === 'teams' && <TeamsGrid teams={data.teams} onTeamClick={setSelectedTeam} lang={lang} />}
          {tab === 'schedule' && <ScheduleView schedule={schedule} teams={data.teams} lang={lang} />}
          {tab === 'stats' && <StatsView stats={stats} lang={lang} />}
          {tab === 'predictions' && <PredictionsPanel bracket={data.bracket} teams={data.teams} predictions={predictions} onVote={vote} lang={lang} />}
          {tab === 'halloffame' && <HallOfFameView bracket={data.bracket} teams={data.teams} stats={stats} lang={lang} />}
          {tab === 'rules' && <RulesView rules={data.rules} lang={lang} />}
        </div>
      </main>

      {selectedTeam && <TeamModal team={selectedTeam} teams={data.teams} bracket={data.bracket} lang={lang} onClose={() => setSelectedTeam(null)} />}
      {selectedMatch && <MatchDetailModal match={selectedMatch.match} round={selectedMatch.round} teams={data.teams} lang={lang} onClose={() => setSelectedMatch(null)} />}
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
