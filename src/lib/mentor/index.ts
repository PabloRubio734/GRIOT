/**
 * PUNTO ÚNICO DE CONEXIÓN DEL MENTOR (solo servidor)
 *
 * Toda la interfaz habla con /api/chat, y /api/chat solo llama a esta función.
 *
 * - Modo "claude": respuesta real de Claude (por defecto si hay clave y modelo).
 * - Modo "demo": respuestas simuladas, SOLO si GRIOT_DEMO_MODE=true.
 *   Se marcan siempre como demostración en la interfaz.
 * - Si Claude falla, se devuelve un error: nunca se sustituye en silencio
 *   una respuesta real por una simulada.
 */
import "server-only";
import type { ChatRequestBody, ChatResponseBody } from "@/lib/types";
import { generateClaudeReply } from "./claude";
import { getMentorMode } from "./config";
import { generateDemoReply } from "./demo-responder";
import { MentorError } from "./errors";

/** Retardo artificial para que el indicador de carga sea visible en la demo. */
function simulatedLatency(): Promise<void> {
  const ms = 700 + Math.floor(Math.random() * 700);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMentorReply(request: ChatRequestBody): Promise<ChatResponseBody> {
  const mode = getMentorMode();

  if (mode === "demo") {
    await simulatedLatency();
    return { reply: generateDemoReply(request), source: "demo" };
  }

  if (mode === "unconfigured") {
    throw new MentorError(
      "GRIOT todavía no está configurado: faltan ANTHROPIC_API_KEY o ANTHROPIC_MODEL en .env.local (o activa GRIOT_DEMO_MODE=true para usar la demostración).",
      503,
      "unconfigured",
    );
  }

  return { reply: await generateClaudeReply(request), source: "claude" };
}
