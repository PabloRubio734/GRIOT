import { getMentorReply } from "@/lib/mentor";
import { getMentorConfig } from "@/lib/mentor/config";
import { MentorError } from "@/lib/mentor/errors";
import { checkRateLimit } from "@/lib/mentor/rate-limit";
import { parseChatRequest } from "@/lib/mentor/validate";
import type { ChatErrorBody, ChatResponseBody } from "@/lib/types";

/** Tamaño máximo del cuerpo de la petición (bytes). */
const MAX_BODY_BYTES = 200_000;

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return Response.json({ error } satisfies ChatErrorBody, { status, headers });
}

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/**
 * POST /api/chat
 * Recibe el historial de la conversación y el perfil del estudiante,
 * lo valida, aplica el límite de solicitudes y devuelve la respuesta del mentor.
 */
export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return errorResponse("La conversación es demasiado larga. Empieza una nueva conversación.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("La petición no es un JSON válido.", 400);
  }

  const parsed = parseChatRequest(body);
  if (!parsed.ok) return errorResponse(parsed.error, 400);

  const config = getMentorConfig();
  const limit = checkRateLimit(clientKey(request), config.rateLimitPerMinute, config.rateLimitPerDay);
  if (!limit.ok) {
    return errorResponse(
      limit.reason === "minute"
        ? `Has enviado muchos mensajes seguidos. Espera ${limit.retryAfterSeconds} segundos e inténtalo de nuevo.`
        : "Se ha alcanzado el límite diario de mensajes de GRIOT. Vuelve a intentarlo mañana.",
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  try {
    const result = await getMentorReply(parsed.data);
    return Response.json(result satisfies ChatResponseBody);
  } catch (error) {
    if (error instanceof MentorError) return errorResponse(error.userMessage, error.status);
    // Solo se registra el tipo de error, nunca el contenido de la conversación.
    console.error("[griot] error inesperado:", error instanceof Error ? error.name : "desconocido");
    return errorResponse("GRIOT no ha podido generar una respuesta. Inténtalo de nuevo.", 500);
  }
}
