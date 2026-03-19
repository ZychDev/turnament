'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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

// ---- Sound ----
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'circle' : 'square',
  }));
  return (
    <>
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`,
          animationDelay: `${p.delay}s`,
          background: p.color,
          width: p.size,
          height: p.size,
          borderRadius: p.shape === 'circle' ? '50%' : '2px',
        }} />
      ))}
    </>
  );
}

// ---- Particles ----
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    bottom: -(Math.random() * 20),
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 15,
    size: 2 + Math.random() * 3,
  }));
  return (
    <div className="particles-container">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: `${p.left}%`,
          bottom: `${p.bottom}%`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          width: p.size, height: p.size,
        }} />
      ))}
    </div>
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
  return (
    <img
      src={`${DDRAGON}${formatted}.png`}
      alt={name}
      className="w-5 h-5 rounded inline-block"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
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
      <div className={`flex items-center justify-between px-3 py-1.5 ${isFinished && match.winner === match.t1 ? 'winner-row winner-flash' : ''} ${isFinished && match.winner !== match.t1 && match.winner ? 'loser-row' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded" style={{ background: t1Color }}></div>
          <span className="font-cinzel text-sm font-bold" style={{ color: match.t1 ? t1Color : '#5A6880' }}>{t1Tag}</span>
          {match.mvp && teams.find(tt => tt.id === match.t1)?.players?.some(p => p.summonerName === match.mvp) && <span className="mvp-badge">MVP</span>}
        </div>
        <span className="text-sm font-bold" style={{ color: isFinished && match.winner === match.t1 ? '#3CB878' : '#5A6880' }}>{match.wins[0]}</span>
      </div>
      <div className={`flex items-center justify-between px-3 py-1.5 border-t border-border ${isFinished && match.winner === match.t2 ? 'winner-row winner-flash' : ''} ${isFinished && match.winner !== match.t2 && match.winner ? 'loser-row' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded" style={{ background: t2Color }}></div>
          <span className="font-cinzel text-sm font-bold" style={{ color: match.t2 ? t2Color : '#5A6880' }}>{t2Tag}</span>
          {match.mvp && teams.find(tt => tt.id === match.t2)?.players?.some(p => p.summonerName === match.mvp) && <span className="mvp-badge">MVP</span>}
        </div>
        <span className="text-sm font-bold" style={{ color: isFinished && match.winner === match.t2 ? '#3CB878' : '#5A6880' }}>{match.wins[1]}</span>
      </div>
      {/* Mini prediction bar */}
      {totalVotes > 0 && match.t1 && match.t2 && !isFinished && (
        <div className="px-2 py-1 border-t border-border">
          <div className="prediction-bar">
            <div className="prediction-fill" style={{ width: `${t1Pct}%`, background: t1Color }}></div>
          </div>
        </div>
      )}
      {/* Comment preview */}
      {match.comment && (
        <div className="px-2 py-1 border-t border-border text-[10px] text-dim truncate">
          {match.comment}
        </div>
      )}
    </div>
  );
}

// ---- Bracket Connector ----
function BracketConnector({ count, matches }) {
  return (
    <div className="bracket-connector">
      {Array.from({ length: Math.ceil(count / 2) }, (_, i) => {
        const m1 = matches?.[i * 2];
        const m2 = matches?.[i * 2 + 1];
        const active = (m1?.winner || m2?.winner);
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

// ---- Team Modal with match history ----
function TeamModal({ team, teams, bracket, lang, onClose }) {
  if (!team) return null;
  const color = getTeamColor(teams, team.id);
  const sections = [...(bracket?.winners || []), ...(bracket?.losers || []), ...(bracket?.grandFinal ? [bracket.grandFinal] : [])];
  const matchHistory = [];
  for (const round of sections) {
    for (const match of round.matches) {
      if (match.t1 === team.id || match.t2 === team.id) {
        const opponent = match.t1 === team.id ? match.t2 : match.t1;
        matchHistory.push({
          matchId: match.id, roundName: round.name, opponent,
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
            <div className="team-avatar" style={{ borderColor: color, background: `${color}20` }}>{team.avatar || '⚔️'}</div>
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
              <button
                onClick={() => !voted && onVote(match.id, match.t1)}
                disabled={voted}
                className={`flex-1 p-2 rounded font-cinzel font-bold text-sm border transition-all ${voted ? 'opacity-60 cursor-default' : 'hover:border-gold2 cursor-pointer'}`}
                style={{ borderColor: getTeamColor(teams, match.t1), color: getTeamColor(teams, match.t1) }}
              >
                [{getTeamTag(teams, match.t1)}] {getTeamName(teams, match.t1)}
              </button>
              <span className="text-dim text-sm">vs</span>
              <button
                onClick={() => !voted && onVote(match.id, match.t2)}
                disabled={voted}
                className={`flex-1 p-2 rounded font-cinzel font-bold text-sm border transition-all ${voted ? 'opacity-60 cursor-default' : 'hover:border-gold2 cursor-pointer'}`}
                style={{ borderColor: getTeamColor(teams, match.t2), color: getTeamColor(teams, match.t2) }}
              >
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

// ---- Bracket View ----
function BracketView({ bracket, teams, onTeamClick, predictions, lang }) {
  if (!bracket) return null;
  const renderRoundWithConnectors = (rounds) => {
    const elements = [];
    rounds.forEach((round, ri) => {
      elements.push(
        <div key={round.id} className="bracket-round">
          <div className="text-xs text-dim text-center mb-1 font-semibold">{round.name}</div>
          {round.matches.map(match => (
            <MatchCard key={match.id} match={match} teams={teams} bestOf={round.bestOf} predictions={predictions} lang={lang}
              onClick={() => { const tm = teams.find(tm => tm.id === match.t1 || tm.id === match.t2); if (tm) onTeamClick(tm); }}
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
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h3 className="font-cinzel text-xl font-bold text-lolgreen mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-lolgreen"></span>{t(lang, 'winnersBracket')}
        </h3>
        <div className="bracket-container">{renderRoundWithConnectors(bracket.winners || [])}</div>
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
                  onClick={() => { const tm = teams.find(tm => tm.id === match.winner); if (tm) onTeamClick(tm); }}
                />
              ))}
            </div>
          </div>
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
              <div className="team-avatar" style={{ borderColor: color, background: `${color}20` }}>{team.avatar || '⚔️'}</div>
              <h3 className="font-cinzel text-lg font-bold" style={{ color }}>[{team.tag}] {team.name}</h3>
            </div>
            <div className="space-y-1">
              {(team.players || []).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-xs">{ROLE_ICONS[p.role] || '🎮'}</span>
                  <span className="text-dim w-14">{p.role}</span>
                  <span>{p.summonerName}</span>
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

// ---- Schedule ----
function ScheduleView({ schedule, teams, lang }) {
  return (
    <div className="space-y-2 stagger-children">
      {schedule.map(match => {
        const isLive = match.status === 'live';
        const status = match.winner ? t(lang, 'finished') : isLive ? 'LIVE' : (match.t1 && match.t2 ? t(lang, 'waiting') : 'TBD');
        const statusColor = match.winner ? '#3CB878' : isLive ? '#E84057' : (match.t1 && match.t2 ? '#1A9FD4' : '#5A6880');
        return (
          <div key={match.id} className={`card p-3 flex items-center justify-between flex-wrap gap-2 ${isLive ? 'border-lolred/50' : ''}`}>
            <div className="flex items-center gap-4">
              <span className="text-xs text-dim uppercase w-20 sm:w-24">{match.roundName}</span>
              <span className="font-cinzel font-bold" style={{ color: getTeamColor(teams, match.t1) }}>{getTeamTag(teams, match.t1)}</span>
              <span className="text-dim text-sm">vs</span>
              <span className="font-cinzel font-bold" style={{ color: getTeamColor(teams, match.t2) }}>{getTeamTag(teams, match.t2)}</span>
              {match.winner && <span className="text-sm text-dim">{match.wins[0]} - {match.wins[1]}</span>}
              {match.mvp && <span className="mvp-badge">MVP: {match.mvp}</span>}
            </div>
            <div className="flex items-center gap-3">
              {match.scheduledTime && <span className="text-sm text-dim">{new Date(match.scheduledTime).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
              <span className="text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1" style={{ color: statusColor, border: `1px solid ${statusColor}` }}>
                {isLive && <span className="live-dot"></span>}{status}
              </span>
            </div>
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

// ---- Main Page ----
export default function Home() {
  const [tab, setTab] = useState('bracket');
  const [data, setData] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState({ players: [], teams: [] });
  const [predictions, setPredictions] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [toast, setToast] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lang, setLang] = useState('pl');
  const [theme, setTheme] = useState('dark');
  const prevDataRef = useRef(null);

  // Init theme & lang from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') || 'pl';
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setLang(savedLang);
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const toggleLang = () => {
    const next = lang === 'pl' ? 'en' : 'pl';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  // Helper
  function getAllMatchesFromBracket(bracket) {
    if (!bracket) return [];
    const m = [];
    for (const s of ['winners', 'losers']) { if (bracket[s]) for (const r of bracket[s]) m.push(...r.matches); }
    if (bracket.grandFinal) m.push(...bracket.grandFinal.matches);
    return m;
  }

  // SSE
  useEffect(() => {
    let es;
    const connect = () => {
      es = new EventSource('/api/sse');
      es.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          if (prevDataRef.current) {
            const oldM = getAllMatchesFromBracket(prevDataRef.current.bracket);
            const newM = getAllMatchesFromBracket(newData.bracket);
            for (const nm of newM) {
              const om = oldM.find(m => m.id === nm.id);
              if (om && !om.winner && nm.winner) {
                playNotificationSound();
                const winnerTeam = newData.teams.find(t => t.id === nm.winner);
                setToast({ message: `${winnerTeam?.name || ''} ${t(lang, 'winsMatch')}`, type: 'success', key: Date.now() });
                // Grand Final winner = confetti
                if (nm.id.startsWith('gf')) setShowConfetti(true);
                break;
              }
            }
          }
          prevDataRef.current = newData;
          setData(newData);
        } catch {}
      };
      es.onerror = () => { es.close(); setTimeout(connect, 5000); };
    };
    connect();
    return () => es?.close();
  }, [lang]);

  // Fetch extra data
  const fetchExtra = useCallback(async () => {
    try {
      const [schedRes, statsRes, predRes] = await Promise.all([
        fetch('/api/schedule'), fetch('/api/stats'), fetch('/api/predictions'),
      ]);
      if (schedRes.ok) setSchedule(await schedRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (predRes.ok) setPredictions(await predRes.json());
    } catch {}
  }, []);

  useEffect(() => { fetchExtra(); const i = setInterval(fetchExtra, 30000); return () => clearInterval(i); }, [fetchExtra]);
  useEffect(() => { if (tab === 'schedule' || tab === 'stats' || tab === 'predictions') fetchExtra(); }, [tab, fetchExtra]);

  // Vote
  const vote = async (matchId, teamId) => {
    const r = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, teamId }),
    });
    if (r.ok) {
      setToast({ message: t(lang, 'voted') + '!', type: 'success', key: Date.now() });
      fetchExtra();
    }
  };

  // Confetti timeout
  useEffect(() => {
    if (showConfetti) { const tm = setTimeout(() => setShowConfetti(false), 4000); return () => clearTimeout(tm); }
  }, [showConfetti]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Particles />
        <div className="text-gold2 font-cinzel text-2xl animate-pulse relative z-10">{t(lang, 'loadingTournament')}</div>
      </div>
    );
  }

  const tabs = [
    { id: 'bracket', label: t(lang, 'bracket') },
    { id: 'teams', label: t(lang, 'teams') },
    { id: 'schedule', label: t(lang, 'schedule') },
    { id: 'stats', label: t(lang, 'stats') },
    { id: 'predictions', label: t(lang, 'predictions') },
  ];

  return (
    <div className="min-h-screen relative">
      <Particles />
      {showConfetti && <Confetti />}

      <header className="border-b border-border bg-bg2 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-black text-gold2 tracking-wide">{data.tournamentName}</h1>
            <p className="text-dim text-sm mt-1">{t(lang, 'tournamentSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="btn-secondary text-xs px-2 py-1">{lang === 'pl' ? 'EN' : 'PL'}</button>
            <button onClick={toggleTheme} className="theme-toggle" title={t(lang, theme === 'dark' ? 'lightMode' : 'darkMode')}></button>
            <a href="/admin" className="btn-secondary text-sm">{t(lang, 'adminPanel')}</a>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-bg2/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-4 sm:gap-6 overflow-x-auto">
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`py-3 px-1 text-sm font-semibold transition-colors whitespace-nowrap ${tab === tb.id ? 'tab-active' : 'tab-inactive'}`}
            >{tb.label}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {tab === 'bracket' && <BracketView bracket={data.bracket} teams={data.teams} onTeamClick={setSelectedTeam} predictions={predictions} lang={lang} />}
        {tab === 'teams' && <TeamsGrid teams={data.teams} onTeamClick={setSelectedTeam} lang={lang} />}
        {tab === 'schedule' && <ScheduleView schedule={schedule} teams={data.teams} lang={lang} />}
        {tab === 'stats' && <StatsView stats={stats} lang={lang} />}
        {tab === 'predictions' && <PredictionsPanel bracket={data.bracket} teams={data.teams} predictions={predictions} onVote={vote} lang={lang} />}
      </main>

      {selectedTeam && <TeamModal team={selectedTeam} teams={data.teams} bracket={data.bracket} lang={lang} onClose={() => setSelectedTeam(null)} />}
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
