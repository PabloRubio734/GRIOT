"use client";

import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import GriotLogo from "@/components/brand/GriotLogo";
import type { Conversation, StudentProfile } from "@/lib/types";
import ProfileSelector from "./ProfileSelector";

interface Props {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  profile: StudentProfile;
  onProfileChange: (profile: StudentProfile) => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  open,
  onClose,
  conversations,
  activeId,
  profile,
  onProfileChange,
  onNew,
  onSelect,
  onDelete,
}: Props) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {/* Fondo oscuro detrás del menú en móvil */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="griot-sidebar"
        aria-label="Menú lateral"
        className={`fixed inset-y-0 left-0 z-40 flex w-[290px] max-w-[85vw] flex-col border-r border-line bg-panel/95 backdrop-blur-xl transition-transform duration-200 md:static md:z-auto md:max-w-none md:translate-x-0 md:bg-panel/70 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <GriotLogo />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-ink md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={onNew}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva conversación
          </button>
        </div>

        <nav aria-label="Conversaciones" className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Conversaciones de esta sesión
          </p>
          {sorted.length === 0 ? (
            <p className="px-2 py-3 text-[13px] leading-relaxed text-faint">
              Aún no hay conversaciones. Escribe un mensaje o elige una opción rápida para empezar.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {sorted.map((c) => {
                const active = c.id === activeId;
                return (
                  <li key={c.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-lg py-2 pr-9 pl-2.5 text-left text-[13px] transition-colors ${
                        active
                          ? "bg-white/[0.07] text-ink"
                          : "text-muted hover:bg-white/[0.04] hover:text-ink"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
                      <span className="truncate">{c.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("¿Eliminar esta conversación?")) onDelete(c.id);
                      }}
                      className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-faint opacity-100 transition hover:bg-white/5 hover:text-red-300 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label={`Eliminar conversación: ${c.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div className="border-t border-line px-4 pt-4 pb-5">
          <ProfileSelector value={profile} onChange={onProfileChange} />
          <p className="mt-4 px-1 text-[11px] leading-relaxed text-faint">
            Las conversaciones se guardan solo en esta pestaña y se borran al cerrarla.
          </p>
        </div>
      </aside>
    </>
  );
}
