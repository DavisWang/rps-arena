import { createFallbackAvatar, describeAvatar } from '../lib/avatar';
import type { BotManifest } from '../types';

export function BotAvatar({ bot, size = 'medium' }: { bot: BotManifest; size?: 'small' | 'medium' | 'large' }) {
  const fallback = createFallbackAvatar(bot.name);

  return (
    <div className={`bot-avatar bot-avatar--${size}`} aria-label={describeAvatar(bot.avatar)}>
      {bot.avatar?.kind === 'emoji' ? (
        <span aria-hidden="true">{bot.avatar.value}</span>
      ) : bot.avatar?.kind === 'image' ? (
        <img src={bot.avatar.value} alt={bot.name} />
      ) : (
        <span
          aria-hidden="true"
          className="bot-avatar__fallback"
          style={{
            background: `linear-gradient(135deg, hsl(${fallback.hue} 70% 58%), hsl(${(fallback.hue + 45) % 360} 80% 35%))`
          }}
        >
          {fallback.label}
        </span>
      )}
    </div>
  );
}
