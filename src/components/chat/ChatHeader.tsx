import { Menu, SquarePen } from "lucide-react";
import GriotMark from "@/components/brand/GriotMark";
import type { MentorMode } from "@/lib/types";

const BADGES: Record<MentorMode, { label: string; title: string; className: string }> = {
  demo: {
    label: "Modo demostración",
    title: "Las respuestas son simuladas a partir de plantillas.",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  },
  claude: {
    label: "IA conectada",
    title: "Las respuestas las genera Claude, de Anthropic.",
    className: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  },
  unconfigured: {
    label: "Sin configurar",
    title: "Falta configurar la conexión con Claude en el servidor.",
    className: "border-red-400/30 bg-red-500/10 text-red-200",
  },
};

interface Props {
  title: string;
  mode: MentorMode | null;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  onNew: () => void;
}

export default function ChatHeader({ title, mode, sidebarOpen, onOpenSidebar, onNew }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-night/60 px-3 backdrop-blur-xl sm:px-5">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-ink md:hidden"
        aria-label="Abrir menú"
        aria-controls="griot-sidebar"
        aria-expanded={sidebarOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      <GriotMark className="h-5 w-5 md:hidden" />
      <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{title}</h2>

      {mode && (
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${BADGES[mode].className}`}
          title={BADGES[mode].title}
        >
          {BADGES[mode].label}
        </span>
      )}

      <button
        type="button"
        onClick={onNew}
        className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-ink md:hidden"
        aria-label="Nueva conversación"
      >
        <SquarePen className="h-5 w-5" />
      </button>
    </header>
  );
}
