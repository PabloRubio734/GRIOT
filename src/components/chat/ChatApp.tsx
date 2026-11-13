"use client";

import { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import type { QuickAction } from "@/lib/constants";
import ChatHeader from "./ChatHeader";
import Composer from "./Composer";
import MessageList from "./MessageList";
import Sidebar from "./Sidebar";
import WelcomeScreen from "./WelcomeScreen";

/** Pantalla principal de GRIOT: menú lateral + conversación + campo de texto. */
export default function ChatApp() {
  const chat = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = chat.activeConversation;
  const isEmpty = !active || active.messages.length === 0;
  const activeError =
    chat.error && active && chat.error.conversationId === active.id ? chat.error.message : null;
  const activeLoading = chat.isLoading && chat.pendingConversationId === active?.id;

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function handleNew() {
    chat.startNew();
    closeSidebar();
  }

  function handleQuickAction(action: QuickAction) {
    void chat.sendMessage(action.prompt, action.intent);
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        conversations={chat.conversations}
        activeId={active?.id ?? null}
        profile={chat.profile}
        onProfileChange={chat.setProfile}
        onNew={handleNew}
        onSelect={(id) => {
          chat.selectConversation(id);
          closeSidebar();
        }}
        onDelete={chat.deleteConversation}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          title={active?.title ?? "Nueva conversación"}
          mode={chat.mode}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNew={handleNew}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!chat.hydrated ? null : isEmpty ? (
            <WelcomeScreen
              onQuickAction={handleQuickAction}
              disabled={chat.isLoading}
              mode={chat.mode}
            />
          ) : (
            <MessageList
              messages={active.messages}
              isLoading={activeLoading}
              error={activeError}
              onRetry={chat.retry}
              mode={chat.mode}
            />
          )}
        </div>

        <Composer
          onSend={(text) => void chat.sendMessage(text)}
          disabled={chat.isLoading}
          profile={chat.profile}
        />
      </main>
    </div>
  );
}
