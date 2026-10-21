import "server-only";

// Lightweight per-runtime throttle for initial MVP testing. For production,
// replace with a shared/distributed limiter before exposing the paid API quota.
const windows = new Map<string, { count: number; reset: number }>();
export function allowPreview(ip: string): boolean {
  const now = Date.now();
  if (windows.size > 2000) windows.clear();
  const key = ip.slice(0, 90);
  const old = windows.get(key);
  if (!old || old.reset < now) {
    windows.set(key, { count: 1, reset: now + 60 * 60 * 1000 });
    return true;
  }
  if (old.count >= 5) return false;
  old.count++;
  return true;
}
