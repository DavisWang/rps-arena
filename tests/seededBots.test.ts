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
  it('ships 16 deterministic seeded bots with loadable decide functions', async () => {
    expect(seededBots).toHaveLength(16);

    for (const bot of seededBots) {
      expect(bot.source).not.toMatch(/Math\.random|crypto\.getRandomValues/i);
      const decide = await loadDecider(bot.source);
      expect(typeof decide).toBe('function');
    }
  });

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

  it('ReverseCopycat opens with paper and counters the opponent’s last move', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'reverse-copycat')!.source);
    expect(decide(baseContext())).toBe('paper');
    expect(decide(baseContext({ opponentHistory: ['rock'] }))).toBe('paper');
    expect(decide(baseContext({ opponentHistory: ['paper'] }))).toBe('scissors');
  });

  it('GrudgeBot enters revenge mode after consecutive losses', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'grudgebot')!.source);
    expect(
      decide(
        baseContext({
          roundIndex: 2,
          selfHistory: ['rock', 'rock'],
          opponentHistory: ['paper', 'paper']
        })
      )
    ).toBe('scissors');
  });

  it('TrapSetter follows its bait pattern and punish rounds', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'trap-setter')!.source);
    expect(decide(baseContext({ roundIndex: 0 }))).toBe('rock');
    expect(decide(baseContext({ roundIndex: 3 }))).toBe('paper');
    expect(decide(baseContext({ roundIndex: 4 }))).toBe('scissors');
    expect(decide(baseContext({ roundIndex: 5, opponentHistory: ['rock'] }))).toBe('paper');
  });

  it('StubbornBot holds each move for five rounds', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'stubbornbot')!.source);
    expect(decide(baseContext({ roundIndex: 0 }))).toBe('rock');
    expect(decide(baseContext({ roundIndex: 4 }))).toBe('rock');
    expect(decide(baseContext({ roundIndex: 5 }))).toBe('paper');
    expect(decide(baseContext({ roundIndex: 10 }))).toBe('scissors');
  });

  it('ChaosClock changes strategy by round window', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'chaos-clock')!.source);
    expect(decide(baseContext({ roundIndex: 0 }))).toBe('rock');
    expect(decide(baseContext({ roundIndex: 4 }))).toBe('rock');
    expect(decide(baseContext({ roundIndex: 7, opponentHistory: ['rock'] }))).toBe('paper');
    expect(
      decide(
        baseContext({
          roundIndex: 10,
          selfHistory: ['paper'],
          opponentHistory: ['paper'],
          previousRound: {
            roundIndex: 9,
            botAMove: 'paper',
            botBMove: 'paper',
            outcome: 'draw',
            isSuddenDeath: false
          }
        })
      )
    ).toBe('scissors');
  });

  it('FrequencyAnalyst counters the opponent’s most common move', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'frequency-analyst')!.source);
    expect(decide(baseContext({ opponentHistory: ['rock', 'rock', 'paper'] }))).toBe('paper');
  });

  it('MarkovBot uses transition tendencies after the opponent’s last move', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'markovbot')!.source);
    expect(decide(baseContext({ opponentHistory: ['rock', 'paper', 'rock', 'paper', 'rock'] }))).toBe(
      'scissors'
    );
  });

  it('AntiMirror exploits copycat-style responses', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'anti-mirror')!.source);
    expect(
      decide(
        baseContext({
          selfHistory: ['rock', 'paper', 'scissors', 'rock'],
          opponentHistory: ['scissors', 'rock', 'paper', 'scissors']
        })
      )
    ).toBe('paper');
  });

  it('AntiCycle counters exact short loops', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'anti-cycle')!.source);
    expect(decide(baseContext({ opponentHistory: ['rock', 'paper', 'rock', 'paper'] }))).toBe('paper');
  });

  it('BayesBot combines multiple deterministic signals', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'bayesbot')!.source);
    expect(decide(baseContext({ opponentHistory: ['rock', 'rock', 'paper', 'rock'] }))).toBe('paper');
  });

  it('MetaMixer picks the best-performing internal predictor', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'metamixer')!.source);
    expect(decide(baseContext({ opponentHistory: ['rock', 'paper', 'paper', 'paper'] }))).toBe('scissors');
  });

  it('MomentumBot reacts to wins, losses, and draws', async () => {
    const decide = await loadDecider(seededBots.find((bot) => bot.id === 'momentumbot')!.source);
    expect(decide(baseContext({ selfHistory: ['rock'], opponentHistory: ['scissors'] }))).toBe('rock');
    expect(decide(baseContext({ selfHistory: ['rock'], opponentHistory: ['paper'] }))).toBe('paper');
    expect(decide(baseContext({ selfHistory: ['rock'], opponentHistory: ['rock'] }))).toBe('paper');
  });
});
