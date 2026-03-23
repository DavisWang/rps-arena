/// <reference lib="webworker" />

import type { BotExecutionContext, BotManifest, MatchSnapshot, Move, RoundRecord } from '../types';
import { createEmptySummary, isMove, resolveRoundOutcome, updateSummary } from '../lib/moves';

type StartMatchRequest = {
  type: 'start';
  matchId: string;
  botA: BotManifest;
  botB: BotManifest;
  configuredRounds: number;
  requireWinner: boolean;
  chunkSize: number;
  recentRoundLimit: number;
  timeoutMs: number;
};

type SandboxRequest =
  | { type: 'load'; requestId: string; source: string }
  | { type: 'decide'; requestId: string; context: BotExecutionContext };

type SandboxResponse =
  | { type: 'loaded'; requestId: string }
  | { type: 'result'; requestId: string; move: Move }
  | { type: 'error'; requestId: string; message: string };

function now() {
  return Date.now();
}

function createBaseSnapshot(request: StartMatchRequest): MatchSnapshot {
  const timestamp = now();
  return {
    id: request.matchId,
    botAId: request.botA.id,
    botBId: request.botB.id,
    configuredRounds: request.configuredRounds,
    status: 'in_progress',
    summary: createEmptySummary(),
    currentRound: 0,
    recentRounds: [],
    startedAt: timestamp,
    updatedAt: timestamp,
    completionReason: 'played'
  };
}

function postProgress(snapshot: MatchSnapshot) {
  self.postMessage({ type: 'progress', snapshot });
}

function postComplete(snapshot: MatchSnapshot) {
  self.postMessage({ type: 'complete', snapshot });
}

function postError(snapshot: MatchSnapshot, message: string) {
  self.postMessage({ type: 'error', snapshot, message });
}

function createSandboxWorker() {
  return new Worker(new URL('./botSandbox.worker.ts', import.meta.url), { type: 'module' });
}

function sendSandboxRequest<T extends SandboxResponse>(
  worker: Worker,
  message: SandboxRequest,
  timeoutMs: number
) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Bot timed out.'));
    }, timeoutMs);

    const handleMessage = (event: MessageEvent<SandboxResponse>) => {
      if (event.data.requestId !== message.requestId) {
        return;
      }

      cleanup();

      if (event.data.type === 'error') {
        reject(new Error(event.data.message));
        return;
      }

      resolve(event.data as T);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      worker.removeEventListener('message', handleMessage);
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage(message);
  });
}

function createExecutionContext(
  roundIndex: number,
  configuredRounds: number,
  isSuddenDeath: boolean,
  selfHistory: Move[],
  opponentHistory: Move[],
  previousRound: RoundRecord | null
): BotExecutionContext {
  return {
    roundIndex,
    configuredRounds,
    isSuddenDeath,
    selfHistory: [...selfHistory],
    opponentHistory: [...opponentHistory],
    previousRound
  };
}

async function loadBot(worker: Worker, bot: BotManifest, timeoutMs: number) {
  await sendSandboxRequest(worker, { type: 'load', requestId: crypto.randomUUID(), source: bot.source }, timeoutMs);
}

