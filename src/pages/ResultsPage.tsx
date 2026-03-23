import { Link, useParams } from 'react-router-dom';
import { formatPercent } from '../lib/formatters';
import { getTournamentResults } from '../lib/tournament';
import { useArena } from '../state/ArenaContext';

export function ResultsPage() {
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

  const results = getTournamentResults(tournament);
  const champion = results.championBotId ? getBot(results.championBotId) : undefined;

  return (
    <div className="stack">
      <section className="hero hero--compact">
        <div className="hero__copy">
          <p className="eyebrow">Tournament Results</p>
          <h1>{champion ? `${champion.name} is the arena champion` : 'Tournament standings'}</h1>
          <p>Aggregate round-level performance and advancement data for every entrant.</p>
        </div>
        <div className="hero__actions">
          <Link className="ghost-button" to={`/tournaments/${tournament.id}`}>
            Back to bracket
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Standings</p>
            <h2>{tournament.name}</h2>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Bot</th>
              <th>Placement</th>
              <th>Match W-L</th>
              <th>Round W-L-D</th>
              <th>Win rate</th>
              <th>Draw rate</th>
              <th>Sudden death</th>
              <th>Forfeits</th>
              <th>Byes</th>
            </tr>
          </thead>
          <tbody>
            {results.standings.map((entry) => (
              <tr key={entry.botId}>
                <td>{getBot(entry.botId)?.name ?? entry.botId}</td>
                <td>{entry.placementLabel}</td>
                <td>
                  {entry.matchesWon}-{entry.matchesLost}
                </td>
                <td>
                  {entry.roundWins}-{entry.roundLosses}-{entry.roundDraws}
                </td>
                <td>{formatPercent(entry.winRate)}</td>
                <td>{formatPercent(entry.drawRate)}</td>
                <td>{entry.suddenDeathRounds}</td>
                <td>{entry.technicalForfeits}</td>
                <td>{entry.byeAdvances}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
