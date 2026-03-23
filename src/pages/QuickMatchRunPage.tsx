import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { runMatchInWorker } from '../lib/matchRunnerClient';
import { useArena } from '../state/ArenaContext';
import { MatchupScreen } from '../components/MatchupScreen';
import type { QuickMatchSession } from '../types';
import { createEmptySummary } from '../lib/moves';

export function QuickMatchRunPage() {
  const { sessionId } = useParams();
  const { getQuickMatchById, getBot, saveQuickMatchSession } = useArena();
  const session = sessionId ? getQuickMatchById(sessionId) : undefined;
  const [localSession, setLocalSession] = useState<QuickMatchSession | undefined>(session);
  const [running, setRunning] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const latestSessionRef = useRef<QuickMatchSession | undefined>(session);

  useEffect(() => {
    if (session) {
      setLocalSession(session);
      latestSessionRef.current = session;
    }
  }, [session]);

  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  if (!localSession) {
    return (
      <section className="panel">
        <h1>Quick match not found</h1>
        <Link className="inline-link" to="/quick-match">
          Return to quick match setup
        </Link>
      </section>
    );
  }

  const activeSession = localSession;
  const botA = getBot(activeSession.botAId);
  const botB = getBot(activeSession.botBId);

  if (!botA || !botB) {
    return (
      <section className="panel">
        <h1>Bot definition missing</h1>
      </section>
    );
  }

  const readyBotA = botA;
  const readyBotB = botB;

  function persistSession(nextSession: QuickMatchSession) {
    latestSessionRef.current = nextSession;
    setLocalSession(nextSession);
    void saveQuickMatchSession(nextSession);
  }

  function handleStart() {
    stopRef.current?.();

    const resetRecord = {
      ...activeSession.record,
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

    const resetSession = {
      ...activeSession,
      record: resetRecord,
      updatedAt: Date.now()
    };

    persistSession(resetSession);
    setRunning(true);

    stopRef.current = runMatchInWorker(
      {
        matchId: resetRecord.id,
        botA: readyBotA,
        botB: readyBotB,
        configuredRounds: resetRecord.configuredRounds,
        requireWinner: false,
        chunkSize: 25,
        recentRoundLimit: 18,
        timeoutMs: 250
      },
      {
        onProgress(snapshot) {
          const nextSession = {
            ...latestSessionRef.current!,
            record: snapshot,
            updatedAt: Date.now()
          };
          persistSession(nextSession);
        },
        onComplete(snapshot) {
          const nextSession = {
            ...latestSessionRef.current!,
            record: snapshot,
            updatedAt: Date.now()
          };
          persistSession(nextSession);
          setRunning(false);
        },
        onError(snapshot, message) {
          const nextSession = {
            ...latestSessionRef.current!,
            record: {
              ...snapshot,
              errorMessage: message,
              updatedAt: Date.now()
            },
            updatedAt: Date.now()
          };
          persistSession(nextSession);
          setRunning(false);
        }
      }
    );
  }

  return (
    <MatchupScreen
      title="Quick Match"
      subtitle="Direct bot-vs-bot simulation outside the tournament bracket."
      backHref="/quick-match"
      backLabel="Back to setup"
      botA={readyBotA}
      botB={readyBotB}
      snapshot={activeSession.record}
      onStart={handleStart}
      running={running}
    />
  );
}
