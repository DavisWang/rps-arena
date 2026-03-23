import { useState } from 'react';
import { customBotTemplate } from '../lib/botImport';
import { useArena } from '../state/ArenaContext';
import { BotAvatar } from './BotAvatar';

export function BotImportPanel() {
  const { customBots, importBotFromText, removeCustomBot } = useArena();
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  async function readFileAsText(file: File) {
    if (typeof file.text === 'function') {
      return file.text();
    }

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }

  async function handleImport(file: File | null) {
    if (!file) {
      return;
    }

    setBusy(true);
    setError('');
    setFeedback('');

    try {
      const text = await readFileAsText(file);
      const bot = await importBotFromText(text);
      setFeedback(`${bot.name} is ready for matches.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Bot import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Custom Bots</p>
          <h2>Import trusted local bot JSON</h2>
        </div>
        <label className={`upload-button${busy ? ' upload-button--busy' : ''}`}>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImport(event.target.files?.[0] ?? null)}
            disabled={busy}
          />
          {busy ? 'Importing…' : 'Choose JSON'}
        </label>
      </div>
      <p className="panel__copy">
        Imported bots run locally in-browser. Use only scripts you trust.
      </p>
      {feedback ? <p className="feedback feedback--success">{feedback}</p> : null}
      {error ? <p className="feedback feedback--error">{error}</p> : null}
      <div className="template-block">
        <p className="template-block__title">Template</p>
        <pre>{customBotTemplate}</pre>
      </div>
      <div className="bot-library">
        <div className="panel__subheader">
          <h3>Imported Library</h3>
          <span>{customBots.length} custom bots</span>
        </div>
        {customBots.length === 0 ? (
          <p className="empty-state compact">
            No custom bots yet. Import one to make it available everywhere in the arena.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Bot</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customBots.map((bot) => (
                <tr key={bot.id}>
                  <td>
                    <div className="bot-cell">
                      <BotAvatar bot={bot} size="small" />
                      <div>
                        <strong>{bot.name}</strong>
                        <span>{bot.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{bot.description || 'No description provided.'}</td>
                  <td>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => void removeCustomBot(bot.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
