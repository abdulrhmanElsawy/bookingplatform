/** Parses compact TTL like 15m, 7d, 12h into milliseconds. */
export function ttlToMs(value: string): number {
  const trimmed = value.trim();
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(trimmed);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const factors: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * (factors[unit] ?? 86_400_000);
}
