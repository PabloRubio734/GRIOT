/**
 * Estado de las conversaciones, guardado en sessionStorage.
 *
 * - Se conserva mientras la pestaña siga abierta (incluso si recargas).
 * - Se borra al cerrar la pestaña. No hay base de datos en la fase 1.
 *
 * Se usa con useSyncExternalStore para que el servidor (que no tiene
 * sessionStorage) y el navegador no entren en conflicto al hidratar.
 */
import { PROFILE_IDS } from "./constants";
import type { ChatMessage, Conversation, MentorIntent, StudentProfile } from "./types";

const STORAGE_KEY = "griot:session:v1";

export interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  profile: StudentProfile;
}

const INITIAL_STATE: ChatState = {
  conversations: [],
  activeId: null,
  profile: "comprension",
};

let state: ChatState | null = null;
const listeners = new Set<() => void>();

/** randomUUID solo existe en contextos seguros (https o localhost). */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function load(): ChatState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<ChatState>;
    if (!Array.isArray(parsed.conversations)) return INITIAL_STATE;
    return {
      conversations: parsed.conversations,
      activeId: typeof parsed.activeId === "string" ? parsed.activeId : null,
      profile: PROFILE_IDS.includes(parsed.profile as StudentProfile)
        ? (parsed.profile as StudentProfile)
        : INITIAL_STATE.profile,
    };
  } catch {
    return INITIAL_STATE;
  }
}

function persist(next: ChatState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena…): se mantiene en memoria.
  }
}

export function getState(): ChatState {
  if (state === null) state = load();
  return state;
}

export function getServerState(): ChatState {
  return INITIAL_STATE;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(updater: (prev: ChatState) => ChatState) {
  state = updater(getState());
  persist(state);
  listeners.forEach((l) => l());
}

function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 42 ? `${clean.slice(0, 42).trimEnd()}…` : clean;
}

export const chatActions = {
  /** Crea una conversación vacía, la activa y devuelve su id. */
  createConversation(firstMessage: string, intent?: MentorIntent): string {
    const id = createId();
    const now = Date.now();
    const conversation: Conversation = {
      id,
      title: titleFrom(firstMessage) || "Nueva conversación",
      intent,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setState((s) => ({ ...s, activeId: id, conversations: [conversation, ...s.conversations] }));
    return id;
  },

  appendMessage(conversationId: string, message: ChatMessage) {
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], updatedAt: message.createdAt }
          : c,
      ),
    }));
  },

  /** Sin conversación activa se muestra la pantalla de bienvenida. */
  startNew() {
    setState((s) => ({ ...s, activeId: null }));
  },

  select(conversationId: string) {
    setState((s) => ({ ...s, activeId: conversationId }));
  },

  remove(conversationId: string) {
    setState((s) => ({
      ...s,
      activeId: s.activeId === conversationId ? null : s.activeId,
      conversations: s.conversations.filter((c) => c.id !== conversationId),
    }));
  },

  setProfile(profile: StudentProfile) {
    setState((s) => ({ ...s, profile }));
  },
};
