import type { MatchSummary, Move, RoundOutcome } from '../types';

export const MOVES: Move[] = ['rock', 'paper', 'scissors'];

export function isMove(value: unknown): value is Move {
  return typeof value === 'string' && MOVES.includes(value as Move);
}

export function resolveRoundOutcome(botAMove: Move, botBMove: Move): RoundOutcome {
  if (botAMove === botBMove) {
    return 'draw';
  }

  if (
    (botAMove === 'rock' && botBMove === 'scissors') ||
    (botAMove === 'paper' && botBMove === 'rock') ||
    (botAMove === 'scissors' && botBMove === 'paper')
  ) {
    return 'a_win';
  }

  return 'b_win';
}

export function counterMove(move: Move): Move {
  switch (move) {
    case 'rock':
      return 'paper';
    case 'paper':
      return 'scissors';
    case 'scissors':
      return 'rock';
  }
}

export function createEmptySummary(): MatchSummary {
  return {
    aWins: 0,
    bWins: 0,
    draws: 0,
    suddenDeathRounds: 0
  };
}

export function updateSummary(summary: MatchSummary, outcome: RoundOutcome, isSuddenDeath: boolean) {
  if (outcome === 'a_win') {
    summary.aWins += 1;
  } else if (outcome === 'b_win') {
    summary.bWins += 1;
  } else {
    summary.draws += 1;
  }

  if (isSuddenDeath) {
    summary.suddenDeathRounds += 1;
  }
}
