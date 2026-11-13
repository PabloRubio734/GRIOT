import { FlaskConical } from "lucide-react";

/** Aviso visible de que las respuestas son simuladas (fase 1). */
export default function DemoNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-100/90"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
      <p>
        <strong className="font-semibold text-amber-200">Modo demostración.</strong> Las respuestas
        de GRIOT son simuladas a partir de plantillas: todavía no las genera una inteligencia
        artificial.
      </p>
    </div>
  );
}
