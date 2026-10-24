/** Parse durations like `15m`, `7d` into whole seconds. */
export function durationToSeconds(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'ms':
      return Math.max(1, Math.ceil(amount / 1000));
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}
