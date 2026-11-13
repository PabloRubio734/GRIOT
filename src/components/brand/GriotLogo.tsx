import GriotMark from "./GriotMark";

/** Logotipo tipográfico: símbolo + «GRIOT» con degradado violeta → azul. */
export default function GriotLogo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <GriotMark className="h-8 w-8 shrink-0" />
      <div className="leading-none">
        <span className="bg-gradient-to-r from-violet-300 via-violet-200 to-blue-300 bg-clip-text font-mono text-xl font-semibold tracking-[0.32em] text-transparent">
          GRIOT
        </span>
        {subtitle && (
          <p className="mt-1.5 text-[11px] font-medium tracking-wide text-faint">
            Mentor académico IB
          </p>
        )}
      </div>
    </div>
  );
}
