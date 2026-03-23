import { describe, expect, it } from 'vitest';
import { createTournamentRecord, findTournamentMatch, getRoundMatches, getTournamentResults, nextPowerOfTwo, updateTournamentMatch } from '../src/lib/tournament';
import { createEmptySummary } from '../src/lib/moves';
import type { MatchSnapshot, TournamentMatch } from '../src/types';

function completedSnapshot(match: TournamentMatch, winnerBotId: string, summary: MatchSnapshot['summary']): MatchSnapshot {
  return {
    ...match,
    status: 'completed',
    winnerBotId,
    summary,
    currentRound: summary.aWins + summary.bWins + summary.draws,
    recentRounds: [],
    updatedAt: Date.now(),
    completedAt: Date.now(),
    completionReason: 'played'
  };
}

describe('tournament logic', () => {
  it('computes the next power of two', () => {
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(8)).toBe(8);
  });

  it('creates byes for non-power-of-two tournaments and advances winners downstream', () => {
    const tournament = createTournamentRecord({
      name: 'Five Bot Cup',
      participantBotIds: ['a', 'b', 'c', 'd', 'e'],
      configuredRounds: 11
    });

    const rounds = getRoundMatches(tournament);
    expect(rounds[0].matches).toHaveLength(4);
    expect(rounds[0].matches.filter((match) => match.completionReason === 'bye')).toHaveLength(3);
    expect(rounds[0].matches.filter((match) => match.status === 'ready')).toHaveLength(1);

    const readyMatch = rounds[0].matches.find((match) => match.status === 'ready')!;
    const updated = updateTournamentMatch(
      tournament,
      readyMatch.id,
      completedSnapshot(readyMatch, readyMatch.botAId, {
        aWins: 7,
        bWins: 2,
        draws: 2,
        suddenDeathRounds: 0
      })
    );

    const nextRound = getRoundMatches(updated)[1].matches;
    expect(nextRound.some((match) => match.status === 'ready')).toBe(true);
  });

  it('aggregates standings and champion data', () => {
    let tournament = createTournamentRecord({
      name: 'Final Four',
      participantBotIds: ['alpha', 'beta', 'gamma', 'delta'],
      configuredRounds: 9
    });

    const semiA = findTournamentMatch(tournament, tournament.bracket[0].id)!;
    const semiB = findTournamentMatch(tournament, tournament.bracket[1].id)!;

    tournament = updateTournamentMatch(
      tournament,
      semiA.id,
      completedSnapshot(semiA, semiA.botAId, {
        aWins: 5,
        bWins: 2,
        draws: 2,
        suddenDeathRounds: 0
      })
    );

    tournament = updateTournamentMatch(
      tournament,
      semiB.id,
      completedSnapshot(semiB, semiB.botBId, {
        aWins: 3,
        bWins: 4,
        draws: 2,
        suddenDeathRounds: 1
      })
    );

    const finalMatch = getRoundMatches(tournament)[1].matches[0];
    tournament = updateTournamentMatch(
      tournament,
      finalMatch.id,
      completedSnapshot(finalMatch, finalMatch.botAId, {
        aWins: 6,
        bWins: 1,
        draws: 2,
        suddenDeathRounds: 0
      })
    );

    const results = getTournamentResults(tournament);
    const champion = results.standings[0];
    const finalist = results.standings.find((entry) => entry.placementLabel === 'Finalist');

    expect(tournament.championBotId).toBeDefined();
    expect(champion.placementLabel).toBe('Champion');
    expect(finalist).toBeDefined();
    expect(champion.matchesWon).toBe(2);
  });
});
