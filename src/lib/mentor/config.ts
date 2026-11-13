/**
 * CONFIGURACIÓN DEL MENTOR (solo servidor)
 *
 * Todos los valores salen de variables de entorno (.env.local en local).
 * La clave de la API se lee aquí y nunca se envía al navegador.
 */
import "server-only";
import type { MentorMode } from "@/lib/types";

export type { MentorMode };

type Effort = "low" | "medium" | "high";
const EFFORTS: Effort[] = ["low", "medium", "high"];

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function getMentorConfig() {
  const effort = process.env.ANTHROPIC_EFFORT as Effort | undefined;
  return {
    /** Modo demostración: solo si se activa explícitamente con GRIOT_DEMO_MODE=true. */
    demoMode: process.env.GRIOT_DEMO_MODE === "true",
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    /** Modelo de Claude. Sin valor por defecto: hay que elegirlo a propósito. */
    model: process.env.ANTHROPIC_MODEL?.trim() ?? "",
    /** Esfuerzo de razonamiento: "low" gasta menos tokens. */
    effort: effort && EFFORTS.includes(effort) ? effort : "low",
    /** Tope de tokens de salida por respuesta (incluye el razonamiento interno). */
    maxOutputTokens: intFromEnv("GRIOT_MAX_OUTPUT_TOKENS", 1500, 256, 4000),
    /** Mensajes del historial que se envían a Claude (los más recientes). */
    maxHistoryMessages: intFromEnv("GRIOT_MAX_HISTORY_MESSAGES", 12, 2, 40),
    /** Caracteres totales máximos del historial enviado a Claude. */
    maxHistoryChars: intFromEnv("GRIOT_MAX_HISTORY_CHARS", 16000, 2000, 60000),
    /** Límite de solicitudes por minuto y por cliente (pruebas locales). */
    rateLimitPerMinute: intFromEnv("GRIOT_RATE_LIMIT_PER_MINUTE", 8, 1, 120),
    /** Límite de solicitudes por día para todo el servidor (protege el presupuesto). */
    rateLimitPerDay: intFromEnv("GRIOT_RATE_LIMIT_PER_DAY", 150, 1, 10000),
  };
}

export function getMentorMode(): MentorMode {
  const config = getMentorConfig();
  if (config.demoMode) return "demo";
  if (config.hasApiKey && config.model) return "claude";
  return "unconfigured";
}
