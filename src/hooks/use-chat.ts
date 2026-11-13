"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChatRequestError, requestMentorReply } from "@/lib/chat-client";
import { chatActions, createId, getServerState, getState, subscribe } from "@/lib/chat-store";
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH } from "@/lib/constants";
import type { MentorIntent, MentorMode } from "@/lib/types";

const MODES: MentorMode[] = ["claude", "demo", "unconfigured"];

export interface ChatError {
  conversationId: string;
  message: string;
}

const noopSubscribe = () => () => {};

export function useChat() {
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  /** false durante el renderizado en el servidor y la hidratación; true después. */
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const busy = useRef(false);
  /** Modo del servidor; null mientras se consulta o si no se pudo averiguar. */
  const [mode, setMode] = useState<MentorMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { mode?: MentorMode } | null) => {
        if (!cancelled && data?.mode && MODES.includes(data.mode)) setMode(data.mode);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeId) ?? null;

  const requestReply = useCallback(async (conversationId: string) => {
    const conversation = getState().conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    // Perfil activo en el momento de pedir la respuesta (el perfil es global a la sesión).
    const profile = getState().profile;

    busy.current = true;
    setPendingId(conversationId);
    setError(null);
    try {
      const { reply, source } = await requestMentorReply({
        messages: conversation.messages
          .slice(-MAX_HISTORY_MESSAGES)
          .map(({ role, content }) => ({ role, content })),
        profile,
        intent: conversation.intent,
        historyTruncated: conversation.messages.length > MAX_HISTORY_MESSAGES,
      });
      chatActions.appendMessage(conversationId, {
        id: createId(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
        source,
        profile,
      });
    } catch (err) {
      setError({
        conversationId,
        message:
          err instanceof ChatRequestError
            ? err.message
            : "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
      });
    } finally {
      busy.current = false;
      setPendingId(null);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string, intent?: MentorIntent) => {
      const content = text.trim();
      if (!content || busy.current) return;
      if (content.length > MAX_MESSAGE_LENGTH) return;

      const { activeId } = getState();
      const conversationId = activeId ?? chatActions.createConversation(content, intent);

      chatActions.appendMessage(conversationId, {
        id: createId(),
        role: "user",
        content,
        createdAt: Date.now(),
      });
      await requestReply(conversationId);
    },
    [requestReply],
  );

  const retry = useCallback(() => {
    if (error && !busy.current) void requestReply(error.conversationId);
  }, [error, requestReply]);

  const startNew = useCallback(() => {
    setError(null);
    chatActions.startNew();
  }, []);

  return {
    hydrated,
    mode,
    conversations: state.conversations,
    activeConversation,
    profile: state.profile,
    isLoading: pendingId !== null,
    pendingConversationId: pendingId,
    error,
    sendMessage,
    retry,
    startNew,
    selectConversation: chatActions.select,
    deleteConversation: chatActions.remove,
    setProfile: chatActions.setProfile,
  };
}
