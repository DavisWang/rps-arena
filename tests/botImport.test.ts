import { describe, expect, it } from 'vitest';
import { parseImportedBot, validateBotSourceModule } from '../src/lib/botImport';
import type { BotManifest } from '../src/types';

describe('bot import', () => {
  const seeded: BotManifest[] = [
    {
      id: 'pibot',
      name: 'PiBot',
      source: "export function decide() { return 'rock'; }",
      isSeeded: true
    }
  ];

  it('validates good source modules', async () => {
    await expect(
      validateBotSourceModule("export function decide() { return 'rock'; }")
    ).resolves.toBeUndefined();
  });

  it('rejects source modules without decide', async () => {
    await expect(
      validateBotSourceModule("export function nope() { return 'rock'; }")
    ).rejects.toThrow(/export decide/i);
  });

  it('parses imported bot manifests', async () => {
    const bot = await parseImportedBot(
      JSON.stringify({
        id: 'local-bot',
        name: 'Local Bot',
        description: 'trusted bot',
        avatar: { kind: 'emoji', value: '🎯' },
        source: "export function decide() { return 'paper'; }"
      }),
      seeded
    );

    expect(bot).toMatchObject({
      id: 'local-bot',
      name: 'Local Bot',
      isSeeded: false
    });
  });

  it('rejects collisions with seeded bot ids', async () => {
    await expect(
      parseImportedBot(
        JSON.stringify({
          id: 'pibot',
          name: 'Clone',
          source: "export function decide() { return 'scissors'; }"
        }),
        seeded
      )
    ).rejects.toThrow(/collides with a seeded bot/i);
  });
});
