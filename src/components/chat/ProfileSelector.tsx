import { PROFILES } from "@/lib/constants";
import type { StudentProfile } from "@/lib/types";

interface Props {
  value: StudentProfile;
  onChange: (profile: StudentProfile) => void;
}

/** Selector de los tres perfiles de estudiante del Personal Project. */
export default function ProfileSelector({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
        Tu perfil de aprendizaje
      </legend>
      <div className="space-y-1.5">
        {PROFILES.map((profile) => {
          const selected = profile.id === value;
          return (
            <button
              key={profile.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(profile.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-violet-400 ${
                selected
                  ? "border-violet-400/40 bg-violet-500/10"
                  : "border-transparent hover:border-line hover:bg-white/[0.03]"
              }`}
            >
              <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    selected ? "bg-gradient-to-br from-violet-400 to-blue-400" : "bg-white/15"
                  }`}
                  aria-hidden="true"
                />
                {profile.label}
              </span>
              <span className="mt-0.5 block pl-4 text-xs leading-snug text-muted">
                {profile.description}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-[11px] leading-relaxed text-faint">
        Puedes cambiarlo en cualquier momento: se aplica a la próxima respuesta y no borra la
        conversación.
      </p>
    </fieldset>
  );
}
