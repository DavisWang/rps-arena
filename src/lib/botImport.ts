import type { BotImportPayload, BotManifest } from '../types';

function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Bot JSON must be an object.');
  }
}

function parseAvatar(input: unknown): BotManifest['avatar'] {
  if (input == null) {
    return undefined;
  }

  assertObject(input);

  if (
    (input.kind !== 'emoji' && input.kind !== 'image') ||
    typeof input.value !== 'string' ||
    input.value.trim() === ''
  ) {
    throw new Error('Avatar must be { kind: "emoji" | "image", value: string }.');
  }

  return { kind: input.kind, value: input.value };
}

export async function validateBotSourceModule(source: string) {
  const url = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;

  try {
    const module = await import(/* @vite-ignore */ url);
    if (typeof module.decide !== 'function') {
      throw new Error('Bot source must export decide(context).');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown syntax or module error.';
    throw new Error(`Bot source could not be loaded: ${message}`);
  }
}

export async function parseImportedBot(
  text: string,
  existingBots: BotManifest[]
): Promise<BotManifest> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JSON parse error.';
    throw new Error(`Invalid JSON: ${message}`);
  }

  assertObject(parsed);

  if (typeof parsed.id !== 'string' || parsed.id.trim() === '') {
    throw new Error('Bot JSON must include a non-empty id.');
  }

  if (typeof parsed.name !== 'string' || parsed.name.trim() === '') {
    throw new Error('Bot JSON must include a non-empty name.');
  }

  if (typeof parsed.source !== 'string' || parsed.source.trim() === '') {
    throw new Error('Bot JSON must include a non-empty source string.');
  }

  if (parsed.description != null && typeof parsed.description !== 'string') {
    throw new Error('Bot description must be a string when provided.');
  }

  const botId = parsed.id.trim();
  const botName = parsed.name.trim();
  const existingBot = existingBots.find((bot) => bot.id === botId);
  if (existingBot?.isSeeded) {
    throw new Error(`Bot id "${botId}" collides with a seeded bot.`);
  }

  await validateBotSourceModule(parsed.source);

  const payload: BotImportPayload = {
    id: botId,
    name: botName,
    description: typeof parsed.description === 'string' ? parsed.description.trim() : undefined,
    avatar: parseAvatar(parsed.avatar),
    source: parsed.source
  };

  return {
    ...payload,
    isSeeded: false
  };
}

export const customBotTemplate = `{
  "id": "my-bot",
  "name": "My Bot",
  "description": "Optional short description",
  "avatar": { "kind": "emoji", "value": "🎯" },
  "source": "export function decide(context) {\\n  return 'rock';\\n}"
}`;
