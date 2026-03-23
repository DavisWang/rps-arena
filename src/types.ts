export type Move = 'rock' | 'paper' | 'scissors';

export type RoundOutcome = 'a_win' | 'b_win' | 'draw';

export type MatchStatus = 'pending' | 'ready' | 'in_progress' | 'completed' | 'forfeit';

export type MatchMode = 'quick' | 'tournament';

export type MatchCompletionReason = 'played' | 'bye' | 'forfeit';

export type AvatarSpec = {
  kind: 'emoji' | 'image';
  value: string;
};

export type RoundRecord = {
  roundIndex: number;
  botAMove: Move;
  botBMove: Move;
  outcome: RoundOutcome;
  isSuddenDeath: boolean;
};

export type BotExecutionContext = {
  roundIndex: number;
  configuredRounds: number;
  isSuddenDeath: boolean;
  selfHistory: Move[];
  opponentHistory: Move[];
  previousRound: RoundRecord | null;
};

export type BotManifest = {
  id: string;
  name: string;
  description?: string;
  avatar?: AvatarSpec;
  source: string;
  isSeeded: boolean;
};

export type MatchSummary = {
  aWins: number;
  bWins: number;
  draws: number;
  suddenDeathRounds: number;
};

export type MatchRecord = {
  id: string;
  botAId: string;
  botBId: string;
  configuredRounds: number;
  status: MatchStatus;
  winnerBotId?: string;
  technicalForfeitBotId?: string;
  summary: MatchSummary;
};

export type MatchSnapshot = MatchRecord & {
  currentRound: number;
  recentRounds: RoundRecord[];
  startedAt?: number;
  completedAt?: number;
  updatedAt: number;
  errorMessage?: string;
  completionReason: MatchCompletionReason;
};

export type QuickMatchSession = {
  id: string;
  mode: 'quick';
  botAId: string;
  botBId: string;
  configuredRounds: number;
  record: MatchSnapshot;
  createdAt: number;
  updatedAt: number;
};

export type TournamentMatch = MatchSnapshot & {
  roundNumber: number;
  slotIndex: number;
  sourceMatchIds: string[];
};

export type TournamentStatus = 'setup' | 'in_progress' | 'completed';

export type TournamentRecord = {
  id: string;
  name: string;
  participantBotIds: string[];
  configuredRounds: number;
  status: TournamentStatus;
  bracket: TournamentMatch[];
  championBotId?: string;
  createdAt: number;
  updatedAt: number;
};

export type TournamentStandingsEntry = {
  botId: string;
  matchesWon: number;
  matchesLost: number;
  roundWins: number;
  roundLosses: number;
  roundDraws: number;
  winRate: number;
  drawRate: number;
  suddenDeathRounds: number;
  technicalForfeits: number;
  byeAdvances: number;
  placementLabel: string;
};

export type TournamentResults = {
  championBotId?: string;
  standings: TournamentStandingsEntry[];
};

export type BotImportPayload = Omit<BotManifest, 'isSeeded'>;
