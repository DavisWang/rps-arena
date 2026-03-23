import type { BotManifest, MatchSnapshot, QuickMatchSession, TournamentMatch, TournamentRecord } from '../types';
import { getAllFromStore, getFromStore, putInStore, STORE_NAMES, deleteFromStore } from './idb';
import { refreshTournamentRecord } from './tournament';

function normalizeSnapshot(snapshot: MatchSnapshot): MatchSnapshot {
  if (snapshot.status === 'in_progress') {
    return {
      ...snapshot,
      status: snapshot.botAId && snapshot.botBId ? 'ready' : 'pending',
      completionReason: 'played',
      winnerBotId: undefined,
      technicalForfeitBotId: undefined,
      completedAt: undefined,
      errorMessage: undefined,
      updatedAt: Date.now()
    };
  }

  return snapshot;
}

function normalizeQuickMatchSession(session: QuickMatchSession): QuickMatchSession {
  return {
    ...session,
    record: normalizeSnapshot(session.record)
  };
}

function normalizeTournamentRecord(tournament: TournamentRecord): TournamentRecord {
  const normalizeTournamentMatch = (match: TournamentMatch): TournamentMatch => ({
    ...match,
    ...normalizeSnapshot(match)
  });

  const normalized = {
    ...tournament,
    bracket: tournament.bracket.map((match) => normalizeTournamentMatch(match))
  };

  return refreshTournamentRecord(normalized);
}

export async function listCustomBots() {
  return getAllFromStore<BotManifest>(STORE_NAMES.customBots);
}

export async function saveCustomBot(bot: BotManifest) {
  return putInStore(STORE_NAMES.customBots, bot);
}

export async function deleteCustomBot(botId: string) {
  return deleteFromStore(STORE_NAMES.customBots, botId);
}

export async function listQuickMatches() {
  const sessions = await getAllFromStore<QuickMatchSession>(STORE_NAMES.quickMatches);
  return sessions.map(normalizeQuickMatchSession).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getQuickMatch(sessionId: string) {
  const session = await getFromStore<QuickMatchSession>(STORE_NAMES.quickMatches, sessionId);
  return session ? normalizeQuickMatchSession(session) : undefined;
}

export async function saveQuickMatch(session: QuickMatchSession) {
  return putInStore(STORE_NAMES.quickMatches, session);
}

export async function listTournaments() {
  const tournaments = await getAllFromStore<TournamentRecord>(STORE_NAMES.tournaments);
  return tournaments.map(normalizeTournamentRecord).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getTournament(tournamentId: string) {
  const tournament = await getFromStore<TournamentRecord>(STORE_NAMES.tournaments, tournamentId);
  return tournament ? normalizeTournamentRecord(tournament) : undefined;
}

export async function saveTournament(tournament: TournamentRecord) {
  return putInStore(STORE_NAMES.tournaments, refreshTournamentRecord(tournament));
}
