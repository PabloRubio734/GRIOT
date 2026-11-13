"use client";

import { ArrowUp } from "lucide-react";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_MESSAGE_LENGTH, PROFILE_SHORT_LABEL } from "@/lib/constants";
import type { StudentProfile } from "@/lib/types";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  /** Perfil activo: se aplicará a la próxima respuesta. */
  profile: StudentProfile;
}

const MAX_HEIGHT = 200;

function resize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
}

/** Campo para escribir mensajes. Enter envía; Mayús + Enter añade una línea. */
export default function Composer({ onSend, disabled, profile }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !disabled;
  const nearLimit = value.length > MAX_MESSAGE_LENGTH * 0.85;

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    onSend(value);
    setValue("");
    requestAnimationFrame(() => resize(ref.current));
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-line bg-night/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-6">
      <form onSubmit={submit} className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-line-strong bg-panel-raised/70 p-2 pl-4 transition focus-within:border-violet-400/50 focus-within:ring-4 focus-within:ring-violet-500/10">
          <label htmlFor="griot-input" className="sr-only">
            Escribe tu mensaje para GRIOT
          </label>
          <textarea
            id="griot-input"
            ref={ref}
            rows={1}
            value={value}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => {
              setValue(e.target.value);
              resize(e.target);
            }}
            onKeyDown={onKeyDown}
            placeholder="Escribe tu pregunta, tu tema o lo que necesitas…"
            className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 text-ink placeholder:text-faint focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Enviar mensaje"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-md shadow-violet-900/40 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-faint disabled:shadow-none"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] text-faint">
          <span>
            <span
              className="text-violet-200/90"
              title="Puedes cambiarlo en el menú lateral. Se aplica a la próxima respuesta."
            >
              Perfil activo: <strong className="font-semibold">{PROFILE_SHORT_LABEL[profile]}</strong>
            </span>
            <span aria-hidden="true"> · </span>
            GRIOT puede equivocarse. Contrasta la información importante.
          </span>
          {nearLimit && (
            <span className="shrink-0 tabular-nums text-amber-300/80">
              {value.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
