import type { AvatarSpec } from '../types';

export function createFallbackAvatar(name: string): { label: string; hue: number } {
  const label = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }

  return { label, hue: hash };
}

export function describeAvatar(avatar?: AvatarSpec): string {
  if (!avatar) {
    return 'Generated avatar';
  }

  return avatar.kind === 'emoji' ? `${avatar.value} avatar` : 'Custom image avatar';
}
