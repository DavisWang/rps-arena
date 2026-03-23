import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatDateTime } from '../lib/formatters';
import { useArena } from '../state/ArenaContext';
import { BotImportPanel } from '../components/BotImportPanel';

export function QuickMatchPage() {
  const { bots, quickMatches, createQuickMatchSession, getBot } = useArena();
  const navigate = useNavigate();
  const [botAId, setBotAId] = useState('');
  const [botBId, setBotBId] = useState('');
  const [configuredRounds, setConfiguredRounds] = useState(200);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bots.length >= 2 && !botAId && !botBId) {
      setBotAId(bots[0].id);
      setBotBId(bots[1].id);
    }
  }, [bots, botAId, botBId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!botAId || !botBId) {
      setError('Choose two bots before starting.');
      return;
    }

    if (botAId === botBId) {
      setError('Choose two different bots.');
      return;
    }

    const session = await createQuickMatchSession({
      botAId,
      botBId,
      configuredRounds
    });

    void navigate(`/matchups/quick/${session.id}`);
  }

  return (
    <div className="split-layout">
      <div className="stack">
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Quick Match</p>
              <h1>Configure a head-to-head simulation</h1>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Bot A</span>
              <select value={botAId} onChange={(event) => setBotAId(event.target.value)}>
                {bots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Bot B</span>
              <select value={botBId} onChange={(event) => setBotBId(event.target.value)}>
                {bots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Rounds</span>
              <input
                type="number"
                min={1}
                max={5000}
                value={configuredRounds}
                onChange={(event) => setConfiguredRounds(Number(event.target.value))}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button">
                Open matchup
              </button>
            </div>
          </form>
          {error ? <p className="feedback feedback--error">{error}</p> : null}
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Recent sessions</p>
              <h2>Quick match history</h2>
            </div>
          </div>
          {quickMatches.length === 0 ? (
            <p className="empty-state">No quick matches saved yet.</p>
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
                {quickMatches.slice(0, 8).map((session) => (
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
      <BotImportPanel />
    </div>
  );
}
