import { describe, expect, it } from 'vitest';
import { counterMove, createEmptySummary, resolveRoundOutcome, updateSummary } from '../src/lib/moves';

describe('move helpers', () => {
  it('resolves round winners correctly', () => {
    expect(resolveRoundOutcome('rock', 'scissors')).toBe('a_win');
    expect(resolveRoundOutcome('paper', 'scissors')).toBe('b_win');
    expect(resolveRoundOutcome('rock', 'rock')).toBe('draw');
  });

  it('returns the correct counter move', () => {
    expect(counterMove('rock')).toBe('paper');
    expect(counterMove('paper')).toBe('scissors');
    expect(counterMove('scissors')).toBe('rock');
  });

  it('tracks summary totals including sudden death', () => {
    const summary = createEmptySummary();
    updateSummary(summary, 'a_win', false);
    updateSummary(summary, 'draw', false);
    updateSummary(summary, 'b_win', true);

    expect(summary).toEqual({
      aWins: 1,
      bWins: 1,
      draws: 1,
      suddenDeathRounds: 1
    });
  });
});
