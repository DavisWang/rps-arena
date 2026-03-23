import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MatchupScreen } from '../components/MatchupScreen';
import { runMatchInWorker } from '../lib/matchRunnerClient';
import { createEmptySummary } from '../lib/moves';
import { findTournamentMatch, updateTournamentMatch } from '../lib/tournament';
import { useArena } from '../state/ArenaContext';
import type { TournamentRecord } from '../types';

export function TournamentMatchPage() {
  const { tournamentId, matchId } = useParams();
  const { getTournamentById, getBot, saveTournamentRecord } = useArena();
  const tournament = tournamentId ? getTournamentById(tournamentId) : undefined;
  const [localTournament, setLocalTournament] = useState<TournamentRecord | undefined>(tournament);
  const [running, setRunning] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const latestTournamentRef = useRef<TournamentRecord | undefined>(tournament);

  useEffect(() => {
    if (tournament) {
      setLocalTournament(tournament);
      latestTournamentRef.current = tournament;
    }
  }, [tournament]);

  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  if (!localTournament || !matchId) {
    return (
      <section className="panel">
        <h1>Tournament matchup not found</h1>
      </section>
    );
  }

  const activeTournament = localTournament;
  const match = findTournamentMatch(activeTournament, matchId);
  if (!match || !match.botAId || !match.botBId) {
    return (
      <section className="panel">
        <h1>Match is not ready yet</h1>
        <Link className="inline-link" to={`/tournaments/${activeTournament.id}`}>
          Back to bracket
        </Link>
      </section>
    );
  }

  const activeMatch = match;
  const botA = getBot(activeMatch.botAId);
  const botB = getBot(activeMatch.botBId);

  if (!botA || !botB) {
    return (
      <section className="panel">
        <h1>Bot definition missing</h1>
      </section>
    );
  }

  const readyBotA = botA;
  const readyBotB = botB;

  function persistTournament(nextTournament: TournamentRecord) {
    latestTournamentRef.current = nextTournament;
    setLocalTournament(nextTournament);
    void saveTournamentRecord(nextTournament);
  }

  function handleStart() {
    stopRef.current?.();

    const resetSnapshot = {
      ...activeMatch,
      status: 'in_progress' as const,
      summary: createEmptySummary(),
      currentRound: 0,
      recentRounds: [],
      winnerBotId: undefined,
      technicalForfeitBotId: undefined,
      errorMessage: undefined,
      completionReason: 'played' as const,
      updatedAt: Date.now(),
      startedAt: Date.now(),
      completedAt: undefined
    };

    const resetTournament = updateTournamentMatch(activeTournament, activeMatch.id, resetSnapshot);
    persistTournament(resetTournament);
    setRunning(true);

    stopRef.current = runMatchInWorker(
      {
        matchId: activeMatch.id,
        botA: readyBotA,
        botB: readyBotB,
        configuredRounds: activeMatch.configuredRounds,
        requireWinner: true,
        chunkSize: 25,
        recentRoundLimit: 18,
        timeoutMs: 250
      },
      {
        onProgress(snapshot) {
          const nextTournament = updateTournamentMatch(latestTournamentRef.current!, activeMatch.id, snapshot);
          persistTournament(nextTournament);
        },
        onComplete(snapshot) {
          const nextTournament = updateTournamentMatch(latestTournamentRef.current!, activeMatch.id, snapshot);
          persistTournament(nextTournament);
          setRunning(false);
        },
        onError(snapshot, message) {
          const nextTournament = updateTournamentMatch(latestTournamentRef.current!, activeMatch.id, {
            ...snapshot,
            errorMessage: message,
            updatedAt: Date.now()
          });
          persistTournament(nextTournament);
          setRunning(false);
        }
      }
    );
  }

  const refreshedMatch = findTournamentMatch(localTournament, match.id) ?? match;

  return (
    <MatchupScreen
      title="Tournament Match"
      subtitle={`${activeTournament.name} · winner advances to the next round`}
      backHref={`/tournaments/${activeTournament.id}`}
      backLabel="Back to bracket"
      asideLink={{ to: `/tournaments/${activeTournament.id}/results`, label: 'View results' }}
      botA={readyBotA}
      botB={readyBotB}
      snapshot={refreshedMatch}
      onStart={handleStart}
      running={running}
    />
  );
}
