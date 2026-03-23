import type { BotExecutionContext, Move } from '../types';

type SandboxRequest =
  | { type: 'load'; requestId: string; source: string }
  | { type: 'decide'; requestId: string; context: BotExecutionContext };

type SandboxResponse =
  | { type: 'loaded'; requestId: string }
  | { type: 'result'; requestId: string; move: Move }
  | { type: 'error'; requestId: string; message: string };

let decideFunction: ((context: BotExecutionContext) => Move | Promise<Move>) | null = null;

async function loadDecider(source: string) {
  const url = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
  const module = await import(/* @vite-ignore */ url);

  if (typeof module.decide !== 'function') {
    throw new Error('Bot source must export decide(context).');
  }

  decideFunction = module.decide;
}

self.onmessage = async (event: MessageEvent<SandboxRequest>) => {
  const message = event.data;

  try {
    if (message.type === 'load') {
      await loadDecider(message.source);
      const response: SandboxResponse = { type: 'loaded', requestId: message.requestId };
      self.postMessage(response);
      return;
    }

    if (!decideFunction) {
      throw new Error('Bot was not loaded before decide was requested.');
    }

    const move = await decideFunction(message.context);
    const response: SandboxResponse = { type: 'result', requestId: message.requestId, move };
    self.postMessage(response);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown bot execution error.';
    const response: SandboxResponse = {
      type: 'error',
      requestId: message.requestId,
      message: messageText
    };
    self.postMessage(response);
  }
};
