import GriotMark from "@/components/brand/GriotMark";
import { PROFILE_SHORT_LABEL } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";
import MessageContent from "./MessageContent";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex animate-fade-up justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-violet-400/20 bg-gradient-to-br from-violet-600/25 to-blue-600/20 px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words text-ink sm:max-w-[75%]">
          <span className="sr-only">Tú: </span>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-up gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-raised ring-1 ring-line">
        <GriotMark className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-[0.2em] text-violet-200">
            GRIOT
          </span>
          {message.profile && (
            <span
              className="text-[11px] text-faint"
              title="Perfil de aprendizaje activo cuando se generó esta respuesta"
            >
              · Perfil {PROFILE_SHORT_LABEL[message.profile]}
            </span>
          )}
          {message.source === "demo" && (
            <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-200 uppercase">
              Respuesta de demostración
            </span>
          )}
        </div>
        <div className="text-[15px] leading-relaxed break-words text-ink/90">
          <MessageContent text={message.content} />
        </div>
      </div>
    </div>
  );
}
