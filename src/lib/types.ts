/**
 * Tipos compartidos entre la interfaz (cliente) y el endpoint /api/chat (servidor).
 */

export type Role = "user" | "assistant";

/** De dónde viene una respuesta del mentor: Claude (real) o plantillas (demo). */
export type ResponseSource = "demo" | "claude";

/** Modo en el que funciona el servidor. */
export type MentorMode = "claude" | "demo" | "unconfigured";

/** Los tres perfiles de estudiante definidos en el Personal Project. */
export type StudentProfile = "comprension" | "organizacion" | "profundizar";

/** Las cuatro intenciones de las opciones rápidas. */
export type MentorIntent = "entender" | "organizar" | "mejorar" | "proyecto";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  source?: ResponseSource;
  /** Solo en respuestas del mentor: perfil activo cuando se pidió la respuesta. */
  profile?: StudentProfile;
}

export interface Conversation {
  id: string;
  title: string;
  intent?: MentorIntent;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/** Cuerpo que el cliente envía a POST /api/chat. */
export interface ChatRequestBody {
  messages: { role: Role; content: string }[];
  profile: StudentProfile;
  intent?: MentorIntent;
  /** true si el navegador no ha enviado los mensajes más antiguos de la conversación. */
  historyTruncated?: boolean;
}

/** Respuesta correcta de POST /api/chat. */
export interface ChatResponseBody {
  reply: string;
  source: ResponseSource;
}

/** Respuesta de error de POST /api/chat. */
export interface ChatErrorBody {
  error: string;
}
