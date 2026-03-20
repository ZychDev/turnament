'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { t } from '@/lib/i18n';

const TEAM_COLORS = ['#C89B3C', '#1A9FD4', '#E84057', '#7B5CB8', '#0ABDA0', '#E86B2A', '#3CB878', '#E8B84B'];
const ALL_COLORS = ['#C89B3C', '#1A9FD4', '#E84057', '#7B5CB8', '#0ABDA0', '#E86B2A', '#3CB878', '#E8B84B', '#E8D44D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF7F50'];
const ROLE_ICONS = { Top: '⚔️', Jungle: '🌿', Mid: '⚡', ADC: '🏹', Support: '🛡️' };
const ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const AVATARS = ['⚔️', '🐉', '🔥', '💀', '🌟', '🦁', '🐺', '🦅', '🛡️', '⚡', '🏹', '🗡️', '🎯', '👑', '🏰', '🌙'];
const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';

function getTeamColor(teams, teamId) {
  const team = teams.find(t => t.id === teamId);
  if (team?.color) return team.color;
  const idx = teams.findIndex(t => t.id === teamId);
  return idx >= 0 ? TEAM_COLORS[idx % TEAM_COLORS.length] : '#5A6880';
}
function getTeamTag(teams, id) { return teams.find(t => t.id === id)?.tag || 'TBD'; }
function getTeamName(teams, id) { return teams.find(t => t.id === id)?.name || 'TBD'; }

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}
function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'success') { osc.frequency.setValueAtTime(523.25, ctx.currentTime); osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); }
    else if (type === 'undo') { osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.15); }
    else { osc.frequency.setValueAtTime(587.33, ctx.currentTime); }
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

function Toast({ message, type, onDone }) {
  useEffect(() => { const tm = setTimeout(onDone, 3000); return () => clearTimeout(tm); }, [onDone]);
  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ---- Login ----
function LoginScreen({ onLogin, lang }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault(); setError('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) onLogin(pw); else setError(t(lang, 'wrongPassword'));
  };
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="card p-8 w-full max-w-sm space-y-4 animate-slideUp">
        <h1 className="font-cinzel text-2xl text-gold2 text-center font-bold">{t(lang, 'adminLogin')}</h1>
        <input type="password" placeholder={t(lang, 'password')} value={pw} onChange={e => setPw(e.target.value)} className="w-full" autoFocus />
        {error && <p className="text-lolred text-sm text-center">{error}</p>}
        <button type="submit" className="btn w-full">{t(lang, 'login')}</button>
      </form>
    </div>
  );
}

