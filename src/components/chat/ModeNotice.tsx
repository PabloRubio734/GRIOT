import { TriangleAlert } from "lucide-react";
import type { MentorMode } from "@/lib/types";
import DemoNotice from "./DemoNotice";

/** Aviso según el modo del servidor. En modo Claude no se muestra nada. */
export default function ModeNotice({ mode }: { mode: MentorMode | null }) {
  if (mode === "demo") return <DemoNotice />;
  if (mode === "unconfigured") {
    return (
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-500/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-red-100/90"
      >
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-red-200">GRIOT no está configurado.</strong> Falta la
          conexión con Claude en el servidor, así que no podrá responder.
        </p>
      </div>
    );
  }
  return null;
}
