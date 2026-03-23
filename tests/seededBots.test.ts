import { describe, expect, it } from 'vitest';
import { seededBots } from '../src/data/seededBots';
import type { BotExecutionContext, Move } from '../src/types';

async function loadDecider(source: string) {
  const module = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
  return module.decide as (context: BotExecutionContext) => Move;
}

function baseContext(overrides: Partial<BotExecutionContext> = {}): BotExecutionContext {
  return {
    roundIndex: 0,
    configuredRounds: 10,
    isSuddenDeath: false,
    selfHistory: [],
    opponentHistory: [],
    previousRound: null,
    ...overrides
  };
}

describe('seeded bots', () => {
  it('PiBot uses pi digits modulo 3', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'pibot')!.source);
    expect(decide(baseContext({ roundIndex: 0 }))).toBe('rock');
    expect(decide(baseContext({ roundIndex: 1 }))).toBe('paper');
    expect(decide(baseContext({ roundIndex: 2 }))).toBe('paper');
  });

  it('Copycat opens with rock then mirrors the opponent', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'copycat')!.source);
    expect(decide(baseContext())).toBe('rock');
    expect(decide(baseContext({ opponentHistory: ['scissors'] }))).toBe('scissors');
  });

  it('PatternMatcher counters a repeated suffix pattern', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'pattern-matcher')!.source);
    expect(
      decide(
        baseContext({
          roundIndex: 4,
          opponentHistory: ['rock', 'paper', 'rock', 'paper']
        })
      )
    ).toBe('paper');
  });

  it('Dummybot cycles rock paper scissors', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'dummybot')!.source);
    expect(decide(baseContext({ roundIndex: 0 }))).toBe('rock');
    expect(decide(baseContext({ roundIndex: 1 }))).toBe('paper');
    expect(decide(baseContext({ roundIndex: 2 }))).toBe('scissors');
    expect(decide(baseContext({ roundIndex: 3 }))).toBe('rock');
  });
});
