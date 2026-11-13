import {
  INTENT_IDS,
  MAX_ASSISTANT_MESSAGE_LENGTH,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_LENGTH,
  PROFILE_IDS,
} from "@/lib/constants";
import type { ChatRequestBody, MentorIntent, Role, StudentProfile } from "@/lib/types";

type ParseResult = { ok: true; data: ChatRequestBody } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Valida en el servidor todo lo que llega del navegador antes de enviarlo
 * a Claude. Nunca hay que confiar en el cliente.
 */
export function parseChatRequest(input: unknown): ParseResult {
  if (!isRecord(input)) return { ok: false, error: "La petición no tiene un formato válido." };

  const { messages, profile, intent, historyTruncated } = input;

  if (historyTruncated !== undefined && typeof historyTruncated !== "boolean") {
    return { ok: false, error: "La petición no tiene un formato válido." };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "La conversación está vacía." };
  }

  const recent = messages.slice(-MAX_HISTORY_MESSAGES);
  const clean: ChatRequestBody["messages"] = [];

  for (const m of recent) {
    if (!isRecord(m)) return { ok: false, error: "Hay un mensaje con formato inválido." };
    const role = m.role as Role;
    const content = m.content;
    if (role !== "user" && role !== "assistant") {
      return { ok: false, error: "Hay un mensaje con un rol desconocido." };
    }
    if (typeof content !== "string" || content.trim().length === 0) {
      return { ok: false, error: "Hay un mensaje vacío." };
    }
    const limit = role === "user" ? MAX_MESSAGE_LENGTH : MAX_ASSISTANT_MESSAGE_LENGTH;
    if (content.length > limit) {
      return {
        ok: false,
        error: `El mensaje es demasiado largo (máximo ${MAX_MESSAGE_LENGTH} caracteres).`,
      };
    }
    clean.push({ role, content });
  }

  if (clean[clean.length - 1].role !== "user") {
    return { ok: false, error: "El último mensaje debe ser del estudiante." };
  }

  if (typeof profile !== "string" || !PROFILE_IDS.includes(profile as StudentProfile)) {
    return { ok: false, error: "El perfil de estudiante no es válido." };
  }

  if (intent !== undefined && intent !== null && !INTENT_IDS.includes(intent as MentorIntent)) {
    return { ok: false, error: "La opción elegida no es válida." };
  }

  return {
    ok: true,
    data: {
      messages: clean,
      profile: profile as StudentProfile,
      intent: (intent ?? undefined) as MentorIntent | undefined,
      // También cuenta como recortada si el servidor ha descartado mensajes aquí.
      historyTruncated: historyTruncated === true || messages.length > recent.length,
    },
  };
}