// ---- Team Edit Modal with color picker, custom icon, captain ----
function TeamEditModal({ team, onSave, onClose, lang }) {
  const [name, setName] = useState(team?.name || '');
  const [tag, setTag] = useState(team?.tag || '');
  const [avatar, setAvatar] = useState(team?.avatar || '⚔️');
  const [customIcon, setCustomIcon] = useState(team?.customIcon || '');
  const [useCustomIcon, setUseCustomIcon] = useState(!!team?.customIcon);
  const [color, setColor] = useState(team?.color || '');
  const [players, setPlayers] = useState(team?.players || ROLES.map(r => ({ role: r, summonerName: '', captain: false, opgg: '' })));
  const updatePlayer = (idx, field, val) => { const c = [...players]; c[idx] = { ...c[idx], [field]: val }; setPlayers(c); };
  const setCaptain = (idx) => { setPlayers(players.map((p, i) => ({ ...p, captain: i === idx }))); };

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { alert(lang === 'pl' ? 'Maks. 500KB' : 'Max 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setCustomIcon(reader.result); setUseCustomIcon(true); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slideUp max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-cinzel text-xl font-bold text-gold2 mb-4">{team ? t(lang, 'editTeam') : t(lang, 'addTeam')}</h2>
        <div className="mb-4">
          <label className="text-dim text-sm mb-1 block">{t(lang, 'teamIcon')}</label>
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={!useCustomIcon} onChange={() => setUseCustomIcon(false)} /> {lang === 'pl' ? 'Domyslna' : 'Default'}
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={useCustomIcon} onChange={() => setUseCustomIcon(true)} /> {lang === 'pl' ? 'Wlasna' : 'Custom'}
            </label>
          </div>
          {!useCustomIcon ? (
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2 transition-all ${avatar === a ? 'border-gold2 bg-gold2/20 scale-110' : 'border-border hover:border-dim'}`}>{a}</button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <input type="file" accept="image/*" onChange={handleIconUpload} className="text-sm" />
              <input value={customIcon} onChange={e => setCustomIcon(e.target.value)} className="w-full text-xs" placeholder={lang === 'pl' ? 'Lub wklej URL obrazka' : 'Or paste image URL'} />
              {customIcon && <div className="flex items-center gap-2"><img src={customIcon} alt="icon" className="w-12 h-12 rounded-lg object-cover border border-border" /><button onClick={() => { setCustomIcon(''); setUseCustomIcon(false); }} className="text-lolred text-xs">✕</button></div>}
            </div>
          )}
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-dim text-sm">{t(lang, 'teamName')}</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full" placeholder="np. Team Solari" />
          </div>
          <div>
            <label className="text-dim text-sm">{t(lang, 'teamTag')}</label>
            <input value={tag} onChange={e => setTag(e.target.value)} className="w-full" placeholder="np. SOL" maxLength={5} />
          </div>
          <div>
            <label className="text-dim text-sm mb-1 block">{t(lang, 'teamColor')}</label>
            <div className="flex flex-wrap gap-2">
              {ALL_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`color-swatch ${color === c ? 'selected' : ''}`} style={{ background: c }}></button>
              ))}
            </div>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-dim mb-2">{t(lang, 'players')}</h3>
        <div className="space-y-2 mb-4">
          {players.map((p, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm w-20 text-dim">{ROLE_ICONS[p.role]} {p.role}</span>
                <input value={p.summonerName} onChange={e => updatePlayer(i, 'summonerName', e.target.value)} className="flex-1" placeholder={t(lang, 'summonerName')} />
                <button onClick={() => setCaptain(i)} title={lang === 'pl' ? 'Kapitan' : 'Captain'}
                  className={`text-lg px-1 transition-all ${p.captain ? 'text-gold2 scale-110' : 'text-dim/30 hover:text-dim'}`}>👑</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20"></span>
                <input value={p.opgg || ''} onChange={e => updatePlayer(i, 'opgg', e.target.value)} className="flex-1 text-xs py-1" placeholder="op.gg link lub nick" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave({ name, tag, avatar: useCustomIcon ? undefined : avatar, customIcon: useCustomIcon ? customIcon : undefined, color, players })} className="btn flex-1">{t(lang, 'save')}</button>
          <button onClick={onClose} className="btn-secondary flex-1">{t(lang, 'cancel')}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Seed Modal ----
function SeedModal({ matchId, slot, teams, bracket, onSave, onClose, lang }) {
  const seeded = new Set();
  if (bracket?.winners?.[0]) { for (const m of bracket.winners[0].matches) { if (m.t1) seeded.add(m.t1); if (m.t2) seeded.add(m.t2); } }
  const available = teams.filter(t => !seeded.has(t.id));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slideUp" onClick={e => e.stopPropagation()}>
        <h2 className="font-cinzel text-xl font-bold text-gold2 mb-4">{t(lang, 'assignTeam')}</h2>
        <p className="text-dim text-sm mb-3">{t(lang, 'match')}: {matchId} | {t(lang, 'slot')}: {slot}</p>
        <div className="space-y-2 mb-4 stagger-children">
          {available.map(team => (
            <button key={team.id} onClick={() => onSave(team.id)} className="w-full card p-3 text-left hover:border-gold2 flex items-center gap-3">
              {team.customIcon ? <img src={team.customIcon} alt="" className="w-8 h-8 rounded-lg object-cover border" style={{ borderColor: getTeamColor(teams, team.id) }} /> : <div className="team-avatar text-sm" style={{ borderColor: getTeamColor(teams, team.id), background: `${getTeamColor(teams, team.id)}20` }}>{team.avatar || '⚔️'}</div>}
              <span className="font-cinzel font-bold">[{team.tag}] {team.name}</span>
            </button>
          ))}
          <button onClick={() => onSave(null)} className="w-full btn-secondary text-center">{t(lang, 'removeAssignment')}</button>
        </div>
        <button onClick={onClose} className="btn-secondary w-full">{t(lang, 'cancel')}</button>
      </div>
    </div>
  );
}

// ---- Champion Picker with DDragon icons ----
function ChampionPicker({ value, onChange }) {
  const [champions, setChampions] = useState([]);
  const [ddragonVer, setDdragonVer] = useState('14.1.1');
  const [search, setSearch] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetch('/api/riot/champions').then(r => r.json()).then(d => {
      if (d.champions) {
        setChampions(d.champions.map(c => c.id).sort());
        if (d.version) setDdragonVer(d.version);
      }
    }).catch(() => {
      // Fallback to DDragon directly
      fetch(`${DDRAGON_BASE}/api/versions.json`).then(r => r.json()).then(v => {
        const ver = v[0];
        setDdragonVer(ver);
        return fetch(`${DDRAGON_BASE}/cdn/${ver}/data/en_US/champion.json`);
      }).then(r => r.json()).then(d => setChampions(Object.keys(d.data).sort())).catch(() => {});
    });
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = champions.filter(c => c.toLowerCase().includes(search.toLowerCase())).slice(0, 12);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        {value && <img src={`${DDRAGON_BASE}/cdn/${ddragonVer}/img/champion/${value}.png`} alt="" className="w-5 h-5 rounded" onError={e => e.target.style.display='none'} />}
        <input value={search} onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          className="w-full min-w-[80px] text-sm py-1 px-1" placeholder="Champ" />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 w-48 max-h-48 overflow-y-auto bg-bg2 border border-border rounded shadow-lg mt-1">
          {filtered.map(c => (
            <button key={c} onClick={() => { setSearch(c); onChange(c); setOpen(false); }}
              className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-bg3 text-left">
              <img src={`${DDRAGON_BASE}/cdn/${ddragonVer}/img/champion/${c}.png`} alt="" className="w-5 h-5 rounded" onError={e => e.target.style.display='none'} />
              <span>{c}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Match Edit Modal with MVP + comments + stream link ----
function MatchEditModal({ match, round, teams, onSave, onClose, lang, authHeaders }) {
  const bestOf = round?.bestOf || 1;
  const maxWins = Math.ceil(bestOf / 2);
  const [wins, setWins] = useState([...match.wins]);
  const [scheduledTime, setScheduledTime] = useState(match.scheduledTime || '');
  const [status, setStatus] = useState(match.status || '');
  const [comment, setComment] = useState(match.comment || '');
  const [mvp, setMvp] = useState(match.mvp || '');
  const [streamUrl, setStreamUrl] = useState(match.streamUrl || '');
  const [games, setGames] = useState(match.games || []);
  const [riotMatchId, setRiotMatchId] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const t1 = teams.find(t => t.id === match.t1);
  const t2 = teams.find(t => t.id === match.t2);
  const allPlayers = [...(t1?.players || []).map(p => ({ ...p, teamId: match.t1 })), ...(t2?.players || []).map(p => ({ ...p, teamId: match.t2 }))];

  const computeWinner = (w) => { if (w[0] >= maxWins) return match.t1; if (w[1] >= maxWins) return match.t2; return null; };
  const calcAutoMvp = (gs) => {
    let best = null; let bestScore = -1;
    for (const g of gs) {
      for (const p of (g.players || [])) {
        const score = (p.kills || 0) * 3 + (p.assists || 0) * 2 - (p.deaths || 0) * 1.5 + (p.cs || 0) * 0.01;
        if (score > bestScore) { bestScore = score; best = p.playerName || p.summonerName || ''; }
      }
    }
    return best || '';
  };
  const handleSave = () => {
    const autoMvp = mvp || calcAutoMvp(games);
    onSave({ wins, winner: computeWinner(wins), scheduledTime, status, comment, mvp: autoMvp, streamUrl, games });
  };
  const handleReset = () => { onSave({ wins: [0, 0], winner: null, scheduledTime, status: '', comment: '', mvp: '', streamUrl: '', games: [] }); };
  const setWin = (idx, val) => { const c = [...wins]; c[idx] = Math.max(0, Math.min(maxWins, val)); setWins(c); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-cinzel text-xl font-bold text-gold2">{match.id.replace(/-/g, ' ').toUpperCase()}</h2>
          <button onClick={onClose} className="text-dim hover:text-gold text-xl">✕</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-dim text-sm">{t(lang, 'scheduledTime')}</label>
            <input type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-dim text-sm">{t(lang, 'matchStatus')}</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full">
              <option value="">{t(lang, 'statusNone')}</option>
              <option value="live">{t(lang, 'statusLive')}</option>
              <option value="finished">{t(lang, 'statusFinished')}</option>
            </select>
          </div>
        </div>

        {bestOf === 1 ? (
          <div className="space-y-2 mb-4">
            <p className="text-dim text-sm">{t(lang, 'clickWinner')}</p>
            <div className="flex gap-2">
              <button onClick={() => setWins([1, 0])} className={`flex-1 p-3 rounded font-cinzel font-bold border transition-all ${wins[0] > 0 ? 'border-lolgreen bg-lolgreen/20 text-lolgreen' : 'border-border text-gold hover:border-gold2'}`}>
                [{t1?.tag || '?'}] {t1?.name || 'TBD'}
              </button>
              <button onClick={() => setWins([0, 1])} className={`flex-1 p-3 rounded font-cinzel font-bold border transition-all ${wins[1] > 0 ? 'border-lolgreen bg-lolgreen/20 text-lolgreen' : 'border-border text-gold hover:border-gold2'}`}>
                [{t2?.tag || '?'}] {t2?.name || 'TBD'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <p className="text-dim text-sm">BO{bestOf} — {t(lang, 'winsFirst')} {maxWins}</p>
            {[0, 1].map(idx => {
              const team = idx === 0 ? t1 : t2;
              const color = getTeamColor(teams, idx === 0 ? match.t1 : match.t2);
              return (
                <div key={idx} className="flex items-center justify-between card p-3">
                  <span className="font-cinzel font-bold" style={{ color }}>[{team?.tag || '?'}] {team?.name || 'TBD'}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setWin(idx, wins[idx] - 1)} className="btn-secondary px-3 py-1">-</button>
                    <span className="text-2xl font-bold w-8 text-center">{wins[idx]}</span>
                    <button onClick={() => setWin(idx, wins[idx] + 1)} className="btn-secondary px-3 py-1">+</button>
                  </div>
                </div>
              );
            })}
            {computeWinner(wins) && <p className="text-lolgreen text-sm text-center">{t(lang, 'winner')}: {getTeamTag(teams, computeWinner(wins))} {getTeamName(teams, computeWinner(wins))}</p>}
          </div>
        )}

        {/* MVP */}
        <div className="mb-4">
          <label className="text-dim text-sm">{t(lang, 'mvp')}</label>
          <select value={mvp} onChange={e => setMvp(e.target.value)} className="w-full">
            <option value="">{t(lang, 'selectMvp')}</option>
            {allPlayers.map((p, i) => (
              <option key={i} value={p.summonerName}>{getTeamTag(teams, p.teamId)} - {p.role} - {p.summonerName}</option>
            ))}
          </select>
        </div>

        {/* Stream URL */}
        <div className="mb-4">
          <label className="text-dim text-sm">{lang === 'pl' ? 'Link do transmisji' : 'Stream URL'}</label>
          <input value={streamUrl} onChange={e => setStreamUrl(e.target.value)} className="w-full" placeholder="https://twitch.tv/..." />
        </div>

        {/* Comments */}
        <div className="mb-4">
          <label className="text-dim text-sm">{t(lang, 'comments')}</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full" rows={2} placeholder={t(lang, 'commentsPlaceholder')} />
        </div>

        {/* Import from Riot */}
        {match.t1 && match.t2 && (
          <div className="mb-4 p-3 rounded-lg bg-bg3 border border-border">
            <h4 className="text-sm font-bold text-gold2 mb-2">{lang === 'pl' ? 'Importuj z Riot API' : 'Import from Riot API'}</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-dim text-xs">{lang === 'pl' ? 'ID meczu Riot (np. EUN1_1234567890)' : 'Riot Match ID (e.g. EUN1_1234567890)'}</label>
                <input value={riotMatchId} onChange={e => setRiotMatchId(e.target.value)} className="w-full text-sm" placeholder="EUN1_1234567890" />
              </div>
              <button disabled={!riotMatchId || importLoading} onClick={async () => {
                setImportLoading(true); setImportMsg('');
                try {
                  const res = await fetch(`/api/riot/match?id=${encodeURIComponent(riotMatchId)}`, { headers: authHeaders });
                  const data = await res.json();
                  if (data.error) { setImportMsg(data.error); setImportLoading(false); return; }

                  // Find which game slot to fill (first empty or next)
                  const gi = games.length;
                  const newGames = [...games];
                  const players = [];

                  // Map Riot players to tournament players
                  for (const p of [...data.blueTeam, ...data.redTeam]) {
                    if (p.tournamentTeamId) {
                      players.push({
                        teamId: p.tournamentTeamId,
                        role: p.tournamentRole || p.role,
                        playerName: p.summonerName,
                        champion: p.champion,
                        kills: p.kills,
                        deaths: p.deaths,
                        assists: p.assists,
                        cs: p.cs,
                        damageDealt: p.damageDealt,
                        goldEarned: p.goldEarned,
                        visionScore: p.visionScore,
                        items: p.items,
                      });
                    }
                  }

                  newGames.push({ gameNum: gi + 1, players, imported: true, riotMatchId: data.matchId, duration: data.summary?.duration });
                  setGames(newGames);

                  // Auto-update wins based on which team won
                  const blueTeamId = data.blueTeam.find(p => p.tournamentTeamId)?.tournamentTeamId;
                  const redTeamId = data.redTeam.find(p => p.tournamentTeamId)?.tournamentTeamId;
                  if (blueTeamId && redTeamId) {
                    const winnerTeamId = data.blueWin ? blueTeamId : redTeamId;
                    const newWins = [...wins];
                    if (winnerTeamId === match.t1) newWins[0]++;
                    else if (winnerTeamId === match.t2) newWins[1]++;
                    setWins(newWins);
                  }

                  setImportMsg(lang === 'pl' ? `Zaimportowano! (${data.summary?.duration}, ${players.length} graczy)` : `Imported! (${data.summary?.duration}, ${players.length} players)`);
                  setRiotMatchId('');
                } catch (e) { setImportMsg(e.message); }
                setImportLoading(false);
              }} className="btn text-sm whitespace-nowrap">
                {importLoading ? '...' : (lang === 'pl' ? 'Importuj' : 'Import')}
              </button>
            </div>
            {importMsg && <p className={`text-xs mt-1 ${importMsg.includes('!') ? 'text-lolgreen' : 'text-lolred'}`}>{importMsg}</p>}
          </div>
        )}

        {/* Game stats */}
        <div className="mb-4">
          <h4 className="text-sm font-bold text-gold2 mb-3">{t(lang, 'gameStats')}</h4>
          <div className="space-y-4">
            {Array.from({ length: bestOf }, (_, gi) => {
              const game = games[gi] || { gameNum: gi + 1, players: [] };
              const updatePlayer = (teamId, role, field, value) => {
                const newGames = [...games];
                while (newGames.length <= gi) newGames.push({ gameNum: newGames.length + 1, players: [] });
                const g = { ...newGames[gi], players: [...(newGames[gi]?.players || [])] };
                let pIdx = g.players.findIndex(p => p.teamId === teamId && p.role === role);
                if (pIdx < 0) {
                  const team = teams.find(tm => tm.id === teamId);
                  const player = team?.players?.find(p => p.role === role);
                  g.players.push({ teamId, playerName: player?.summonerName || '', role, champion: '', kills: 0, deaths: 0, assists: 0, cs: 0 });
                  pIdx = g.players.length - 1;
                }
                g.players[pIdx] = { ...g.players[pIdx], [field]: field === 'champion' || field === 'playerName' ? value : (parseInt(value) || 0) };
                newGames[gi] = g;
                setGames(newGames);
              };
              return (
                <div key={gi} className="card p-3">
                  <h4 className="text-sm font-semibold text-gold2 mb-2">{t(lang, 'game')} {gi + 1}</h4>
                  {[t1, t2].filter(Boolean).map(team => (
                    <div key={team.id} className="mb-3">
                      <p className="text-xs font-semibold mb-1" style={{ color: getTeamColor(teams, team.id) }}>{team.tag}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="text-xs text-dim">
                            <th className="text-left py-1 px-1 w-16">{t(lang, 'role')}</th>
                            <th className="text-left py-1 px-1">{t(lang, 'player')}</th>
                            <th className="text-left py-1 px-1">Champion</th>
                            <th className="text-center py-1 px-1 text-lolgreen w-14">K</th>
                            <th className="text-center py-1 px-1 text-lolred w-14">D</th>
                            <th className="text-center py-1 px-1 text-lolblue w-14">A</th>
                            <th className="text-center py-1 px-1 w-16">CS</th>
                          </tr></thead>
                          <tbody>
                            {(team.players || []).map((player, pi) => {
                              const existing = game.players?.find(p => p.teamId === team.id && p.role === player.role) || {};
                              return (
                                <tr key={pi} className="border-t border-border/30">
                                  <td className="py-1 px-1 text-dim">{ROLE_ICONS[player.role]} {player.role}</td>
                                  <td className="py-1 px-1 text-dim truncate max-w-[80px]">{player.summonerName}</td>
                                  <td className="py-1 px-1"><ChampionPicker value={existing.champion || ''} onChange={v => updatePlayer(team.id, player.role, 'champion', v)} /></td>
                                  <td className="py-1 px-1"><input type="number" min="0" value={existing.kills ?? ''} onChange={e => updatePlayer(team.id, player.role, 'kills', e.target.value)} className="w-full text-sm py-1 px-1 text-center" /></td>
                                  <td className="py-1 px-1"><input type="number" min="0" value={existing.deaths ?? ''} onChange={e => updatePlayer(team.id, player.role, 'deaths', e.target.value)} className="w-full text-sm py-1 px-1 text-center" /></td>
                                  <td className="py-1 px-1"><input type="number" min="0" value={existing.assists ?? ''} onChange={e => updatePlayer(team.id, player.role, 'assists', e.target.value)} className="w-full text-sm py-1 px-1 text-center" /></td>
                                  <td className="py-1 px-1"><input type="number" min="0" value={existing.cs ?? ''} onChange={e => updatePlayer(team.id, player.role, 'cs', e.target.value)} className="w-full text-sm py-1 px-1 text-center" /></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} className="btn flex-1">{t(lang, 'save')}</button>
          <button onClick={handleReset} className="btn-danger flex-1">{t(lang, 'resetResult')}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Admin Match Card ----
function AdminMatchCard({ match, teams, bestOf, onClickSlot, onClickMatch, onDrop }) {
  const [dragOver, setDragOver] = useState(null);
  const t1Color = getTeamColor(teams, match.t1);
  const t2Color = getTeamColor(teams, match.t2);
  const isFinished = !!match.winner;
  const isLive = match.status === 'live';
  const canEdit = match.t1 && match.t2;

  const isWbR1 = match.id.startsWith('wb-r1');

  return (
    <div className={`match-card p-0 overflow-hidden ${isLive ? 'is-live' : ''}`}>
      <div className={`text-[10px] text-dim px-2 py-1 border-b border-border uppercase tracking-wider flex justify-between items-center ${canEdit ? 'cursor-pointer hover:bg-bg3' : ''}`}
        onClick={() => { if (canEdit) onClickMatch(match); }}>
        <span>{match.id.replace(/-/g, ' ').toUpperCase()}</span>
        <span className="flex items-center gap-1">
          {bestOf > 1 && <span>BO{bestOf}</span>}
          {isLive && <span className="live-indicator"><span className="live-dot"></span>LIVE</span>}
          {match.mvp && <span className="mvp-badge">MVP</span>}
          {canEdit && <span className="text-gold2">✎</span>}
        </span>
      </div>
      {[1, 2].map(slot => {
        const teamId = slot === 1 ? match.t1 : match.t2;
        const color = slot === 1 ? t1Color : t2Color;
        const tag = getTeamTag(teams, teamId);
        const winIdx = slot - 1;
        const canUnseed = isWbR1 && teamId && !isFinished;
        return (
          <div key={slot}
            className={`flex items-center justify-between px-3 py-1.5 transition-colors
              ${slot === 2 ? 'border-t border-border' : ''}
              ${isFinished && match.winner === teamId ? 'winner-row' : ''}
              ${isFinished && match.winner !== teamId && match.winner ? 'loser-row' : ''}
              ${dragOver === slot ? 'drag-over' : ''}
              ${!teamId || canUnseed ? 'cursor-pointer hover:bg-bg3' : ''}`}
            onClick={() => { if (!teamId || canUnseed) onClickSlot(match.id, slot); }}
            onDragOver={(e) => { if (!teamId) { e.preventDefault(); setDragOver(slot); } }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => { e.preventDefault(); setDragOver(null); const tid = e.dataTransfer.getData('text/plain'); if (tid) onDrop(match.id, slot, tid); }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded" style={{ background: color }}></div>
              <span className="font-cinzel text-sm font-bold" style={{ color: teamId ? color : '#5A6880' }}>{teamId ? tag : '+ Przypisz'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: isFinished && match.winner === teamId ? '#3CB878' : '#5A6880' }}>{match.wins[winIdx]}</span>
              {canUnseed && <button onClick={(e) => { e.stopPropagation(); onDrop(match.id, slot, null); }} className="text-lolred text-xs hover:text-red-400" title="Usuń">✕</button>}
            </div>
          </div>
        );
      })}
      {match.comment && <div className="px-2 py-1 border-t border-border text-[10px] text-dim truncate">{match.comment}</div>}
    </div>
  );
}

// ---- Bracket Connector ----
function BracketConnector({ count, matches }) {
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

// ---- Admin Bracket View ----
function AdminBracketView({ bracket, teams, onClickSlot, onClickMatch, onDrop, lang }) {
  if (!bracket) return null;
  const renderRounds = (rounds) => {
    const el = [];
    rounds.forEach((round, ri) => {
      el.push(
        <div key={round.id} className="bracket-round">
          <div className="text-xs text-dim text-center mb-1 font-semibold">{round.name}</div>
          {round.matches.map(match => <AdminMatchCard key={match.id} match={match} teams={teams} bestOf={round.bestOf} onClickSlot={onClickSlot} onClickMatch={onClickMatch} onDrop={onDrop} />)}
        </div>
      );
      if (ri < rounds.length - 1 && round.matches.length > 1) el.push(<BracketConnector key={`c-${round.id}`} count={round.matches.length} matches={round.matches} />);
      else if (ri < rounds.length - 1) { const a = round.matches[0]?.winner; el.push(<div key={`s-${round.id}`} className="flex items-center"><div className={`w-8 h-[2px] connector-line-h ${a ? 'active' : ''}`}></div></div>); }
    });
    return el;
  };
  return (
    <div className="space-y-8 animate-fadeIn">
      <div><h3 className="font-cinzel text-xl font-bold text-lolgreen mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-lolgreen"></span>{t(lang, 'winnersBracket')}</h3><div className="bracket-container">{renderRounds(bracket.winners || [])}</div></div>
      <div><h3 className="font-cinzel text-xl font-bold text-lolred mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-lolred"></span>{t(lang, 'losersBracket')}</h3><div className="bracket-container">{renderRounds(bracket.losers || [])}</div></div>
      {bracket.grandFinal && (
        <div><h3 className="font-cinzel text-xl font-bold text-gold2 mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gold2"></span>{t(lang, 'grandFinal')}</h3>
          <div className="flex justify-center"><div className="min-w-[240px]">{bracket.grandFinal.matches.map(m => <AdminMatchCard key={m.id} match={m} teams={teams} bestOf={bracket.grandFinal.bestOf} onClickSlot={onClickSlot} onClickMatch={onClickMatch} onDrop={onDrop} />)}</div></div>
        </div>
      )}
    </div>
  );
}

// ---- Admin Dashboard ----
function AdminDashboard({ data, lang, token, onRefresh, showToast }) {
  const allMatches = [];
  const bracket = data.bracket;
  for (const s of ['winners', 'losers']) {
    if (bracket?.[s]) for (const r of bracket[s]) allMatches.push(...r.matches);
  }
  if (bracket?.grandFinal) allMatches.push(...bracket.grandFinal.matches);

  const finished = allMatches.filter(m => m.winner);
  const live = allMatches.filter(m => m.status === 'live');
  const totalWithTeams = allMatches.filter(m => m.t1 && m.t2);
  const remaining = totalWithTeams.length - finished.length;

  const upcoming = allMatches
    .filter(m => m.scheduledTime && !m.winner && m.status !== 'live')
    .map(m => ({ ...m, time: new Date(m.scheduledTime).getTime() }))
    .filter(m => m.time > Date.now())
    .sort((a, b) => a.time - b.time);

  const nextMatch = upcoming[0] || null;
  const progress = totalWithTeams.length > 0 ? (finished.length / totalWithTeams.length * 100) : 0;

  const getTeamColor = (teamId) => {
    const team = data.teams.find(t => t.id === teamId);
    if (team?.color) return team.color;
    const idx = data.teams.findIndex(t => t.id === teamId);
    return idx >= 0 ? TEAM_COLORS[idx % TEAM_COLORS.length] : '#5A6880';
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-gold2 font-cinzel">{data.teams.length}</p>
          <p className="text-dim text-xs mt-1">{t(lang, 'teamsRegistered')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-lolgreen font-cinzel">{finished.length}</p>
          <p className="text-dim text-xs mt-1">{t(lang, 'matchesPlayed')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-lolblue font-cinzel">{remaining}</p>
          <p className="text-dim text-xs mt-1">{t(lang, 'matchesRemaining')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-lolred font-cinzel">{live.length}</p>
          <p className="text-dim text-xs mt-1">{t(lang, 'liveNow')}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-cinzel font-bold text-gold2">{t(lang, 'tournamentProgress')}</h3>
          <span className="text-dim text-sm">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-bg3 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold2 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-dim text-xs mt-2">{finished.length} / {totalWithTeams.length} {lang === 'pl' ? 'meczy rozegranych' : 'matches completed'}</p>
      </div>

      {/* Live matches */}
      {live.length > 0 && (
        <div className="card p-4 border-lolred/30">
          <h3 className="font-cinzel font-bold text-lolred mb-3 flex items-center gap-2">
            <span className="live-dot"></span> {t(lang, 'liveNow')}
          </h3>
          <div className="space-y-2">
            {live.map(m => {
              const t1 = data.teams.find(tt => tt.id === m.t1);
              const t2 = data.teams.find(tt => tt.id === m.t2);
              return (
                <div key={m.id} className="flex items-center justify-between p-3 rounded bg-lolred/5 border border-lolred/20">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dim uppercase">{m.id.replace(/-/g, ' ')}</span>
                    <span className="font-bold" style={{ color: getTeamColor(m.t1) }}>{t1?.tag || 'TBD'}</span>
                    <span className="text-gold2 font-bold">{m.wins[0]} - {m.wins[1]}</span>
                    <span className="font-bold" style={{ color: getTeamColor(m.t2) }}>{t2?.tag || 'TBD'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next match */}
      {nextMatch && (
        <div className="card p-4">
          <h3 className="font-cinzel font-bold text-gold2 mb-3">{t(lang, 'nextScheduled')}</h3>
          <div className="flex items-center justify-between p-3 rounded bg-gold2/5 border border-gold2/20">
            <div className="flex items-center gap-3">
              <span className="text-xs text-dim uppercase">{nextMatch.id.replace(/-/g, ' ')}</span>
              <span className="font-bold" style={{ color: getTeamColor(nextMatch.t1) }}>
                {data.teams.find(tt => tt.id === nextMatch.t1)?.tag || 'TBD'}
              </span>
              <span className="text-dim text-xs">vs</span>
              <span className="font-bold" style={{ color: getTeamColor(nextMatch.t2) }}>
                {data.teams.find(tt => tt.id === nextMatch.t2)?.tag || 'TBD'}
              </span>
            </div>
            <span className="text-sm text-gold2 font-semibold">
              {new Date(nextMatch.scheduledTime).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {/* Recent results */}
      {finished.length > 0 && (
        <div className="card p-4">
          <h3 className="font-cinzel font-bold text-gold2 mb-3">{lang === 'pl' ? 'Ostatnie wyniki' : 'Recent Results'}</h3>
          <div className="space-y-2">
            {finished.slice(-5).reverse().map(m => {
              const winner = data.teams.find(tt => tt.id === m.winner);
              const loser = data.teams.find(tt => tt.id === (m.winner === m.t1 ? m.t2 : m.t1));
              return (
                <div key={m.id} className="flex items-center justify-between p-2 rounded bg-bg3 text-sm">
                  <span className="text-xs text-dim uppercase w-24">{m.id.replace(/-/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: getTeamColor(m.winner) }}>{winner?.tag}</span>
                    <span className="text-gold2 font-bold">{m.wins[0]} - {m.wins[1]}</span>
                    <span className="text-dim">{loser?.tag}</span>
                  </div>
                  {m.mvp && <span className="text-xs text-gold2">MVP: {m.mvp}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Registrations */}
      {(data.config?.pendingRegistrations || []).filter(r => r.status === 'pending').length > 0 && (
        <div className="card p-4 border-gold2/30">
          <h3 className="font-cinzel font-bold text-gold2 mb-3">{lang === 'pl' ? 'Oczekujące rejestracje' : 'Pending Registrations'}</h3>
          <div className="space-y-3">
            {(data.config?.pendingRegistrations || []).filter(r => r.status === 'pending').map(reg => (
              <div key={reg.id} className="p-3 rounded bg-bg3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-gold2">[{reg.teamTag}] {reg.teamName}</span>
                    <span className="text-dim text-xs ml-2">Discord: {reg.captainDiscord}</span>
                  </div>
                  <span className="text-dim text-xs">{new Date(reg.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {reg.players.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-bg2 text-dim">
                      {p.role}: {p.summonerName} {p.captain ? '👑' : ''}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    try {
                      const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
                      // Add team
                      const res = await fetch('/api/admin/teams', { method: 'POST', headers: authHeaders, body: JSON.stringify({
                        name: reg.teamName, tag: reg.teamTag, players: reg.players
                      })});
                      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
                      // Mark as approved
                      const regs = (data.config?.pendingRegistrations || []).map(r => r.id === reg.id ? { ...r, status: 'approved' } : r);
                      await fetch('/api/admin/config', { method: 'PUT', headers: authHeaders, body: JSON.stringify({ pendingRegistrations: regs }) });
                      showToast(`${reg.teamTag} approved!`, 'success');
                      onRefresh();
                    } catch (e) { showToast(e.message, 'error'); }
                  }} className="btn text-xs py-1 px-3">{lang === 'pl' ? 'Zatwierdź' : 'Approve'}</button>
                  <button onClick={async () => {
                    const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
                    const regs = (data.config?.pendingRegistrations || []).map(r => r.id === reg.id ? { ...r, status: 'rejected' } : r);
                    await fetch('/api/admin/config', { method: 'PUT', headers: authHeaders, body: JSON.stringify({ pendingRegistrations: regs }) });
                    showToast(`${reg.teamTag} rejected`, 'info');
                    onRefresh();
                  }} className="btn-danger text-xs py-1 px-3">{lang === 'pl' ? 'Odrzuć' : 'Reject'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Settings Tab ----
function SettingsTab({ data, token, lang, onRefresh, showToast }) {
  const [tName, setTName] = useState(data.tournamentName);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [rules, setRules] = useState(data.rules || '');
  const [undoCount, setUndoCount] = useState(0);
  const [archives, setArchives] = useState([]);
  const [qrUrl, setQrUrl] = useState('');

  const allRounds = [...(data.bracket?.winners || []), ...(data.bracket?.losers || []), ...(data.bracket?.grandFinal ? [data.bracket.grandFinal] : [])];

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('/api/admin/undo', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setUndoCount(d.count || 0)).catch(() => {});
    fetch('/api/admin/archive').then(r => r.json()).then(d => setArchives(d || [])).catch(() => {});
  }, [token, data]);

  const saveName = async () => { try { const r = await fetch('/api/admin/config', { method: 'PUT', headers: authHeaders, body: JSON.stringify({ tournamentName: tName }) }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`); showToast(t(lang, 'nameSaved'), 'success'); onRefresh(); } catch (e) { showToast(e.message, 'error'); } };
  const saveRules = async () => { try { const r = await fetch('/api/admin/config', { method: 'PUT', headers: authHeaders, body: JSON.stringify({ rules }) }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`); showToast(t(lang, 'rulesSaved'), 'success'); onRefresh(); } catch (e) { showToast(e.message, 'error'); } };
  const changePw = async () => {
    try {
      const r = await fetch('/api/admin/config', { method: 'PUT', headers: authHeaders, body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }) });
      if (r.ok) { localStorage.setItem('adminToken', newPw); setOldPw(''); setNewPw(''); showToast(t(lang, 'passwordChanged'), 'success'); } else { const e = await r.json(); showToast(e.error, 'error'); }
    } catch (e) { showToast(e.message, 'error'); }
  };
  const changeBo = async (roundId, bestOf) => { try { const r = await fetch('/api/admin/bestof', { method: 'PUT', headers: authHeaders, body: JSON.stringify({ roundId, bestOf }) }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`); showToast(t(lang, 'formatChanged'), 'info'); onRefresh(); } catch (e) { showToast(e.message, 'error'); } };
  const handleUndo = async () => { const r = await fetch('/api/admin/undo', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { playSound('undo'); showToast(t(lang, 'undone'), 'info'); onRefresh(); } else { showToast(t(lang, 'noHistory'), 'error'); } };
  const handleRandomize = async () => { if (!confirm(t(lang, 'randomizeConfirm'))) return; const r = await fetch('/api/admin/randomize', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { playSound('success'); showToast(t(lang, 'pairsRandomized'), 'success'); onRefresh(); } };
  const handleReset = async () => { if (!confirm(t(lang, 'resetConfirm'))) return; try { const r = await fetch('/api/admin/reset', { method: 'PUT', headers: authHeaders }); if (r.ok) { playSound('undo'); showToast(t(lang, 'tournamentReset'), 'info'); onRefresh(); } else { const e = await r.json().catch(() => ({})); showToast(e.error || `HTTP ${r.status}`, 'error'); } } catch (e) { showToast(e.message, 'error'); } };
  const handleArchive = async () => { const r = await fetch('/api/admin/archive', { method: 'POST', headers: authHeaders, body: JSON.stringify({ name: data.tournamentName }) }); if (r.ok) { showToast(t(lang, 'tournamentArchived'), 'success'); onRefresh(); } };
  const handleQr = async () => { const url = window.location.origin; const r = await fetch(`/api/qr?url=${encodeURIComponent(url)}`); if (r.ok) { const d = await r.json(); setQrUrl(d.qrUrl); } };
  return (
    <div className="space-y-6 max-w-lg animate-fadeIn">
      <div className="card p-4">
        <h3 className="font-cinzel text-lg font-bold text-gold2 mb-3">{t(lang, 'tournamentNameLabel')}</h3>
        <div className="flex gap-2"><input value={tName} onChange={e => setTName(e.target.value)} className="flex-1" /><button onClick={saveName} className="btn">{t(lang, 'save')}</button></div>
      </div>

      <div className="card p-4">
        <h3 className="font-cinzel text-lg font-bold text-gold2 mb-3">{t(lang, 'rules')}</h3>
        <p className="text-dim text-xs mb-2">{lang === 'pl' ? 'Obsługiwane formatowanie: # Tytuł, ## Podtytuł, - lista, 1. numeracja, > cytat, --- linia' : 'Supported: # Title, ## Subtitle, - list, 1. numbered, > quote, --- line'}</p>
        <textarea value={rules} onChange={e => setRules(e.target.value)} rows={10} className="w-full mb-2 font-mono text-sm" placeholder={t(lang, 'rulesPlaceholder')} />
        <button onClick={saveRules} className="btn w-full">{t(lang, 'save')}</button>
      </div>

      <div className="card p-4">
        <h3 className="font-cinzel text-lg font-bold text-gold2 mb-3">{t(lang, 'quickActions')}</h3>
        <div className="space-y-2">
          <button onClick={handleRandomize} className="btn w-full">🎲 {t(lang, 'randomizePairs')}</button>
          <button onClick={handleUndo} className="btn-secondary w-full" disabled={undoCount === 0}>↩ {t(lang, 'undoLast')} ({undoCount} {t(lang, 'inHistory')})</button>
          <div className="flex gap-2">
            <a href="/api/export?format=csv" download className="btn-secondary flex-1 text-center">📄 {t(lang, 'exportCsv')}</a>
            <a href="/api/export?format=json" download className="btn-secondary flex-1 text-center">📋 {t(lang, 'exportJson')}</a>
          </div>
          <button onClick={handleArchive} className="btn-secondary w-full">📦 {t(lang, 'archiveTournament')}</button>
          <button onClick={handleReset} className="btn-danger w-full">⚠️ {t(lang, 'resetTournament')}</button>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-cinzel text-lg font-bold text-gold2 mb-3">{t(lang, 'roundFormat')}</h3>
        <div className="space-y-2">
          {allRounds.map(round => (
            <div key={round.id} className="flex items-center justify-between p-2 rounded bg-bg3">
              <span className="font-semibold text-sm">{round.name}</span>
              <select value={round.bestOf} onChange={e => changeBo(round.id, parseInt(e.target.value))} className="w-20">
                <option value={1}>BO1</option><option value={3}>BO3</option><option value={5}>BO5</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-cinzel text-lg font-bold text-gold2 mb-3">{t(lang, 'qrCode')}</h3>
        <button onClick={handleQr} className="btn-secondary w-full mb-3">{t(lang, 'generateQr')}</button>
        {qrUrl && (
          <div className="text-center">
            <div className="qr-container inline-block mb-2"><img src={qrUrl} alt="QR Code" width={200} height={200} /></div>
            <p className="text-dim text-xs">{t(lang, 'shareLink')}: {window.location.origin}</p>
          </div>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-cinzel text-lg font-bold text-gold2 mb-3">{t(lang, 'changePassword')}</h3>
        <div className="space-y-2">
          <input type="password" placeholder={t(lang, 'currentPassword')} value={oldPw} onChange={e => setOldPw(e.target.value)} className="w-full" />
          <input type="password" placeholder={t(lang, 'newPassword')} value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full" />
          <button onClick={changePw} className="btn w-full" disabled={!oldPw || !newPw || newPw.length < 4}>{t(lang, 'changePassword')}</button>
          {newPw && newPw.length < 4 && <p className="text-lolred text-xs">{lang === 'pl' ? 'Min. 4 znaki' : 'Min. 4 characters'}</p>}
        </div>
      </div>

      {archives.length > 0 && (
        <div className="card p-4">
          <h3 className="font-cinzel text-lg font-bold text-gold2 mb-3">{t(lang, 'archives')}</h3>
          <div className="space-y-2">
            {archives.map((a, i) => (
              <div key={i} className="archive-card flex items-center justify-between">
                <div>
                  <span className="font-semibold">{a.name}</span>
                  <span className="text-dim text-xs ml-2">{new Date(a.timestamp).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main Admin Page ----
export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [editTeam, setEditTeam] = useState(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [seedModal, setSeedModal] = useState(null);
  const [matchEditModal, setMatchEditModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState('pl');
  const [theme, setTheme] = useState('dark');

  const showToast = useCallback((message, type = 'info') => { setToast({ message, type, key: Date.now() }); }, []);

  useEffect(() => {
    setLang(localStorage.getItem('lang') || 'pl');
    setTheme(localStorage.getItem('theme') || 'dark');
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
    const saved = localStorage.getItem('adminToken');
    if (saved) { setToken(saved); fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: saved }) }).then(r => { if (r.ok) setAuthed(true); }); }
  }, []);

  const toggleTheme = () => { const n = theme === 'dark' ? 'light' : 'dark'; setTheme(n); localStorage.setItem('theme', n); document.documentElement.setAttribute('data-theme', n); };
  const toggleLang = () => { const n = lang === 'pl' ? 'en' : 'pl'; setLang(n); localStorage.setItem('lang', n); };

  const fetchData = useCallback(async () => { const r = await fetch('/api/tournament'); if (r.ok) setData(await r.json()); }, []);
  useEffect(() => { if (authed) fetchData(); }, [authed, fetchData]);
  useEffect(() => { if (!authed) return; const i = setInterval(fetchData, 10000); return () => clearInterval(i); }, [authed, fetchData]);

  const handleLogin = (pw) => { localStorage.setItem('adminToken', pw); setToken(pw); setAuthed(true); };
  const apiPut = useCallback(async (url, body) => {
    const res = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res;
  }, [token]);

  const saveTeam = async (teamData, existingId) => {
    try {
      const teams = [...(data?.teams || [])];
      if (existingId) { const idx = teams.findIndex(tm => tm.id === existingId); if (idx >= 0) teams[idx] = { ...teams[idx], ...teamData }; }
      else { teams.push({ id: 't' + (Date.now() % 100000), ...teamData }); }
      await apiPut('/api/admin/teams', teams);
      setEditTeam(null); setShowAddTeam(false); playSound('success');
      showToast(existingId ? t(lang, 'teamUpdated') : t(lang, 'teamAdded'), 'success'); fetchData();
    } catch (e) { showToast(e.message, 'error'); }
  };
  const isTeamInBracket = (teamId) => {
    if (!data?.bracket) return false;
    for (const section of ['winners', 'losers']) {
      for (const round of (data.bracket[section] || [])) {
        for (const m of round.matches) {
          if ((m.t1 === teamId || m.t2 === teamId) && !m.winner) return true;
        }
      }
    }
    if (data.bracket.grandFinal) {
      for (const m of data.bracket.grandFinal.matches) {
        if ((m.t1 === teamId || m.t2 === teamId) && !m.winner) return true;
      }
    }
    return false;
  };
  const deleteTeam = async (teamId) => {
    if (isTeamInBracket(teamId)) {
      showToast(lang === 'pl' ? 'Nie mozna usunac druzyny przypisanej do drabinki' : 'Cannot delete team assigned to bracket', 'error');
      return;
    }
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    try {
      await apiPut('/api/admin/teams', (data?.teams || []).filter(tm => tm.id !== teamId));
      setEditTeam(null); showToast(t(lang, 'teamDeleted'), 'info'); fetchData();
    } catch (e) { showToast(e.message, 'error'); }
  };
  const saveSeed = async (teamId) => { try { await apiPut('/api/admin/seed', { matchId: seedModal.matchId, slot: seedModal.slot, teamId }); setSeedModal(null); playSound('success'); showToast(t(lang, 'teamAssigned'), 'success'); fetchData(); } catch (e) { showToast(e.message, 'error'); } };
  const handleDrop = async (matchId, slot, teamId) => { try { await apiPut('/api/admin/seed', { matchId, slot, teamId }); playSound('success'); showToast(t(lang, 'teamAssignedDnd'), 'success'); fetchData(); } catch (e) { showToast(e.message, 'error'); } };
  const saveMatch = async (matchData) => { try { await apiPut(`/api/admin/match/${matchEditModal.match.id}`, matchData); setMatchEditModal(null); playSound('success'); showToast(t(lang, 'matchUpdated'), 'success'); fetchData(); } catch (e) { showToast(e.message, 'error'); } };

  const findRoundForMatch = (matchId) => {
    if (!data?.bracket) return null;
    for (const r of (data.bracket.winners || [])) if (r.matches.some(m => m.id === matchId)) return r;
    for (const r of (data.bracket.losers || [])) if (r.matches.some(m => m.id === matchId)) return r;
    if (data.bracket.grandFinal?.matches?.some(m => m.id === matchId)) return data.bracket.grandFinal;
    return null;
  };

  if (!authed) return <LoginScreen onLogin={handleLogin} lang={lang} />;
  if (!data) return <div className="min-h-screen flex items-center justify-center"><div className="text-gold2 font-cinzel text-2xl animate-pulse">{t(lang, 'loading')}</div></div>;

  const tabs = [
    { id: 'dashboard', label: t(lang, 'dashboard') },
    { id: 'bracket', label: t(lang, 'bracket') },
    { id: 'teams', label: t(lang, 'teams') },
    { id: 'settings', label: t(lang, 'settings') },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg2">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-cinzel text-xl sm:text-2xl font-black text-gold2">{data.tournamentName}</h1>
            <p className="text-dim text-sm">{t(lang, 'adminSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="btn-secondary text-xs px-2 py-1">{lang === 'pl' ? 'EN' : 'PL'}</button>
            <button onClick={toggleTheme} className="theme-toggle"></button>
            <a href="/" className="btn-secondary text-sm">{t(lang, 'publicView')}</a>
            <button onClick={() => { localStorage.removeItem('adminToken'); setAuthed(false); setToken(''); }} className="btn-secondary text-sm">{t(lang, 'logout')}</button>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-bg2/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-4 sm:gap-6">
          {tabs.map(tb => <button key={tb.id} onClick={() => setTab(tb.id)} className={`py-3 px-1 text-sm font-semibold transition-colors ${tab === tb.id ? 'tab-active' : 'tab-inactive'}`}>{tb.label}</button>)}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <AdminDashboard data={data} lang={lang} token={token} onRefresh={onRefresh} showToast={showToast} />}
        {tab === 'bracket' && <AdminBracketView bracket={data.bracket} teams={data.teams} lang={lang} onClickSlot={(mid, slot) => setSeedModal({ matchId: mid, slot })} onClickMatch={(m) => setMatchEditModal({ match: m })} onDrop={handleDrop} />}

        {tab === 'teams' && (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-cinzel text-xl font-bold text-gold2">{t(lang, 'teams')} ({data.teams.length}/8)</h2>
              {data.teams.length < 8 && <button onClick={() => setShowAddTeam(true)} className="btn">{t(lang, 'addTeam')}</button>}
            </div>
            {data.teams.length > 0 && <p className="text-dim text-xs mb-3">{t(lang, 'dragHint')}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              {data.teams.map(team => {
                const color = getTeamColor(data.teams, team.id);
                return (
                  <div key={team.id} className="card p-4 cursor-grab active:cursor-grabbing" draggable
                    onDragStart={e => { e.dataTransfer.setData('text/plain', team.id); e.currentTarget.classList.add('dragging'); }}
                    onDragEnd={e => e.currentTarget.classList.remove('dragging')}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {team.customIcon ? <img src={team.customIcon} alt="" className="w-10 h-10 rounded-lg object-cover border-2" style={{ borderColor: color }} /> : <div className="team-avatar" style={{ borderColor: color, background: `${color}20` }}>{team.avatar || '⚔️'}</div>}
                        <h3 className="font-cinzel text-base sm:text-lg font-bold" style={{ color }}>[{team.tag}] {team.name}</h3>
                      </div>
                      <button onClick={() => setEditTeam(team)} className="text-dim hover:text-gold text-sm">{t(lang, 'edit')}</button>
                    </div>
                    <div className="space-y-1">
                      {(team.players || []).map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-xs">{ROLE_ICONS[p.role] || '🎮'}</span>
                          <span className="text-dim w-14">{p.role}</span>
                          <span>{p.summonerName}</span>
                          {p.captain && <span title={lang === 'pl' ? 'Kapitan' : 'Captain'}>👑</span>}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => deleteTeam(team.id)} className="text-lolred text-xs mt-3 hover:underline">{t(lang, 'deleteTeam')}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'settings' && <SettingsTab data={data} token={token} lang={lang} onRefresh={fetchData} showToast={showToast} />}
      </main>

      {showAddTeam && <TeamEditModal team={null} lang={lang} onSave={td => saveTeam(td, null)} onClose={() => setShowAddTeam(false)} />}
      {editTeam && <TeamEditModal team={editTeam} lang={lang} onSave={td => saveTeam(td, editTeam.id)} onClose={() => setEditTeam(null)} />}
      {seedModal && <SeedModal matchId={seedModal.matchId} slot={seedModal.slot} teams={data.teams} bracket={data.bracket} lang={lang} onSave={saveSeed} onClose={() => setSeedModal(null)} />}
      {matchEditModal && <MatchEditModal match={matchEditModal.match} round={findRoundForMatch(matchEditModal.match.id)} teams={data.teams} lang={lang} onSave={saveMatch} onClose={() => setMatchEditModal(null)} authHeaders={authHeaders} />}
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
