import { BookOpen, CalendarCheck, Compass, PenLine, type LucideIcon } from "lucide-react";
import GriotMark from "@/components/brand/GriotMark";
import { QUICK_ACTIONS, WELCOME_MESSAGE, type QuickAction } from "@/lib/constants";
import type { MentorIntent, MentorMode } from "@/lib/types";
import ModeNotice from "./ModeNotice";

const ICONS: Record<MentorIntent, LucideIcon> = {
  entender: BookOpen,
  organizar: CalendarCheck,
  mejorar: PenLine,
  proyecto: Compass,
};

interface Props {
  onQuickAction: (action: QuickAction) => void;
  disabled?: boolean;
  mode: MentorMode | null;
}

/** Estado de conversación vacía: bienvenida + cuatro opciones rápidas. */
export default function WelcomeScreen({ onQuickAction, disabled, mode }: Props) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="animate-fade-up text-center">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600/30 to-blue-600/30 blur-2xl"
            aria-hidden="true"
          />
          <GriotMark className="relative h-20 w-20" />
        </div>
        <h1 className="mx-auto max-w-xl text-2xl leading-snug font-semibold text-balance text-ink sm:text-3xl">
          {WELCOME_MESSAGE}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Elige por dónde empezar o escríbeme directamente lo que necesitas.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = ICONS[action.intent];
          return (
            <button
              key={action.intent}
              type="button"
              disabled={disabled}
              onClick={() => onQuickAction(action)}
              style={{ animationDelay: `${80 + i * 60}ms` }}
              className="group animate-fade-up flex items-start gap-3.5 rounded-2xl border border-line bg-panel-raised/50 p-4 text-left transition hover:border-violet-400/40 hover:bg-panel-raised focus-visible:outline-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-violet-200 ring-1 ring-white/10 transition group-hover:from-violet-500/30 group-hover:to-blue-500/30">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{action.title}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                  {action.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {(mode === "demo" || mode === "unconfigured") && (
        <div className="mt-8">
          <ModeNotice mode={mode} />
        </div>
      )}
    </div>
  );
}
