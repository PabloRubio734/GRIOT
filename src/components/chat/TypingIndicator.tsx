import GriotMark from "@/components/brand/GriotMark";

/** Indicador de carga mientras el mentor prepara la respuesta. */
export default function TypingIndicator() {
  return (
    <div className="flex animate-fade-up gap-3" role="status" aria-live="polite">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-raised ring-1 ring-line">
        <GriotMark className="h-5 w-5 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-line bg-panel-raised/60 px-4 py-3">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-dot rounded-full bg-gradient-to-br from-violet-400 to-blue-400"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span className="text-[13px] text-muted">GRIOT está pensando…</span>
      </div>
    </div>
  );
}