self.onmessage = async (event: MessageEvent<StartMatchRequest>) => {
  const request = event.data;
  if (request.type !== 'start') {
    return;
  }

  const snapshot = createBaseSnapshot(request);
  const botAWorker = createSandboxWorker();
  const botBWorker = createSandboxWorker();
  const botAHistory: Move[] = [];
  const botBHistory: Move[] = [];
  let previousRound: RoundRecord | null = null;

  const cleanup = () => {
    botAWorker.terminate();
    botBWorker.terminate();
  };

  try {
    await Promise.all([
      loadBot(botAWorker, request.botA, request.timeoutMs),
      loadBot(botBWorker, request.botB, request.timeoutMs)
    ]);

    const runDecision = async (
      worker: Worker,
      context: BotExecutionContext
    ): Promise<Move> => {
      const response = await sendSandboxRequest<{ type: 'result'; requestId: string; move: Move }>(
        worker,
        { type: 'decide', requestId: crypto.randomUUID(), context },
        request.timeoutMs
      );

      if (!isMove(response.move)) {
        throw new Error(`Bot returned invalid move "${String(response.move)}".`);
      }

      return response.move;
    };

    const runRound = async (roundIndex: number, isSuddenDeath: boolean) => {
      const [botAResult, botBResult] = await Promise.allSettled([
        runDecision(
          botAWorker,
          createExecutionContext(
            roundIndex,
            request.configuredRounds,
            isSuddenDeath,
            botAHistory,
            botBHistory,
            previousRound
          )
        ),
        runDecision(
          botBWorker,
          createExecutionContext(
            roundIndex,
            request.configuredRounds,
            isSuddenDeath,
            botBHistory,
            botAHistory,
            previousRound
          )
        )
      ]);

      if (botAResult.status === 'rejected' || botBResult.status === 'rejected') {
        const bothFailed = botAResult.status === 'rejected' && botBResult.status === 'rejected';
        const offendingBotId =
          bothFailed || botAResult.status === 'rejected' ? request.botA.id : request.botB.id;
        const winnerBotId = bothFailed
          ? undefined
          : offendingBotId === request.botA.id
            ? request.botB.id
            : request.botA.id;

        const errorMessage = bothFailed
          ? `Both bots failed on round ${roundIndex + 1}.`
          : botAResult.status === 'rejected'
            ? botAResult.reason instanceof Error
              ? botAResult.reason.message
              : 'Bot A failed.'
            : botBResult.status === 'rejected' && botBResult.reason instanceof Error
              ? botBResult.reason.message
              : 'Bot B failed.';

        const forfeitSnapshot: MatchSnapshot = {
          ...snapshot,
          status: 'forfeit',
          winnerBotId,
          technicalForfeitBotId: offendingBotId,
          errorMessage,
          currentRound: roundIndex,
          updatedAt: now(),
          completedAt: now(),
          completionReason: 'forfeit'
        };

        Object.assign(snapshot, forfeitSnapshot);
        postComplete(snapshot);
        cleanup();
        return false;
      }

      const botAMove = botAResult.value;
      const botBMove = botBResult.value;
      const outcome = resolveRoundOutcome(botAMove, botBMove);

      botAHistory.push(botAMove);
      botBHistory.push(botBMove);

      const record: RoundRecord = {
        roundIndex,
        botAMove,
        botBMove,
        outcome,
        isSuddenDeath
      };

      previousRound = record;
      snapshot.currentRound = roundIndex + 1;
      snapshot.recentRounds = [...snapshot.recentRounds, record].slice(-request.recentRoundLimit);
      updateSummary(snapshot.summary, outcome, isSuddenDeath);
      snapshot.updatedAt = now();

      return true;
    };

    for (let roundIndex = 0; roundIndex < request.configuredRounds; roundIndex += 1) {
      const didContinue = await runRound(roundIndex, false);
      if (!didContinue) {
        return;
      }

      if ((roundIndex + 1) % request.chunkSize === 0 || roundIndex === request.configuredRounds - 1) {
        postProgress({ ...snapshot, summary: { ...snapshot.summary }, recentRounds: [...snapshot.recentRounds] });
      }
    }

    if (request.requireWinner) {
      let suddenDeathRound = 0;
      while (snapshot.summary.aWins === snapshot.summary.bWins) {
        const didContinue = await runRound(request.configuredRounds + suddenDeathRound, true);
        if (!didContinue) {
          return;
        }
        suddenDeathRound += 1;
        postProgress({ ...snapshot, summary: { ...snapshot.summary }, recentRounds: [...snapshot.recentRounds] });
      }
    }

    const winnerBotId =
      snapshot.summary.aWins === snapshot.summary.bWins
        ? undefined
        : snapshot.summary.aWins > snapshot.summary.bWins
          ? request.botA.id
          : request.botB.id;

    const completedSnapshot: MatchSnapshot = {
      ...snapshot,
      status: 'completed',
      winnerBotId,
      currentRound: snapshot.currentRound,
      updatedAt: now(),
      completedAt: now(),
      completionReason: 'played'
    };

    Object.assign(snapshot, completedSnapshot);
    postComplete(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown match runner error.';
    const errorSnapshot: MatchSnapshot = {
      ...snapshot,
      status: 'forfeit',
      technicalForfeitBotId: snapshot.botAId,
      errorMessage: message,
      updatedAt: now(),
      completedAt: now(),
      completionReason: 'forfeit'
    };
    postError(errorSnapshot, message);
  } finally {
    cleanup();
  }
};
