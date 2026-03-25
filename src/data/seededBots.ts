import type { BotManifest } from '../types';

const piDigits = '314159265358979323846264338327950288419716939937510';

function createSeededBot(
  id: string,
  name: string,
  description: string,
  emoji: string,
  source: string
): BotManifest {
  return {
    id,
    name,
    description,
    avatar: { kind: 'emoji', value: emoji },
    isSeeded: true,
    source
  };
}

export const seededBots: BotManifest[] = [
  createSeededBot(
    'pibot',
    'PiBot',
    'Uses the digits of pi modulo 3 to create deterministic pseudo-random play.',
    'π',
    `
      const digits = '${piDigits}';
      const moves = ['rock', 'paper', 'scissors'];

      export function decide(context) {
        const digit = Number(digits[context.roundIndex % digits.length]);
        return moves[digit % 3];
      }
    `
  ),
  createSeededBot(
    'copycat',
    'Copycat',
    'Starts with rock, then mirrors the opponent’s last move.',
    '🪞',
    `
      export function decide(context) {
        const lastMove = context.opponentHistory[context.opponentHistory.length - 1];
        return lastMove ?? 'rock';
      }
    `
  ),
  createSeededBot(
    'pattern-matcher',
    'PatternMatcher',
    'Looks at the last 10 rounds for repeat sequences and counters the predicted move.',
    '🧠',
    `
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
  ),
  createSeededBot(
    'dummybot',
    'Dummybot',
    'Cycles through rock, paper, scissors in order forever.',
    '🤖',
    `
      const moves = ['rock', 'paper', 'scissors'];

      export function decide(context) {
        return moves[context.roundIndex % moves.length];
      }
    `
  ),
  createSeededBot(
    'reverse-copycat',
    'ReverseCopycat',
    'Opens with paper, then plays the move that beats the opponent’s previous move.',
    '↩️',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      export function decide(context) {
        const lastMove = context.opponentHistory[context.opponentHistory.length - 1];
        return lastMove ? counterMove(lastMove) : 'paper';
      }
    `
  ),
  createSeededBot(
    'grudgebot',
    'GrudgeBot',
    'Turns vindictive after consecutive losses and counters the opponent’s recent tendencies.',
    '😠',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      function outcomeForSelf(selfMove, opponentMove) {
        if (selfMove === opponentMove) return 'draw';
        if (
          (selfMove === 'rock' && opponentMove === 'scissors') ||
          (selfMove === 'paper' && opponentMove === 'rock') ||
          (selfMove === 'scissors' && opponentMove === 'paper')
        ) {
          return 'win';
        }

        return 'loss';
      }

      function mostFrequentMove(history) {
        const counts = { rock: 0, paper: 0, scissors: 0 };
        for (const move of history) {
          counts[move] += 1;
        }

        let bestMove = 'rock';
        for (const move of ['paper', 'scissors']) {
          if (counts[move] > counts[bestMove]) {
            bestMove = move;
          }
        }

        return bestMove;
      }

      function isInGrudgeWindow(selfHistory, opponentHistory) {
        const outcomes = [];
        for (let index = 0; index < selfHistory.length; index += 1) {
          outcomes.push(outcomeForSelf(selfHistory[index], opponentHistory[index]));
        }

        for (let index = Math.max(1, outcomes.length - 3); index < outcomes.length; index += 1) {
          if (outcomes[index - 1] === 'loss' && outcomes[index] === 'loss') {
            return outcomes.length - 1 - index <= 1;
          }
        }

        return false;
      }

      export function decide(context) {
        if (context.opponentHistory.length === 0) {
          return 'rock';
        }

        if (isInGrudgeWindow(context.selfHistory, context.opponentHistory)) {
          return counterMove(mostFrequentMove(context.opponentHistory.slice(-5)));
        }

        const lastOpponentMove = context.opponentHistory[context.opponentHistory.length - 1];
        const lastSelfMove = context.selfHistory[context.selfHistory.length - 1];
        const lastOutcome = outcomeForSelf(lastSelfMove, lastOpponentMove);

        if (lastOutcome === 'loss') {
          return counterMove(lastOpponentMove);
        }

        if (lastOutcome === 'win') {
          return lastSelfMove;
        }

        return 'rock';
      }
    `
  ),
  createSeededBot(
    'trap-setter',
    'TrapSetter',
    'Repeats a bait pattern, then breaks it with deterministic punish rounds.',
    '🪤',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      const baitPattern = ['rock', 'paper', 'rock', 'paper'];

      export function decide(context) {
        const phase = context.roundIndex % 6;
        if (phase < baitPattern.length) {
          return baitPattern[phase];
        }

        if (phase === 4) {
          return 'scissors';
        }

        const lastMove = context.opponentHistory[context.opponentHistory.length - 1];
        return lastMove ? counterMove(lastMove) : 'paper';
      }
    `
  ),
  createSeededBot(
    'stubbornbot',
    'StubbornBot',
    'Holds the same move for five rounds at a time before switching on schedule.',
    '🗿',
    `
      const moves = ['rock', 'paper', 'scissors'];

      export function decide(context) {
        return moves[Math.floor(context.roundIndex / 5) % moves.length];
      }
    `
  ),
  createSeededBot(
    'chaos-clock',
    'ChaosClock',
    'Changes deterministic personality by round window: cycle, anchor, punish, then spin.',
    '🕰️',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      const cycle = ['rock', 'paper', 'scissors'];
      const anchor = ['rock', 'rock', 'paper'];

      export function decide(context) {
        const phase = context.roundIndex % 12;

        if (phase < 3) {
          return cycle[phase];
        }

        if (phase < 6) {
          return anchor[phase - 3];
        }

        if (phase < 9) {
          const lastOpponentMove = context.opponentHistory[context.opponentHistory.length - 1];
          return lastOpponentMove ? counterMove(lastOpponentMove) : cycle[phase - 6];
        }

        const lastSelfMove = context.selfHistory[context.selfHistory.length - 1];
        if (!lastSelfMove) {
          return cycle[phase - 9];
        }

        if (context.previousRound && context.previousRound.outcome === 'draw') {
          return 'scissors';
        }

        return counterMove(lastSelfMove);
      }
    `
  ),
  createSeededBot(
    'frequency-analyst',
    'FrequencyAnalyst',
    'Counters the opponent’s most frequent historical move.',
    '📊',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      function mostFrequentMove(history) {
        const counts = { rock: 0, paper: 0, scissors: 0 };
        for (const move of history) {
          counts[move] += 1;
        }

        let bestMove = 'rock';
        for (const move of ['paper', 'scissors']) {
          if (counts[move] > counts[bestMove]) {
            bestMove = move;
          }
        }

        return bestMove;
      }

      export function decide(context) {
        if (context.opponentHistory.length === 0) {
          return 'rock';
        }

        return counterMove(mostFrequentMove(context.opponentHistory));
      }
    `
  ),
  createSeededBot(
    'markovbot',
    'MarkovBot',
    'Learns what move tends to follow the opponent’s last move and counters that transition.',
    '🔗',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      function mostFrequentMove(history) {
        const counts = { rock: 0, paper: 0, scissors: 0 };
        for (const move of history) {
          counts[move] += 1;
        }

        let bestMove = 'rock';
        for (const move of ['paper', 'scissors']) {
          if (counts[move] > counts[bestMove]) {
            bestMove = move;
          }
        }

        return bestMove;
      }

      export function decide(context) {
        const history = context.opponentHistory;
        if (history.length < 2) {
          return history.length === 1 ? counterMove(history[0]) : 'rock';
        }

        const lastMove = history[history.length - 1];
        const counts = { rock: 0, paper: 0, scissors: 0 };

        for (let index = 0; index < history.length - 1; index += 1) {
          if (history[index] === lastMove) {
            counts[history[index + 1]] += 1;
          }
        }

        if (counts.rock === 0 && counts.paper === 0 && counts.scissors === 0) {
          return counterMove(mostFrequentMove(history));
        }

        let predicted = 'rock';
        for (const move of ['paper', 'scissors']) {
          if (counts[move] > counts[predicted]) {
            predicted = move;
          }
        }

        return counterMove(predicted);
      }
    `
  ),
  createSeededBot(
    'anti-mirror',
    'AntiMirror',
    'Looks for copycat-style responses and chooses the move that exploits them.',
    '🕵️',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      export function decide(context) {
        if (context.selfHistory.length === 0) {
          return 'rock';
        }

        let mirrorScore = 0;
        let reverseScore = 0;
        const startIndex = Math.max(1, context.selfHistory.length - 6);

        for (let index = startIndex; index < context.selfHistory.length; index += 1) {
          const previousSelfMove = context.selfHistory[index - 1];
          if (context.opponentHistory[index] === previousSelfMove) {
            mirrorScore += 1;
          }

          if (context.opponentHistory[index] === counterMove(previousSelfMove)) {
            reverseScore += 1;
          }
        }

        const lastSelfMove = context.selfHistory[context.selfHistory.length - 1];
        if (mirrorScore >= 3 && mirrorScore > reverseScore) {
          return counterMove(lastSelfMove);
        }

        if (reverseScore >= 3) {
          return counterMove(counterMove(lastSelfMove));
        }

        const lastOpponentMove = context.opponentHistory[context.opponentHistory.length - 1];
        return lastOpponentMove ? counterMove(lastOpponentMove) : 'paper';
      }
    `
  ),
  createSeededBot(
    'anti-cycle',
    'AntiCycle',
    'Detects exact short cycles and counters the next step in the loop.',
    '🔄',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      function predictCycle(history) {
        for (let length = 2; length <= 5; length += 1) {
          if (history.length < length * 2) {
            continue;
          }

          const previousChunk = history.slice(history.length - length * 2, history.length - length);
          const latestChunk = history.slice(history.length - length);
          let matches = true;

          for (let index = 0; index < length; index += 1) {
            if (previousChunk[index] !== latestChunk[index]) {
              matches = false;
              break;
            }
          }

          if (matches) {
            return latestChunk[0];
          }
        }

        return null;
      }

      export function decide(context) {
        const prediction = predictCycle(context.opponentHistory);
        if (prediction) {
          return counterMove(prediction);
        }

        const lastMove = context.opponentHistory[context.opponentHistory.length - 1];
        return lastMove ? counterMove(lastMove) : 'rock';
      }
    `
  ),
  createSeededBot(
    'bayesbot',
    'BayesBot',
    'Blends recency, frequency, and transition evidence into one deterministic prediction.',
    '📐',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      function chooseBestMove(scores) {
        let bestMove = 'rock';
        for (const move of ['paper', 'scissors']) {
          if (scores[move] > scores[bestMove]) {
            bestMove = move;
          }
        }

        return bestMove;
      }

      export function decide(context) {
        const history = context.opponentHistory;
        if (history.length === 0) {
          return 'rock';
        }

        const scores = { rock: 0, paper: 0, scissors: 0 };
        for (const move of history) {
          scores[move] += 1;
        }

        const recentWeights = [3, 2, 1];
        const recentHistory = history.slice(-3);
        for (let index = 0; index < recentHistory.length; index += 1) {
          scores[recentHistory[recentHistory.length - 1 - index]] += recentWeights[index];
        }

        const lastMove = history[history.length - 1];
        for (let index = 0; index < history.length - 1; index += 1) {
          if (history[index] === lastMove) {
            scores[history[index + 1]] += 2;
          }
        }

        return counterMove(chooseBestMove(scores));
      }
    `
  ),
  createSeededBot(
    'metamixer',
    'MetaMixer',
    'Scores several internal predictors on past rounds and uses whichever has been most accurate.',
    '🎛️',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      function mostFrequentMove(history) {
        const counts = { rock: 0, paper: 0, scissors: 0 };
        for (const move of history) {
          counts[move] += 1;
        }

        let bestMove = 'rock';
        for (const move of ['paper', 'scissors']) {
          if (counts[move] > counts[bestMove]) {
            bestMove = move;
          }
        }

        return bestMove;
      }

      function predictTransition(history) {
        if (history.length < 2) {
          return history[history.length - 1] ?? 'rock';
        }

        const lastMove = history[history.length - 1];
        const counts = { rock: 0, paper: 0, scissors: 0 };
        for (let index = 0; index < history.length - 1; index += 1) {
          if (history[index] === lastMove) {
            counts[history[index + 1]] += 1;
          }
        }

        if (counts.rock === 0 && counts.paper === 0 && counts.scissors === 0) {
          return mostFrequentMove(history);
        }

        let bestMove = 'rock';
        for (const move of ['paper', 'scissors']) {
          if (counts[move] > counts[bestMove]) {
            bestMove = move;
          }
        }

        return bestMove;
      }

      function predictRepeat(history) {
        return history[history.length - 1] ?? 'rock';
      }

      function scorePredictor(history, predictor) {
        let score = 0;
        for (let roundIndex = 1; roundIndex < history.length; roundIndex += 1) {
          const priorHistory = history.slice(0, roundIndex);
          if (predictor(priorHistory) === history[roundIndex]) {
            score += 1;
          }
        }

        return score;
      }

      export function decide(context) {
        const history = context.opponentHistory;
        if (history.length === 0) {
          return 'rock';
        }

        const predictors = [
          predictRepeat,
          mostFrequentMove,
          predictTransition
        ];

        let bestPredictor = predictors[0];
        let bestScore = scorePredictor(history, bestPredictor);

        for (let index = 1; index < predictors.length; index += 1) {
          const predictor = predictors[index];
          const score = scorePredictor(history, predictor);
          if (score > bestScore) {
            bestPredictor = predictor;
            bestScore = score;
          }
        }

        return counterMove(bestPredictor(history));
      }
    `
  ),
  createSeededBot(
    'momentumbot',
    'MomentumBot',
    'Repeats wins, pivots after losses, and cycles forward after draws.',
    '🏎️',
    `
      function counterMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      function nextMove(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
      }

      function outcomeForSelf(selfMove, opponentMove) {
        if (selfMove === opponentMove) return 'draw';
        if (
          (selfMove === 'rock' && opponentMove === 'scissors') ||
          (selfMove === 'paper' && opponentMove === 'rock') ||
          (selfMove === 'scissors' && opponentMove === 'paper')
        ) {
          return 'win';
        }

        return 'loss';
      }

      export function decide(context) {
        if (context.selfHistory.length === 0 || context.opponentHistory.length === 0) {
          return 'rock';
        }

        const lastSelfMove = context.selfHistory[context.selfHistory.length - 1];
        const lastOpponentMove = context.opponentHistory[context.opponentHistory.length - 1];
        const outcome = outcomeForSelf(lastSelfMove, lastOpponentMove);

        if (outcome === 'win') {
          return lastSelfMove;
        }

        if (outcome === 'loss') {
          return counterMove(lastSelfMove);
        }

        return nextMove(lastSelfMove);
      }
    `
  )
];
