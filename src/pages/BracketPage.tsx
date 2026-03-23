import { Link, useParams } from 'react-router-dom';
import { getRoundMatches } from '../lib/tournament';
import { useArena } from '../state/ArenaContext';

function matchStatusCopy(status: string) {
  if (status === 'completed') {
    return 'Completed';
  }
  if (status === 'forfeit') {
    return 'Forfeit';
  }
  if (status === 'ready') {
    return 'Ready';
  }
  return 'Pending';
}

export function BracketPage() {
  const { tournamentId } = useParams();
  const { getTournamentById, getBot } = useArena();
  const tournament = tournamentId ? getTournamentById(tournamentId) : undefined;

  if (!tournament) {
    return (
      <section className="panel">
        <h1>Tournament not found</h1>
      </section>
    );
  }

  const rounds = getRoundMatches(tournament);

  return (
    <div className="stack">
      <section className="hero hero--compact">
        <div className="hero__copy">
          <p className="eyebrow">Tournament Bracket</p>
          <h1>{tournament.name}</h1>
          <p>
            {tournament.participantBotIds.length} bots · {tournament.configuredRounds} rounds per matchup · status:{' '}
            {tournament.status}
          </p>
        </div>
        <div className="hero__actions">
          <Link className="ghost-button" to="/tournaments/new">
            New tournament
          </Link>
          <Link className="primary-button" to={`/tournaments/${tournament.id}/results`}>
            View results
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Bracket</p>
            <h2>Manual match progression</h2>
          </div>
        </div>
        <div className="bracket-grid">
          {rounds.map((round) => (
            <section key={round.roundNumber} className="bracket-round">
              <header className="bracket-round__header">
                <p className="eyebrow">Round {round.roundNumber}</p>
                <h3>{round.roundNumber === rounds.length ? 'Final' : `Matches ${round.matches.length}`}</h3>
              </header>
              <div className="bracket-round__matches">
                {round.matches.map((match) => {
                  const botA = match.botAId ? getBot(match.botAId) : undefined;
                  const botB = match.botBId ? getBot(match.botBId) : undefined;
                  const canOpen = Boolean(match.botAId && match.botBId);

                  return (
                    <article key={match.id} className="bracket-match">
                      <div className="bracket-match__topline">
                        <span className={`status-badge status-badge--${match.status}`}>{matchStatusCopy(match.status)}</span>
                        {match.completionReason === 'bye' ? <span className="mini-note">Bye advance</span> : null}
                      </div>
                      <div className="bracket-match__slot">
                        <strong>{botA?.name ?? 'TBD'}</strong>
                        <span>{match.winnerBotId === match.botAId ? 'Winner' : ''}</span>
                      </div>
                      <div className="bracket-match__slot">
                        <strong>{botB?.name ?? (match.completionReason === 'bye' ? 'Bye' : 'TBD')}</strong>
                        <span>{match.winnerBotId === match.botBId ? 'Winner' : ''}</span>
                      </div>
                      <p className="mini-note">
                        {match.summary.aWins}-{match.summary.draws}-{match.summary.bWins}
                      </p>
                      {canOpen ? (
                        <Link className="inline-link" to={`/tournaments/${tournament.id}/matches/${match.id}`}>
                          {match.status === 'ready' ? 'Run matchup' : 'Open matchup'}
                        </Link>
                      ) : (
                        <span className="mini-note">Waiting for upstream result</span>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
