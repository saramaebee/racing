// Parse / format race times. Storage unit is integer milliseconds.

// Accepts: "45.231" (seconds), "45" (seconds), "1:02.5" (m:ss.fff),
// "1:02:03.4" (h:mm:ss.fff). Returns null for blank/invalid input.
export function parseTimeToMs(input: string): number | null {
  const s = input.trim();
  if (s === '') return null;

  const parts = s.split(':');
  if (parts.length > 3) return null;

  let seconds = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isFinite(n) || n < 0) return null;
    seconds = seconds * 60 + n;
  }

  const ms = Math.round(seconds * 1000);
  return ms;
}

// Renders ms as "ss.fff", or "m:ss.fff" once it reaches a minute.
export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '';
  const totalSeconds = ms / 1000;
  if (totalSeconds >= 60) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds - m * 60;
    return `${m}:${s.toFixed(3).padStart(6, '0')}`;
  }
  return totalSeconds.toFixed(3);
}
