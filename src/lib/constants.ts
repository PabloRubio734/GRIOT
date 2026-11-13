import type { MentorIntent, StudentProfile } from "./types";

/** Longitud máxima de un mensaje del estudiante (caracteres). */
export const MAX_MESSAGE_LENGTH = 4000;

/** Longitud máxima aceptada para un mensaje del mentor en el historial. */
export const MAX_ASSISTANT_MESSAGE_LENGTH = 12000;

/**
 * Número máximo de mensajes de historial que el navegador envía al endpoint.
 * El servidor recorta después a GRIOT_MAX_HISTORY_MESSAGES antes de llamar a Claude.
 */
export const MAX_HISTORY_MESSAGES = 20;

export const WELCOME_MESSAGE =
  "Hola, soy GRIOT. Estoy aquí para ayudarte a aprender, no para hacer el trabajo por ti.";

export interface ProfileInfo {
  id: StudentProfile;
  label: string;
  /** Nombre corto para etiquetas (respuestas y campo de texto). */
  shortLabel: string;
  description: string;
}

export const PROFILES: ProfileInfo[] = [
  {
    id: "comprension",
    label: "Necesito entender mejor",
    shortLabel: "Comprensión",
    description: "Explicaciones paso a paso, con ejemplos y lenguaje sencillo.",
  },
  {
    id: "organizacion",
    label: "Necesito organizarme",
    shortLabel: "Organización",
    description: "Planes, listas y tareas divididas en pasos concretos.",
  },
  {
    id: "profundizar",
    label: "Quiero profundizar",
    shortLabel: "Profundización",
    description: "Retos, conexiones entre materias y pensamiento crítico.",
  },
];

export const PROFILE_IDS: StudentProfile[] = PROFILES.map((p) => p.id);

export const PROFILE_SHORT_LABEL = Object.fromEntries(
  PROFILES.map((p) => [p.id, p.shortLabel]),
) as Record<StudentProfile, string>;

export interface QuickAction {
  intent: MentorIntent;
  title: string;
  description: string;
  /** Mensaje que se envía en nombre del estudiante al pulsar la opción. */
  prompt: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    intent: "entender",
    title: "Entender un tema",
    description: "Explicaciones adaptadas con ejemplos.",
    prompt: "Quiero entender un tema.",
  },
  {
    intent: "organizar",
    title: "Organizar mi estudio",
    description: "Prioridades, planes y tiempos.",
    prompt: "Quiero organizar mi estudio.",
  },
  {
    intent: "mejorar",
    title: "Mejorar mi trabajo",
    description: "Retroalimentación específica y constructiva.",
    prompt: "Quiero mejorar un trabajo.",
  },
  {
    intent: "proyecto",
    title: "Guiar un proyecto",
    description: "Orientación paso a paso, sin hacerlo por ti.",
    prompt: "Quiero que me guíes en un proyecto.",
  },
];

export const INTENT_IDS: MentorIntent[] = QUICK_ACTIONS.map((a) => a.intent);
