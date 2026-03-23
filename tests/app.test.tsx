import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, expect, it } from 'vitest';

vi.mock('../src/lib/matchRunnerClient', () => ({
  runMatchInWorker(request: any, handlers: any) {
    const inProgress = {
      id: request.matchId,
      botAId: request.botA.id,
      botBId: request.botB.id,
      configuredRounds: request.configuredRounds,
      status: 'in_progress',
      summary: { aWins: 2, bWins: 1, draws: 0, suddenDeathRounds: 0 },
      currentRound: 3,
      recentRounds: [
        { roundIndex: 0, botAMove: 'rock', botBMove: 'scissors', outcome: 'a_win', isSuddenDeath: false },
        { roundIndex: 1, botAMove: 'paper', botBMove: 'paper', outcome: 'draw', isSuddenDeath: false },
        { roundIndex: 2, botAMove: 'scissors', botBMove: 'paper', outcome: 'a_win', isSuddenDeath: false }
      ],
      updatedAt: Date.now(),
      completionReason: 'played'
    };

    handlers.onProgress(inProgress);
    handlers.onComplete({
      ...inProgress,
      status: 'completed',
      winnerBotId: request.botA.id,
      updatedAt: Date.now(),
      completedAt: Date.now()
    });

    return () => undefined;
  }
}));

import { App } from '../src/App';
import { ArenaProvider } from '../src/state/ArenaContext';

function renderApp(hash = '#/') {
  window.location.hash = hash;
  return render(
    <ArenaProvider>
      <App />
    </ArenaProvider>
  );
}

describe('app flows', () => {
  it('runs a quick match through the shared matchup screen', async () => {
    const user = userEvent.setup();
    renderApp('#/quick-match');

    await screen.findByText(/Configure a head-to-head simulation/i);
    await user.click(screen.getByRole('button', { name: /Open matchup/i }));
    await screen.findByText(/Ready to simulate/i);
    await user.click(screen.getByRole('button', { name: /Start matchup/i }));

    await screen.findByText(/wins the series/i);
    expect(screen.getByText(/Live round log/i)).toBeInTheDocument();
  });

  it('imports a custom bot, creates a 5-bot tournament, and reloads saved bracket state', async () => {
    const user = userEvent.setup();
    const uploadedBot = {
      id: 'strategy-fox',
      name: 'StrategyFox',
      description: 'Imported test bot',
      source: "export function decide() { return 'rock'; }"
    };

    const view = renderApp('#/tournaments/new');
    await screen.findByText(/Build a single-elimination bracket/i);

    const fileInput = screen.getByLabelText(/Choose JSON/i);
    await user.upload(
      fileInput,
      new File([JSON.stringify(uploadedBot)], 'strategy-fox.json', { type: 'application/json' })
    );

    await screen.findByText(/StrategyFox is ready for matches/i);
    await waitFor(() => {
      expect(screen.getByLabelText(/Select StrategyFox/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/Select StrategyFox/i));
    await user.click(screen.getByRole('button', { name: /Create bracket/i }));

    await screen.findByRole('heading', { name: /Main Event/i });
    expect(screen.getAllByText(/Bye advance/i).length).toBeGreaterThan(0);

    const runLinks = screen.getAllByRole('link', { name: /Run matchup/i });
    await user.click(runLinks[0]);
    await screen.findByText(/winner advances to the next round/i);
    await user.click(screen.getByRole('button', { name: /Start matchup/i }));
    await screen.findByText(/wins the series/i);
    await user.click(screen.getByRole('link', { name: /Back to bracket/i }));

    await screen.findByRole('heading', { name: /Main Event/i });
    const currentHash = window.location.hash;

    view.unmount();
    renderApp(currentHash);

    await screen.findByRole('heading', { name: /Main Event/i });
    await waitFor(() => {
      expect(screen.getAllByText(/Bye advance/i).length).toBeGreaterThan(0);
    });
  });
});
