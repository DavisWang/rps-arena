import { Link } from 'react-router-dom';
import { formatDateTime } from '../lib/formatters';
import { useArena } from '../state/ArenaContext';

export function HomePage() {
  const { bots, tournaments, quickMatches, customBots, loading, getBot } = useArena();

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Static GitHub Pages Arena</p>
          <h1>Run bot duels, build brackets, and inspect every RPS result live.</h1>
          <p>
            Seeded bots ship out of the box. Custom bots import from local JSON. Every matchup runs in-browser and
            every tournament state resumes from IndexedDB.
          </p>
          <div className="hero__actions">
            <Link className="primary-button" to="/quick-match">
              Start quick match
            </Link>
            <Link className="ghost-button" to="/tournaments/new">
              Build tournament
            </Link>
          </div>
        </div>
        <div className="hero__stats">
          <article className="metric-card">
            <p>Available bots</p>
            <strong>{bots.length}</strong>
          </article>
          <article className="metric-card">
            <p>Custom imports</p>
            <strong>{customBots.length}</strong>
          </article>
          <article className="metric-card">
            <p>Saved tournaments</p>
            <strong>{tournaments.length}</strong>
          </article>
          <article className="metric-card">
            <p>Quick match sessions</p>
            <strong>{quickMatches.length}</strong>
          </article>
        </div>
      </section>

      <section className="card-grid">
        <Link to="/quick-match" className="action-card">
          <p className="eyebrow">Mode 1</p>
          <h2>Quick Match</h2>
          <p>Pick any two bots, set the round count, and watch the aggregate result update live.</p>
        </Link>
        <Link to="/tournaments/new" className="action-card">
          <p className="eyebrow">Mode 2</p>
          <h2>Tournament</h2>
          <p>Create a single-elimination bracket with byes, manual match control, and final standings.</p>
        </Link>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Bot Library</p>
            <h2>Available bots</h2>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Bot</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {bots.map((bot) => (
              <tr key={bot.id}>
                <td>{bot.name}</td>
                <td>{bot.isSeeded ? 'Seeded' : 'Imported'}</td>
                <td>{bot.description || 'No description provided.'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Recent tournaments</p>
            <h2>Saved brackets</h2>
          </div>
        </div>
        {loading ? (
          <p className="empty-state">Loading saved tournaments…</p>
        ) : tournaments.length === 0 ? (
          <p className="empty-state">No tournaments yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Bots</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.slice(0, 6).map((tournament) => (
                <tr key={tournament.id}>
                  <td>{tournament.name}</td>
                  <td>{tournament.participantBotIds.length}</td>
                  <td>{tournament.status}</td>
                  <td>{formatDateTime(tournament.updatedAt)}</td>
                  <td>
                    <Link className="inline-link" to={`/tournaments/${tournament.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Recent quick matches</p>
            <h2>Last simulations</h2>
          </div>
        </div>
        {quickMatches.length === 0 ? (
          <p className="empty-state">No quick matches yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Matchup</th>
                <th>Rounds</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quickMatches.slice(0, 6).map((session) => (
                <tr key={session.id}>
                  <td>
                    {getBot(session.botAId)?.name} vs {getBot(session.botBId)?.name}
                  </td>
                  <td>{session.configuredRounds}</td>
                  <td>{session.record.status}</td>
                  <td>{formatDateTime(session.updatedAt)}</td>
                  <td>
                    <Link className="inline-link" to={`/matchups/quick/${session.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
