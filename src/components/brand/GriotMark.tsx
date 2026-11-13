import { useId } from "react";

/**
 * Símbolo original de GRIOT: dos rombos concéntricos y un núcleo.
 * Representa el conocimiento que se transmite desde un centro hacia fuera,
 * como el relato oral de un griot. No reproduce ningún logo existente.
 */
export default function GriotMark({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId();
  const gradient = `griot-gradient-${id}`;
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5 29.5 16 16 29.5 2.5 16Z"
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="1.5"
      />
      <path d="M16 8.5 23.5 16 16 23.5 8.5 16Z" fill={`url(#${gradient})`} opacity="0.28" />
      <path
        d="M16 8.5 23.5 16 16 23.5 8.5 16Z"
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="1"
        opacity="0.8"
      />
      <circle cx="16" cy="16" r="2.4" fill={`url(#${gradient})`} />
    </svg>
  );
}
