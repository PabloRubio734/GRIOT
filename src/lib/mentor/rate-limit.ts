/**
 * Limitación básica de solicitudes, en memoria, para las pruebas locales.
 * - Por cliente: N solicitudes por minuto.
 * - Global: M solicitudes por día (protege el presupuesto de la API).
 * Se reinicia al reiniciar el servidor. No es adecuada para producción.
 */
import "server-only";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const perClient = new Map<string, number[]>();
let day = { start: Date.now(), count: 0 };

export type RateLimitResult = { ok: true } | { ok: false; reason: "minute" | "day"; retryAfterSeconds: number };

export function checkRateLimit(clientKey: string, perMinute: number, perDay: number): RateLimitResult {
  const now = Date.now();

  if (now - day.start >= DAY) day = { start: now, count: 0 };
  if (day.count >= perDay) {
    return { ok: false, reason: "day", retryAfterSeconds: Math.ceil((day.start + DAY - now) / 1000) };
  }

  const recent = (perClient.get(clientKey) ?? []).filter((t) => now - t < MINUTE);
  if (recent.length >= perMinute) {
    perClient.set(clientKey, recent);
    return { ok: false, reason: "minute", retryAfterSeconds: Math.ceil((recent[0] + MINUTE - now) / 1000) };
  }

  recent.push(now);
  perClient.set(clientKey, recent);
  day.count += 1;

  // Limpieza ocasional para que el mapa no crezca sin control.
  if (perClient.size > 500) {
    for (const [key, times] of perClient) {
      if (times.every((t) => now - t >= MINUTE)) perClient.delete(key);
    }
  }
  return { ok: true };
}
