import type { ChatRequestBody, ChatResponseBody } from "./types";

/** Error con un mensaje en español listo para mostrar al estudiante. */
export class ChatRequestError extends Error {}

/** Llama al endpoint del servidor. El navegador nunca habla directamente con la IA. */
export async function requestMentorReply(body: ChatRequestBody): Promise<ChatResponseBody> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ChatRequestError(
      "No se ha podido conectar con GRIOT. Revisa tu conexión e inténtalo de nuevo.",
    );
  }

  const data: unknown = await res.json().catch(() => null);
  const record = (data ?? {}) as Partial<ChatResponseBody> & { error?: unknown };

  if (!res.ok) {
    throw new ChatRequestError(
      typeof record.error === "string"
        ? record.error
        : `Ha ocurrido un error inesperado (código ${res.status}).`,
    );
  }

  if (typeof record.reply !== "string" || (record.source !== "demo" && record.source !== "claude")) {
    throw new ChatRequestError("La respuesta de GRIOT no tiene el formato esperado.");
  }

  return { reply: record.reply, source: record.source };
}
