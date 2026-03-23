import type { BotManifest } from '../types';

const piDigits = '314159265358979323846264338327950288419716939937510';

export const seededBots: BotManifest[] = [
  {
    id: 'pibot',
    name: 'PiBot',
    description: 'Uses the digits of pi modulo 3 to create deterministic pseudo-random play.',
    avatar: { kind: 'emoji', value: 'π' },
    isSeeded: true,
    source: `
      const digits = '${piDigits}';
      const moves = ['rock', 'paper', 'scissors'];

      export function decide(context) {
        const digit = Number(digits[context.roundIndex % digits.length]);
        return moves[digit % 3];
      }
    `
  },
  {
    id: 'copycat',
    name: 'Copycat',
    description: 'Starts with rock, then mirrors the opponent’s last move.',
    avatar: { kind: 'emoji', value: '🪞' },
    isSeeded: true,
    source: `
      export function decide(context) {
        const lastMove = context.opponentHistory[context.opponentHistory.length - 1];
        return lastMove ?? 'rock';
      }
    `
  },
  {
    id: 'pattern-matcher',
    name: 'PatternMatcher',
    description: 'Looks at the last 10 rounds for repeat sequences and counters the predicted move.',
    avatar: { kind: 'emoji', value: '🧠' },
    isSeeded: true,
    source: `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      export function decide(context) {
        const history = context.opponentHistory.slice(-10);
        if (history.length < 2) {
          return 'rock';
        }

        for (let windowSize = Math.min(5, history.length - 1); windowSize >= 1; windowSize -= 1) {
          const suffix = history.slice(history.length - windowSize).join(',');
          for (let index = 0; index <= history.length - windowSize - 1; index += 1) {
            const sample = history.slice(index, index + windowSize).join(',');
            const nextMove = history[index + windowSize];
            if (sample === suffix && nextMove) {
              return counterMove(nextMove);
            }
          }
        }

        return counterMove(history[history.length - 1]);
      }
    `
  },
  {
    id: 'dummybot',
    name: 'Dummybot',
    description: 'Cycles through rock, paper, scissors in order forever.',
    avatar: { kind: 'emoji', value: '🤖' },
    isSeeded: true,
    source: `
      const moves = ['rock', 'paper', 'scissors'];

      export function decide(context) {
        return moves[context.roundIndex % moves.length];
      }
    `
  }
];
