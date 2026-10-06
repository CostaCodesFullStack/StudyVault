const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX = 5, WINDOW_MS = 15 * 60 * 1000;
/** Conta uma tentativa e informa se o limite foi excedido (em memória; adequado a uma instância). */
export function isLimited(key: string, now = Date.now()): boolean {
  const e = attempts.get(key);
  if (!e || e.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + WINDOW_MS }); return false; }
  e.count++;
  return e.count > MAX;
}
export const clearLimit = (key: string) => void attempts.delete(key);
