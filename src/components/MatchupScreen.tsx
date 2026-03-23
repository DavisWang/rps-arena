import { Link } from 'react-router-dom';
import { formatDateTime } from '../lib/formatters';
import { BotAvatar } from './BotAvatar';
import type { BotManifest, MatchSnapshot } from '../types';

function outcomeLabel(snapshot: MatchSnapshot, botA: BotManifest, botB: BotManifest) {
  if (snapshot.status === 'forfeit') {
    if (snapshot.winnerBotId === botA.id) {
      return `${botA.name} advances by technical forfeit`;
    }

    if (snapshot.winnerBotId === botB.id) {
      return `${botB.name} advances by technical forfeit`;
    }

    return 'Match failed';
  }

  if (snapshot.status === 'completed') {
    if (!snapshot.winnerBotId) {
      return 'Series drawn';
    }

    return snapshot.winnerBotId === botA.id ? `${botA.name} wins the series` : `${botB.name} wins the series`;
  }

  if (snapshot.status === 'in_progress') {
    return 'Simulation running';
  }

  return 'Ready to simulate';
}

function statusLabel(snapshot: MatchSnapshot) {
  switch (snapshot.status) {
    case 'completed':
      return snapshot.completionReason === 'bye' ? 'Bye advance' : 'Completed';
    case 'forfeit':
      return 'Forfeit';
    case 'in_progress':
      return 'Live';
    case 'ready':
      return 'Ready';
    default:
      return 'Pending';
  }
}

export function MatchupScreen(props: {
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  botA: BotManifest;
  botB: BotManifest;
  snapshot: MatchSnapshot;
  onStart(): void;
  running: boolean;
  asideLink?: { to: string; label: string };
}) {
  const { title, subtitle, backHref, backLabel, botA, botB, snapshot, onStart, running, asideLink } = props;
  const primaryButtonLabel =
    snapshot.status === 'completed' || snapshot.status === 'forfeit' ? 'Replay matchup' : 'Start matchup';

  return (
    <div className="stack">
      <section className="hero hero--compact">
        <div className="hero__copy">
          <p className="eyebrow">{title}</p>
          <h1>{outcomeLabel(snapshot, botA, botB)}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="hero__actions">
          <Link className="ghost-button" to={backHref}>
            {backLabel}
          </Link>
          {asideLink ? (
            <Link className="ghost-button" to={asideLink.to}>
              {asideLink.label}
            </Link>
          ) : null}
          <button type="button" className="primary-button" onClick={onStart} disabled={running}>
            {running ? 'Simulating…' : primaryButtonLabel}
          </button>
        </div>
      </section>

      <section className="match-banner">
        <article className="combatant-card">
          <BotAvatar bot={botA} size="large" />
          <div>
            <p className="eyebrow">Bot A</p>
            <h2>{botA.name}</h2>
            <p>{botA.description || 'No description provided.'}</p>
          </div>
        </article>
        <div className="match-banner__center">
          <span className={`status-badge status-badge--${snapshot.status}`}>{statusLabel(snapshot)}</span>
          <div className="score-core">
            <strong>{snapshot.summary.aWins}</strong>
            <span>Wins</span>
            <b>:</b>
            <strong>{snapshot.summary.bWins}</strong>
            <span>Wins</span>
          </div>
          <p className="match-banner__meta">
            {snapshot.currentRound} rounds logged · {snapshot.summary.draws} draws · {snapshot.summary.suddenDeathRounds} sudden-death rounds
          </p>
        </div>
        <article className="combatant-card combatant-card--reverse">
          <div>
            <p className="eyebrow">Bot B</p>
            <h2>{botB.name}</h2>
            <p>{botB.description || 'No description provided.'}</p>
          </div>
          <BotAvatar bot={botB} size="large" />
        </article>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <p>Configured rounds</p>
          <strong>{snapshot.configuredRounds}</strong>
        </article>
        <article className="metric-card">
          <p>Draws</p>
          <strong>{snapshot.summary.draws}</strong>
        </article>
        <article className="metric-card">
          <p>Sudden death</p>
          <strong>{snapshot.summary.suddenDeathRounds}</strong>
        </article>
        <article className="metric-card">
          <p>Last update</p>
          <strong>{formatDateTime(snapshot.updatedAt)}</strong>
        </article>
      </section>

      {snapshot.errorMessage ? <p className="feedback feedback--error">{snapshot.errorMessage}</p> : null}

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Recent Rounds</p>
            <h2>Live round log</h2>
          </div>
        </div>
        {snapshot.recentRounds.length === 0 ? (
          <p className="empty-state">No rounds recorded yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>{botA.name}</th>
                <th>{botB.name}</th>
                <th>Outcome</th>
                <th>Phase</th>
              </tr>
            </thead>
            <tbody>
              {[...snapshot.recentRounds].reverse().map((round) => (
                <tr key={`${round.roundIndex}-${round.botAMove}-${round.botBMove}`}>
                  <td>{round.roundIndex + 1}</td>
                  <td>{round.botAMove}</td>
                  <td>{round.botBMove}</td>
                  <td>
                    {round.outcome === 'a_win'
                      ? botA.name
                      : round.outcome === 'b_win'
                        ? botB.name
                        : 'Draw'}
                  </td>
                  <td>{round.isSuddenDeath ? 'Sudden death' : 'Main set'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
