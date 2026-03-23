export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(timestamp);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
