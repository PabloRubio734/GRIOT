"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, MentorMode } from "@/lib/types";
import ErrorNotice from "./ErrorNotice";
import MessageBubble from "./MessageBubble";
import ModeNotice from "./ModeNotice";
import TypingIndicator from "./TypingIndicator";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  mode: MentorMode | null;
}

export default function MessageList({ messages, isLoading, error, onRetry, mode }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  // Baja automáticamente al último mensaje.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isLoading, error]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      {(mode === "demo" || mode === "unconfigured") && (
        <div className="mb-6">
          <ModeNotice mode={mode} />
        </div>
      )}
      <div className="space-y-6" aria-live="polite">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && <ErrorNotice message={error} onRetry={onRetry} />}
      </div>
      <div ref={endRef} className="h-2" />
    </div>
  );
}
