import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotAvatar } from '../components/BotAvatar';
import { BotImportPanel } from '../components/BotImportPanel';
import { useArena } from '../state/ArenaContext';

export function TournamentSetupPage() {
  const { bots, createTournament } = useArena();
  const navigate = useNavigate();
  const [selectedBotIds, setSelectedBotIds] = useState<string[]>([]);
  const [configuredRounds, setConfiguredRounds] = useState(101);
  const [name, setName] = useState('Main Event');
  const [error, setError] = useState('');

  useEffect(() => {
    if (bots.length >= 4 && selectedBotIds.length === 0) {
      setSelectedBotIds(bots.slice(0, 4).map((bot) => bot.id));
    }
  }, [bots, selectedBotIds.length]);

  function toggleBot(botId: string) {
    setSelectedBotIds((current) =>
      current.includes(botId) ? current.filter((id) => id !== botId) : [...current, botId]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (selectedBotIds.length < 2) {
      setError('Select at least two bots.');
      return;
    }

    const tournament = await createTournament({
      name: name.trim() || 'Main Event',
      participantBotIds: selectedBotIds,
      configuredRounds
    });

    void navigate(`/tournaments/${tournament.id}`);
  }

  return (
    <div className="split-layout">
      <div className="stack">
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Tournament Setup</p>
              <h1>Build a single-elimination bracket</h1>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Tournament name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Main Event" />
            </label>
            <label>
              <span>Rounds per matchup</span>
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
                Create bracket
              </button>
            </div>
          </form>
          {error ? <p className="feedback feedback--error">{error}</p> : null}
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Entrants</p>
              <h2>Select bots</h2>
            </div>
            <div className="selected-counter">{selectedBotIds.length} selected</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Order</th>
                <th>Bot</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {bots.map((bot) => {
                const selectionIndex = selectedBotIds.indexOf(bot.id);
                return (
                  <tr key={bot.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectionIndex >= 0}
                        onChange={() => toggleBot(bot.id)}
                        aria-label={`Select ${bot.name}`}
                      />
                    </td>
                    <td>{selectionIndex >= 0 ? selectionIndex + 1 : '—'}</td>
                    <td>
                      <div className="bot-cell">
                        <BotAvatar bot={bot} size="small" />
                        <div>
                          <strong>{bot.name}</strong>
                          <span>{bot.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{bot.isSeeded ? 'Seeded' : 'Imported'}</td>
                    <td>{bot.description || 'No description provided.'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
      <BotImportPanel />
    </div>
  );
}
