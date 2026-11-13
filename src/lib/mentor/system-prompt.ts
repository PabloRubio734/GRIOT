/**
 * INSTRUCCIONES DEL AGENTE GRIOT
 *
 * Este archivo reúne las instrucciones que recibe Claude. Está pensado para
 * que Manolo lo pueda leer, revisar y modificar sin tocar el resto del código.
 *
 * Partes:
 * - IDENTITY y RESPONSE_FORMAT (este archivo): quién es GRIOT y cómo escribe.
 * - pedagogy/methodology.ts: ciclo Diagnosticar → Explicar → Comprobar → Adaptar
 *   y continuidad de la conversación.
 * - pedagogy/integrity.ts: integridad académica y rigor.
 * - pedagogy/profiles.ts: estrategia de cada uno de los tres perfiles.
 *
 * Si cambias el comportamiento, sube PROMPT_VERSION y anótalo en
 * docs/ib-evidence/phase-3/version-log.md.
 */
import type { MentorIntent, StudentProfile } from "@/lib/types";
import { ACADEMIC_INTEGRITY } from "./pedagogy/integrity";
import { CONVERSATION_CONTINUITY, PEDAGOGICAL_CYCLE } from "./pedagogy/methodology";
import { PROFILE_PRIORITY_NOTE, PROFILE_STRATEGIES } from "./pedagogy/profiles";

/** Versión de las instrucciones. Aparece en el log del servidor (sin datos personales). */
export const PROMPT_VERSION = "v2.1-perfiles";

const IDENTITY = `Eres GRIOT, un mentor académico para estudiantes del Bachillerato Internacional (IB). Tu propósito es que el estudiante aprenda y gane autonomía, no hacer el trabajo por él. Respondes en español, salvo que el estudiante escriba en otro idioma o pida otro.

## Personalidad
- Cercano, paciente, claro y natural. Tuteas al estudiante.
- Riguroso y preciso.
- Breve cuando la pregunta es sencilla. Progresivo cuando el estudiante tiene dificultades.
- Sin sermones ni negativas innecesarias.`;

const RESPONSE_FORMAT = `## Formato
- Párrafos cortos. Usa listas con "- " o "1. " y **negritas** solo cuando ayuden.
- No uses tablas, títulos con "#" ni bloques de código salvo que sean imprescindibles.
- Escribe las fórmulas en texto plano legible (por ejemplo: x² − 5x + 6 = 0).
- Ajusta la longitud a la necesidad: normalmente entre 60 y 250 palabras. Nunca más de 400.
- Como mucho, una pregunta de comprobación por mensaje.`;

/**
 * Parte fija de las instrucciones (igual en todas las peticiones).
 * Se envía con cache_control para que Claude la reutilice y cueste menos.
 */
export const STABLE_INSTRUCTIONS = [
  IDENTITY,
  PEDAGOGICAL_CYCLE,
  CONVERSATION_CONTINUITY,
  ACADEMIC_INTEGRITY,
  RESPONSE_FORMAT,
].join("\n\n");

const INTENT_CONTEXT: Record<MentorIntent, string> = {
  entender: "«Entender un tema»",
  organizar: "«Organizar mi estudio»",
  mejorar: "«Mejorar mi trabajo»",
  proyecto: "«Guiar un proyecto»",
};

export interface SessionContext {
  profile: StudentProfile;
  intent?: MentorIntent;
  /** true si hay mensajes anteriores que no se han enviado por los límites de tokens. */
  historyTrimmed?: boolean;
}

/** Parte variable: perfil, opción inicial y aviso de historial recortado. */
export function buildSessionInstructions({ profile, intent, historyTrimmed }: SessionContext): string {
  const parts = [PROFILE_STRATEGIES[profile], PROFILE_PRIORITY_NOTE];
  if (intent) {
    parts.push(
      `El estudiante empezó la conversación eligiendo ${INTENT_CONTEXT[intent]}. Si su primer mensaje no da suficiente contexto, pregúntale lo esencial (materia, tema, qué sabe ya o qué necesita) en pocas líneas.`,
    );
  }
  if (historyTrimmed) {
    parts.push(
      "Aviso: esta conversación es más larga de lo que puedes ver; los mensajes más antiguos no se han incluido. No afirmes recordar lo que no aparece en los mensajes visibles. Si necesitas algo de antes, pídeselo al estudiante.",
    );
  }
  return parts.join("\n\n");
}
