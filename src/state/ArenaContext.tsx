import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';
import { seededBots } from '../data/seededBots';
import { parseImportedBot } from '../lib/botImport';
import { createId } from '../lib/ids';
import { deleteCustomBot, listCustomBots, listQuickMatches, listTournaments, saveCustomBot, saveQuickMatch, saveTournament } from '../lib/storage';
import { createEmptySummary } from '../lib/moves';
import { createTournamentRecord } from '../lib/tournament';
import type { BotManifest, MatchSnapshot, QuickMatchSession, TournamentRecord } from '../types';

type ArenaContextValue = {
  loading: boolean;
  bots: BotManifest[];
  customBots: BotManifest[];
  tournaments: TournamentRecord[];
  quickMatches: QuickMatchSession[];
  importBotFromText(text: string): Promise<BotManifest>;
  removeCustomBot(botId: string): Promise<void>;
  createQuickMatchSession(input: {
    botAId: string;
    botBId: string;
    configuredRounds: number;
  }): Promise<QuickMatchSession>;
  saveQuickMatchSession(session: QuickMatchSession): Promise<QuickMatchSession>;
  createTournament(input: {
    name: string;
    participantBotIds: string[];
    configuredRounds: number;
  }): Promise<TournamentRecord>;
  saveTournamentRecord(tournament: TournamentRecord): Promise<TournamentRecord>;
  getBot(botId: string): BotManifest | undefined;
  getTournamentById(tournamentId: string): TournamentRecord | undefined;
  getQuickMatchById(sessionId: string): QuickMatchSession | undefined;
};

type ArenaState = {
  loading: boolean;
  customBots: BotManifest[];
  tournaments: TournamentRecord[];
  quickMatches: QuickMatchSession[];
};

const ArenaContext = createContext<ArenaContextValue | null>(null);

function createQuickSnapshot(botAId: string, botBId: string, configuredRounds: number): MatchSnapshot {
  return {
    id: createId('quick-match'),
    botAId,
    botBId,
    configuredRounds,
    status: 'ready',
    summary: createEmptySummary(),
    currentRound: 0,
    recentRounds: [],
    updatedAt: Date.now(),
    completionReason: 'played'
  };
}

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ArenaState>({
    loading: true,
    customBots: [],
    tournaments: [],
    quickMatches: []
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [customBots, tournaments, quickMatches] = await Promise.all([
        listCustomBots(),
        listTournaments(),
        listQuickMatches()
      ]);

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setState({
          loading: false,
          customBots,
          tournaments,
          quickMatches
        });
      });
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const bots = [...seededBots, ...state.customBots].sort((left, right) => {
    if (left.isSeeded !== right.isSeeded) {
      return left.isSeeded ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });

  async function importBotFromText(text: string) {
    const importedBot = await parseImportedBot(text, [...seededBots, ...state.customBots]);
    await saveCustomBot(importedBot);

    startTransition(() => {
      setState((current) => ({
        ...current,
        customBots: [...current.customBots.filter((bot) => bot.id !== importedBot.id), importedBot].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      }));
    });

    return importedBot;
  }

  async function removeCustomBot(botId: string) {
    await deleteCustomBot(botId);
    startTransition(() => {
      setState((current) => ({
        ...current,
        customBots: current.customBots.filter((bot) => bot.id !== botId)
      }));
    });
  }

  async function createQuickMatchSession(input: {
    botAId: string;
    botBId: string;
    configuredRounds: number;
  }) {
    const session: QuickMatchSession = {
      id: createId('quick-session'),
      mode: 'quick',
      botAId: input.botAId,
      botBId: input.botBId,
      configuredRounds: input.configuredRounds,
      record: createQuickSnapshot(input.botAId, input.botBId, input.configuredRounds),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveQuickMatch(session);
    startTransition(() => {
      setState((current) => ({
        ...current,
        quickMatches: [session, ...current.quickMatches.filter((item) => item.id !== session.id)]
      }));
    });

    return session;
  }

  async function saveQuickMatchSession(session: QuickMatchSession) {
    await saveQuickMatch(session);
    startTransition(() => {
      setState((current) => ({
        ...current,
        quickMatches: [session, ...current.quickMatches.filter((item) => item.id !== session.id)].sort(
          (a, b) => b.updatedAt - a.updatedAt
        )
      }));
    });
    return session;
  }

  async function createTournament(input: {
    name: string;
    participantBotIds: string[];
    configuredRounds: number;
  }) {
    const tournament = createTournamentRecord(input);
    await saveTournament(tournament);

    startTransition(() => {
      setState((current) => ({
        ...current,
        tournaments: [tournament, ...current.tournaments.filter((item) => item.id !== tournament.id)]
      }));
    });

    return tournament;
  }

  async function saveTournamentRecord(tournament: TournamentRecord) {
    await saveTournament(tournament);
    startTransition(() => {
      setState((current) => ({
        ...current,
        tournaments: [tournament, ...current.tournaments.filter((item) => item.id !== tournament.id)].sort(
          (a, b) => b.updatedAt - a.updatedAt
        )
      }));
    });

    return tournament;
  }

  function getBot(botId: string) {
    return bots.find((bot) => bot.id === botId);
  }

  function getTournamentById(tournamentId: string) {
    return state.tournaments.find((tournament) => tournament.id === tournamentId);
  }

  function getQuickMatchById(sessionId: string) {
    return state.quickMatches.find((session) => session.id === sessionId);
  }

  return (
    <ArenaContext.Provider
      value={{
        loading: state.loading,
        bots,
        customBots: state.customBots,
        tournaments: state.tournaments,
        quickMatches: state.quickMatches,
        importBotFromText,
        removeCustomBot,
        createQuickMatchSession,
        saveQuickMatchSession,
        createTournament,
        saveTournamentRecord,
        getBot,
        getTournamentById,
        getQuickMatchById
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
}

export function useArena() {
  const context = useContext(ArenaContext);
  if (!context) {
    throw new Error('useArena must be used inside ArenaProvider.');
  }

  return context;
}
