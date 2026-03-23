import type {
  MatchSnapshot,
  TournamentMatch,
  TournamentRecord,
  TournamentResults,
  TournamentStandingsEntry
} from '../types';
import { createId } from './ids';
import { createEmptySummary } from './moves';

function emptyMatchSnapshot(botAId = '', botBId = '', configuredRounds = 1): MatchSnapshot {
  const timestamp = Date.now();
  return {
    id: createId('match'),
    botAId,
    botBId,
    configuredRounds,
    status: botAId && botBId ? 'ready' : 'pending',
    summary: createEmptySummary(),
    currentRound: 0,
    recentRounds: [],
    updatedAt: timestamp,
    completionReason: 'played'
  };
}

function totalRoundsForSize(size: number) {
  return Math.log2(size);
}

export function nextPowerOfTwo(value: number) {
  if (value <= 1) {
    return 1;
  }

  return 2 ** Math.ceil(Math.log2(value));
}

export function hasPlayableEntrants(match: TournamentMatch) {
  return Boolean(match.botAId && match.botBId);
}

function createByeMatch(botId: string, configuredRounds: number, slotIndex: number): TournamentMatch {
  const timestamp = Date.now();
  return {
    ...emptyMatchSnapshot(botId, '', configuredRounds),
    roundNumber: 1,
    slotIndex,
    sourceMatchIds: [],
    status: 'completed',
    winnerBotId: botId,
    currentRound: 0,
    completedAt: timestamp,
    updatedAt: timestamp,
    completionReason: 'bye'
  };
}

function createRoundOneMatches(participantBotIds: string[], configuredRounds: number) {
  const bracketSize = nextPowerOfTwo(participantBotIds.length);
  const roundOneMatchCount = bracketSize / 2;
  const playedMatchCount = Math.max(0, participantBotIds.length - roundOneMatchCount);
  const matches: TournamentMatch[] = [];
  let cursor = 0;

  for (let slotIndex = 0; slotIndex < roundOneMatchCount; slotIndex += 1) {
    if (slotIndex < playedMatchCount) {
      const botAId = participantBotIds[cursor] ?? '';
      const botBId = participantBotIds[cursor + 1] ?? '';
      cursor += 2;

      matches.push({
        ...emptyMatchSnapshot(botAId, botBId, configuredRounds),
        roundNumber: 1,
        slotIndex,
        sourceMatchIds: []
      });
      continue;
    }

    const botId = participantBotIds[cursor] ?? '';
    cursor += 1;
    matches.push(createByeMatch(botId, configuredRounds, slotIndex));
  }

  return matches;
}

function createLaterRoundMatches(
  previousRound: TournamentMatch[],
  roundNumber: number,
  configuredRounds: number
) {
  const matches: TournamentMatch[] = [];
  for (let slotIndex = 0; slotIndex < previousRound.length / 2; slotIndex += 1) {
    matches.push({
      ...emptyMatchSnapshot('', '', configuredRounds),
      roundNumber,
      slotIndex,
      sourceMatchIds: [previousRound[slotIndex * 2].id, previousRound[slotIndex * 2 + 1].id]
    });
  }

  return matches;
}

export function createTournamentRecord(params: {
  name: string;
  participantBotIds: string[];
  configuredRounds: number;
}): TournamentRecord {
  const { name, participantBotIds, configuredRounds } = params;
  const now = Date.now();
  const roundOne = createRoundOneMatches(participantBotIds, configuredRounds);
  const bracket: TournamentMatch[] = [...roundOne];
  let previousRound = roundOne;

  for (let roundNumber = 2; roundNumber <= totalRoundsForSize(nextPowerOfTwo(participantBotIds.length)); roundNumber += 1) {
    const nextRound = createLaterRoundMatches(previousRound, roundNumber, configuredRounds);
    bracket.push(...nextRound);
    previousRound = nextRound;
  }

  return refreshTournamentRecord({
    id: createId('tournament'),
    name,
    participantBotIds,
    configuredRounds,
    status: 'setup',
    bracket,
    createdAt: now,
    updatedAt: now
  });
}

function updatePendingMatchState(match: TournamentMatch): TournamentMatch {
  if (match.status === 'completed' || match.status === 'forfeit') {
    return match;
  }

  return {
    ...match,
    status: match.botAId && match.botBId ? 'ready' : 'pending',
    updatedAt: Date.now()
  };
}

export function refreshTournamentRecord(tournament: TournamentRecord): TournamentRecord {
  const matchesById = new Map(tournament.bracket.map((match) => [match.id, { ...match }]));
  const sortedMatches = [...matchesById.values()].sort((a, b) => {
    if (a.roundNumber !== b.roundNumber) {
      return a.roundNumber - b.roundNumber;
    }
    return a.slotIndex - b.slotIndex;
  });

  for (const match of sortedMatches) {
    if (match.sourceMatchIds.length === 2 && match.status !== 'completed' && match.status !== 'forfeit') {
      const [left, right] = match.sourceMatchIds.map((sourceId) => matchesById.get(sourceId)!);
      const botAId = left.winnerBotId ?? '';
      const botBId = right.winnerBotId ?? '';

      match.botAId = botAId;
      match.botBId = botBId;
      matchesById.set(match.id, updatePendingMatchState(match));
      continue;
    }

    matchesById.set(match.id, updatePendingMatchState(match));
  }

  const bracket = [...matchesById.values()].sort((a, b) => {
    if (a.roundNumber !== b.roundNumber) {
      return a.roundNumber - b.roundNumber;
    }
    return a.slotIndex - b.slotIndex;
  });
  const finalMatch = bracket[bracket.length - 1];
  const championBotId = finalMatch?.winnerBotId;
  const anyPlayed = bracket.some((match) => match.status === 'completed' || match.status === 'forfeit');
  const status = championBotId ? 'completed' : anyPlayed ? 'in_progress' : 'setup';

  return {
    ...tournament,
    bracket,
    championBotId,
    status,
    updatedAt: Date.now()
  };
}

