/**
 * COMUNICACIÓN CON ANTHROPIC CLAUDE (solo servidor)
 *
 * Usa el SDK oficial @anthropic-ai/sdk. La clave se lee de ANTHROPIC_API_KEY
 * en el servidor; este archivo nunca se incluye en el código del navegador.
 *
 * Privacidad: no se registra el contenido de las conversaciones. En los logs
 * solo aparecen el modelo, los tokens usados y el motivo de parada.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatRequestBody } from "@/lib/types";
import { getMentorConfig } from "./config";
import { MentorError } from "./errors";
import { buildSessionInstructions, PROMPT_VERSION, STABLE_INSTRUCTIONS } from "./system-prompt";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  // Lee ANTHROPIC_API_KEY del entorno. Un solo reintento y 45 s de espera máxima.
  client ??= new Anthropic({ maxRetries: 1, timeout: 45_000 });
  return client;
}

/**
 * Recorta el historial para controlar el consumo de tokens.
 * Devuelve también si se ha quitado algún mensaje, para avisar a Claude.
 */
export function trimHistory(
  messages: ChatRequestBody["messages"],
  maxMessages: number,
  maxChars: number,
): { messages: Anthropic.MessageParam[]; trimmed: boolean } {
  const recent = messages.slice(-maxMessages);

  // Elimina los mensajes más antiguos hasta respetar el máximo de caracteres
  // (siempre se conserva el último mensaje del estudiante).
  let total = recent.reduce((sum, m) => sum + m.content.length, 0);
  while (recent.length > 1 && total > maxChars) {
    total -= recent.shift()!.content.length;
  }
  // La conversación enviada a Claude debe empezar con un mensaje del estudiante.
  while (recent.length > 1 && recent[0].role !== "user") recent.shift();

  return {
    messages: recent.map(({ role, content }) => ({ role, content })),
    trimmed: recent.length < messages.length,
  };
}

/**
 * Instrucciones de sistema en dos bloques:
 * 1. Fijo (metodología, integridad, formato), marcado para caché.
 * 2. Variable (perfil, opción inicial, aviso de historial recortado).
 */
export function buildSystemBlocks(
  request: ChatRequestBody,
  historyTrimmed: boolean,
): Anthropic.TextBlockParam[] {
  return [
    { type: "text", text: STABLE_INSTRUCTIONS, cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: buildSessionInstructions({
        profile: request.profile,
        intent: request.intent,
        historyTrimmed,
      }),
    },
  ];
}

function toMentorError(error: unknown): MentorError {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new MentorError(
      "GRIOT no puede conectarse con Claude: la clave de la API no es válida o no tiene permisos. Revisa la configuración del servidor.",
      500,
      `anthropic_auth_${error.status}`,
    );
  }
  if (error instanceof Anthropic.NotFoundError) {
    return new MentorError(
      "El modelo configurado en ANTHROPIC_MODEL no está disponible para esta cuenta.",
      500,
      "anthropic_model_not_found",
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new MentorError(
      "Claude está recibiendo demasiadas solicitudes en este momento. Espera un minuto e inténtalo de nuevo.",
      429,
      "anthropic_rate_limit",
    );
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new MentorError(
      "Claude ha rechazado la solicitud. Puede deberse a falta de créditos en la cuenta o a un problema de configuración.",
      502,
      "anthropic_bad_request",
    );
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new MentorError("Claude ha tardado demasiado en responder. Inténtalo de nuevo.", 504, "anthropic_timeout");
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new MentorError(
      "No se ha podido conectar con Claude. Revisa la conexión a internet del servidor.",
      503,
      "anthropic_connection",
    );
  }
  if (error instanceof Anthropic.APIError) {
    return new MentorError(
      "Claude no está disponible en este momento. Inténtalo de nuevo en unos minutos.",
      503,
      `anthropic_api_${error.status ?? "unknown"}`,
    );
  }
  return new MentorError("GRIOT no ha podido generar una respuesta. Inténtalo de nuevo.", 500, "unknown");
}

export async function generateClaudeReply(request: ChatRequestBody): Promise<string> {
  const config = getMentorConfig();
  const { messages, trimmed } = trimHistory(
    request.messages,
    config.maxHistoryMessages,
    config.maxHistoryChars,
  );
  // El navegador también puede haber recortado mensajes antiguos antes de enviarlos.
  const historyTrimmed = trimmed || request.historyTruncated === true;

  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create({
      model: config.model,
      max_tokens: config.maxOutputTokens,
      // Pensamiento adaptativo con esfuerzo bajo: en preguntas sencillas
      // el modelo puede responder sin razonar, lo que ahorra tokens.
      thinking: { type: "adaptive" },
      output_config: { effort: config.effort },
      system: buildSystemBlocks(request, historyTrimmed),
      messages,
    });
  } catch (error) {
    const mentorError = toMentorError(error);
    console.error(`[griot] error de Claude: ${mentorError.code}`);
    throw mentorError;
  }

  const { usage } = response;
  console.info(
    `[griot] prompt=${PROMPT_VERSION} perfil=${request.profile} modelo=${response.model} ` +
      `entrada=${usage.input_tokens} cache_leida=${usage.cache_read_input_tokens ?? 0} ` +
      `cache_escrita=${usage.cache_creation_input_tokens ?? 0} salida=${usage.output_tokens} ` +
      `recortado=${historyTrimmed} parada=${response.stop_reason}`,
  );

  if (response.stop_reason === "refusal") {
    throw new MentorError(
      "GRIOT no puede ayudar con esta solicitud. Prueba a reformularla o pregunta por otro tema académico.",
      422,
      "refusal",
    );
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) {
    throw new MentorError(
      "GRIOT no ha llegado a escribir una respuesta. Prueba a hacer una pregunta más concreta.",
      502,
      `empty_${response.stop_reason}`,
    );
  }

  if (response.stop_reason === "max_tokens") {
    return `${text}\n\n(La respuesta se ha cortado por longitud. Escríbeme «continúa» si necesitas el resto.)`;
  }
  return text;
}
