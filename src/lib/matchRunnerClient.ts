import type { BotManifest, MatchSnapshot } from '../types';

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

type WorkerResponse =
  | { type: 'progress'; snapshot: MatchSnapshot }
  | { type: 'complete'; snapshot: MatchSnapshot }
  | { type: 'error'; snapshot: MatchSnapshot; message: string };

export function runMatchInWorker(
  request: Omit<StartMatchRequest, 'type'>,
  handlers: {
    onProgress(snapshot: MatchSnapshot): void;
    onComplete(snapshot: MatchSnapshot): void;
    onError(snapshot: MatchSnapshot, message: string): void;
  }
) {
  const worker = new Worker(new URL('../workers/matchRunner.worker.ts', import.meta.url), {
    type: 'module'
  });

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const payload = event.data;

    if (payload.type === 'progress') {
      handlers.onProgress(payload.snapshot);
      return;
    }

    if (payload.type === 'complete') {
      handlers.onComplete(payload.snapshot);
      worker.terminate();
      return;
    }

    handlers.onError(payload.snapshot, payload.message);
    worker.terminate();
  };

  worker.postMessage({
    type: 'start',
    ...request
  } satisfies StartMatchRequest);

  return () => worker.terminate();
}