export function updateTournamentMatch(
  tournament: TournamentRecord,
  matchId: string,
  snapshot: MatchSnapshot
) {
  const bracket = tournament.bracket.map((match) => {
    if (match.id !== matchId) {
      return match;
    }

    return {
      ...match,
      ...snapshot,
      roundNumber: match.roundNumber,
      slotIndex: match.slotIndex,
      sourceMatchIds: match.sourceMatchIds,
      updatedAt: Date.now()
    };
  });

  return refreshTournamentRecord({
    ...tournament,
    bracket,
    updatedAt: Date.now()
  });
}

export function findTournamentMatch(tournament: TournamentRecord, matchId: string) {
  return tournament.bracket.find((match) => match.id === matchId);
}

export function getRoundMatches(tournament: TournamentRecord) {
  const rounds = new Map<number, TournamentMatch[]>();

  for (const match of tournament.bracket) {
    const list = rounds.get(match.roundNumber) ?? [];
    list.push(match);
    rounds.set(match.roundNumber, list);
  }

  return [...rounds.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([roundNumber, matches]) => ({
      roundNumber,
      matches: matches.sort((a, b) => a.slotIndex - b.slotIndex)
    }));
}

export function getTournamentResults(tournament: TournamentRecord): TournamentResults {
  const totalConfiguredRounds = tournament.configuredRounds;
  const totalRounds = totalRoundsForSize(nextPowerOfTwo(tournament.participantBotIds.length));
  const stats = new Map<string, TournamentStandingsEntry>();

  for (const botId of tournament.participantBotIds) {
    stats.set(botId, {
      botId,
      matchesWon: 0,
      matchesLost: 0,
      roundWins: 0,
      roundLosses: 0,
      roundDraws: 0,
      winRate: 0,
      drawRate: 0,
      suddenDeathRounds: 0,
      technicalForfeits: 0,
      byeAdvances: 0,
      placementLabel: 'Active'
    });
  }

  const eliminationRound = new Map<string, number>();

  for (const match of tournament.bracket) {
    const botAStats = match.botAId ? stats.get(match.botAId) : undefined;
    const botBStats = match.botBId ? stats.get(match.botBId) : undefined;

    if (botAStats) {
      botAStats.roundWins += match.summary.aWins;
      botAStats.roundLosses += match.summary.bWins;
      botAStats.roundDraws += match.summary.draws;
      botAStats.suddenDeathRounds += match.summary.suddenDeathRounds;
    }

    if (botBStats) {
      botBStats.roundWins += match.summary.bWins;
      botBStats.roundLosses += match.summary.aWins;
      botBStats.roundDraws += match.summary.draws;
      botBStats.suddenDeathRounds += match.summary.suddenDeathRounds;
    }

    if (match.completionReason === 'bye' && match.winnerBotId) {
      const winnerStats = stats.get(match.winnerBotId);
      if (winnerStats) {
        winnerStats.byeAdvances += 1;
      }
      continue;
    }

    if ((match.status === 'completed' || match.status === 'forfeit') && match.winnerBotId) {
      const winnerStats = stats.get(match.winnerBotId);
      winnerStats && (winnerStats.matchesWon += 1);

      const loserBotId =
        match.botAId === match.winnerBotId ? match.botBId : match.botAId;
      if (loserBotId) {
        stats.get(loserBotId)!.matchesLost += 1;
        eliminationRound.set(loserBotId, match.roundNumber);
      }

      if (match.technicalForfeitBotId) {
        const forfeitingStats = stats.get(match.technicalForfeitBotId);
        if (forfeitingStats) {
          forfeitingStats.technicalForfeits += 1;
        }
      }
    }
  }

  const standings = [...stats.values()]
    .map((entry) => {
      const totalRoundsSeen = entry.roundWins + entry.roundLosses + entry.roundDraws;
      const eliminatedAt = eliminationRound.get(entry.botId);
      let placementLabel = 'Active';

      if (tournament.championBotId === entry.botId) {
        placementLabel = 'Champion';
      } else if (eliminatedAt === totalRounds) {
        placementLabel = 'Finalist';
      } else if (eliminatedAt === totalRounds - 1) {
        placementLabel = 'Semifinalist';
      } else if (eliminatedAt) {
        placementLabel = `Round ${eliminatedAt} exit`;
      } else if (entry.matchesWon === 0 && entry.byeAdvances === 0 && totalConfiguredRounds > 0) {
        placementLabel = 'Registered';
      }

      return {
        ...entry,
        placementLabel,
        winRate: totalRoundsSeen > 0 ? entry.roundWins / totalRoundsSeen : 0,
        drawRate: totalRoundsSeen > 0 ? entry.roundDraws / totalRoundsSeen : 0
      };
    })
    .sort((left, right) => {
      if (left.botId === tournament.championBotId) {
        return -1;
      }
      if (right.botId === tournament.championBotId) {
        return 1;
      }
      if (left.matchesWon !== right.matchesWon) {
        return right.matchesWon - left.matchesWon;
      }
      if (left.roundWins !== right.roundWins) {
        return right.roundWins - left.roundWins;
      }
      return left.botId.localeCompare(right.botId);
    });

  return {
    championBotId: tournament.championBotId,
    standings
  };
}
