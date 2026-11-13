import { RotateCw, TriangleAlert } from "lucide-react";

interface Props {
  message: string;
  onRetry: () => void;
}

/** Estado de error con opción de reintentar el último mensaje. */
export default function ErrorNotice({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex animate-fade-up flex-col gap-3 rounded-xl border border-red-400/25 bg-red-500/[0.07] px-4 py-3 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-start gap-2.5">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
        <p className="text-[13px] leading-relaxed text-red-100/90">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-300/30 px-3 py-1.5 text-[13px] font-medium text-red-100 transition hover:bg-red-400/10 focus-visible:outline-2 focus-visible:outline-red-300"
      >
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
