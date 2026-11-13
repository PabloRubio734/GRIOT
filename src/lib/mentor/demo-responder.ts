/**
 * RESPONDEDOR DE DEMOSTRACIÓN (fase 1)
 *
 * Genera respuestas SIMULADAS a partir de plantillas fijas. No hay ninguna
 * inteligencia artificial aquí: solo se detectan palabras clave y se elige
 * una plantilla según la intención y el perfil del estudiante.
 *
 * Sirve para probar la interfaz y el flujo de conversación antes de conectar
 * Claude en la fase 2. Las plantillas también documentan el comportamiento
 * pedagógico que se espera del mentor real (preguntar contexto, guiar con
 * pistas, no hacer el trabajo por el estudiante, adaptarse al perfil).
 */
import type { ChatRequestBody, MentorIntent, StudentProfile } from "@/lib/types";

type Templates = Record<StudentProfile, (topic: string) => string>;

/** Pasa a minúsculas y elimina tildes para comparar palabras clave. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const WORK_REQUEST =
  /\b(hazme|hazmelo|haz mi|hazlo (tu|por mi)|escribeme|escribe (mi|el|la|un|una) |redactame|redacta (mi|el|la|un|una) |resuelveme|resuelve (mi|el|la|este|esta|los|las) |dame (la|las) respuestas?|haz (el|la|los|las) (tarea|ensayo|deberes|trabajo|ejercicio))/;

const GREETING = /^(hola|buenas|hey|buenos dias|buenas tardes|buenas noches)\b/;

const INTENT_PATTERNS: [MentorIntent, RegExp][] = [
  ["proyecto", /\b(proyect|investiga|personal project|monografi|exploracion)/],
  ["mejorar", /\b(revis|mejora|feedback|retroaliment|corrig|correg|ensayo|borrador|parrafo|redaccion)/],
  ["organizar", /\b(organi|planific|plan de estudio|horario|calendario|priori|examen|agenda|entrega|fecha limite|procrastin)/],
  ["entender", /\b(explica|entend|que es|como funciona|no entiendo|concepto|significa|por que)/],
];

function detectIntent(normalized: string): MentorIntent | undefined {
  return INTENT_PATTERNS.find(([, pattern]) => pattern.test(normalized))?.[0];
}

/** Convierte el mensaje del estudiante en una etiqueta corta para citarla. */
const LEAD_IN =
  /^[¿¡]?\s*(no entiendo( bien)?|no se( bien)?|expl[ií]ca(me)?|qu[eé] es|c[oó]mo funciona|ay[uú]da(me)? (a|con)|quiero|necesito)\s+/i;

function topicLabel(message: string): string {
  const clean = message
    .replace(/\s+/g, " ")
    .trim()
    .replace(LEAD_IN, "")
    .replace(/[.?!¿¡]+$/g, "");
  if (clean.length > 90) return "el texto que has compartido";
  if (clean.length === 0) return "este tema";
  return `«${clean}»`;
}

const PROFILE_NOTE: Record<StudentProfile, string> = {
  comprension: "Iremos despacio, paso a paso y con ejemplos.",
  organizacion: "Lo dividiremos todo en pasos concretos y fáciles de seguir.",
  profundizar: "Te propondré retos y conexiones para ir más allá.",
};

const ASK_CONTEXT: Record<MentorIntent, string> = {
  entender:
    "¡Buena elección! Para explicarte el tema de forma útil, necesito algo de contexto:\n\n1. ¿De qué materia y qué tema concreto se trata?\n2. ¿Qué sabes ya sobre él, aunque sea poco?\n3. ¿Qué parte te resulta más confusa?",
  organizar:
    "Vamos a ordenar tu estudio. Cuéntame:\n\n1. ¿Qué tareas, exámenes o entregas tienes pendientes?\n2. ¿Cuáles son sus fechas límite?\n3. ¿Cuánto tiempo real puedes dedicar cada día?",
  mejorar:
    "Perfecto. Para darte retroalimentación útil necesito saber:\n\n1. ¿Qué tipo de trabajo es? (ensayo, informe de laboratorio, evaluación interna, monografía…)\n2. ¿Qué criterios de evaluación se aplican?\n3. ¿Qué parte crees que es la más débil?\n\nPuedes pegar un fragmento. No lo reescribiré, pero te señalaré qué funciona y qué puedes mejorar tú.",
  proyecto:
    "Te acompaño en tu proyecto. Para orientarte bien, cuéntame:\n\n1. ¿De qué trata y cuál es tu objetivo?\n2. ¿En qué fase estás: idea, investigación, desarrollo o reflexión?\n3. ¿Qué te preocupa o te bloquea ahora mismo?",
};

const TEMPLATES: Record<MentorIntent, Templates> = {
  entender: {
    comprension: (t) =>
      `Vamos paso a paso con ${t}.\n\n**1. La idea central.** Antes de entrar en detalles, intenta escribir en una sola frase qué crees que significa. No importa si no es perfecta: así veo desde dónde partimos.\n\n**2. Un ejemplo cercano.** Piensa en una situación de tu día a día que se parezca a esta idea. Los ejemplos concretos ayudan a que lo abstracto tenga sentido.\n\n**3. Las palabras clave.** Anota dos o tres términos de este tema que no tengas claros y los repasamos uno por uno.\n\n**Pregunta para ti:** ¿qué parte exacta te confunde más: la definición, cómo funciona o cómo se aplica en un ejercicio?`,
    organizacion: (t) =>
      `Organicemos cómo estudiar ${t} en bloques cortos:\n\n- **Bloque 1 (10 min):** lee la definición en tu libro o tus apuntes y subraya solo lo esencial.\n- **Bloque 2 (15 min):** escribe con tus palabras un resumen de cinco líneas como máximo.\n- **Bloque 3 (10 min):** haz un esquema que conecte las ideas principales.\n- **Bloque 4 (10 min):** ponte a prueba con dos preguntas o ejercicios.\n\nCuando termines el bloque 2, compárteme tu resumen y te diré qué está bien y qué falta.\n\n**Pregunta para ti:** ¿para cuándo necesitas dominar este tema?`,
    profundizar: (t) =>
      `Vayamos más allá de la definición de ${t}.\n\n- **Conexiones:** ¿con qué otros temas de esta asignatura, o de otra materia del IB, se relaciona?\n- **Límites:** ¿en qué casos la explicación habitual deja de funcionar o necesita matices?\n- **Teoría del Conocimiento:** ¿cómo sabemos que esto es cierto? ¿Qué tipo de evidencia lo respalda?\n- **Aplicación:** piensa en un problema real donde este concepto sea útil.\n\n**Reto:** elige una de estas preguntas y escribe tu argumento en un párrafo. Te daré retroalimentación sobre su profundidad y su rigor.`,
  },
  organizar: {
    comprension: (t) =>
      `Hagamos un plan sencillo para ${t}.\n\n**1.** Escribe una lista con todo lo que tienes que hacer, sin ordenarla todavía.\n\n**2.** Anota al lado de cada tarea su fecha de entrega.\n\n**3.** Elige solo una tarea para empezar hoy: la más urgente.\n\nSi me compartes tu lista, te ayudo a dividir esa primera tarea en pasos pequeños y claros.`,
    organizacion: (t) =>
      `Construyamos juntos un plan para ${t}. Sigue esta estructura:\n\n1. **Inventario:** enumera todas tus tareas y entregas pendientes.\n2. **Prioridad:** clasifícalas en «urgente e importante», «importante pero no urgente» y «puede esperar».\n3. **Tiempo real:** calcula cuántas horas tienes disponibles esta semana.\n4. **Bloques:** reparte las tareas en sesiones de 25 a 45 minutos con descansos cortos.\n5. **Revisión:** al final de cada día, marca lo terminado y ajusta el plan.\n\n**Para empezar:** ¿qué entregas tienes en los próximos siete días y cuántas horas puedes dedicarles?`,
    profundizar: (t) =>
      `Para ${t}, te propongo optimizar tu plan, no solo hacerlo:\n\n- **Objetivos de aprendizaje:** define qué deberías saber hacer al final de la semana, no solo qué páginas leer.\n- **Práctica espaciada:** reparte el repaso de cada tema en varios días en lugar de concentrarlo.\n- **Recuperación activa:** dedica parte de cada sesión a responder preguntas sin mirar los apuntes.\n- **Evaluación:** cada semana, analiza qué funcionó y qué cambiarías.\n\n**Pregunta para ti:** ¿qué método de estudio usas ahora y qué evidencia tienes de que funciona?`,
  },
  mejorar: {
    comprension: (t) =>
      `Revisemos ${t} con calma. No lo reescribiré, pero te ayudaré a que lo mejores tú.\n\n**1.** Lee tu texto en voz alta. ¿Hay alguna frase que ni tú mismo entiendas del todo?\n\n**2.** Comprueba que cada párrafo tiene una sola idea principal.\n\n**3.** Busca los lugares donde explicas algo sin dar un ejemplo.\n\nPega aquí un párrafo (no el trabajo entero) y te diré qué está claro y qué se puede explicar mejor.`,
    organizacion: (t) =>
      `Usemos una lista de comprobación para revisar ${t}:\n\n- **Estructura:** ¿tiene introducción, desarrollo y conclusión claros?\n- **Argumento:** ¿cada párrafo apoya tu idea principal?\n- **Evidencia:** ¿citas datos, fuentes o ejemplos concretos?\n- **Criterios:** ¿has revisado los criterios de evaluación del IB para este tipo de trabajo?\n- **Forma:** ortografía, formato de citas y bibliografía.\n\nRevisa un punto cada vez. ¿Con cuál quieres empezar? Pega el fragmento correspondiente y te daré retroalimentación concreta.`,
    profundizar: (t) =>
      `Llevemos ${t} a un nivel superior. No lo reescribiré, pero te haré preguntas exigentes:\n\n- **Tesis:** ¿puedes resumir tu argumento en una frase discutible, no evidente?\n- **Contraargumentos:** ¿consideras y respondes a la objeción más fuerte?\n- **Evaluación:** ¿valoras la fiabilidad y las limitaciones de tus fuentes?\n- **Criterios del IB:** ¿qué descriptor de la banda más alta todavía no cumples?\n\nComparte tu tesis y un párrafo de desarrollo. Te daré retroalimentación específica sobre su profundidad crítica.`,
  },
  proyecto: {
    comprension: (t) =>
      `Vamos a guiar tu proyecto sobre ${t} paso a paso.\n\n**1. Tu objetivo:** ¿qué quieres conseguir o descubrir? Escríbelo en una frase sencilla.\n\n**2. Lo que ya tienes:** ¿qué partes has hecho y cuáles faltan?\n\n**3. El siguiente paso:** elegiremos solo una cosa concreta para avanzar hoy.\n\nCuéntame en qué punto estás y lo dividimos en pasos pequeños.`,
    organizacion: (t) =>
      `Organicemos tu proyecto sobre ${t} por fases:\n\n1. **Definición:** objetivo y pregunta de investigación claros.\n2. **Investigación:** fuentes fiables, con un registro de cada una.\n3. **Desarrollo:** creación del producto o del análisis.\n4. **Evaluación:** comparación con tus criterios de éxito.\n5. **Reflexión:** qué aprendiste y qué cambiarías.\n\nPon una fecha a cada fase. ¿Cuál es tu fecha final de entrega y en qué fase te encuentras ahora?`,
    profundizar: (t) =>
      `Afinemos tu proyecto sobre ${t}:\n\n- **Pregunta de investigación:** ¿está acotada, se puede investigar y admite más de una respuesta?\n- **Criterios de éxito:** ¿son medibles? ¿Cómo sabrás objetivamente si los cumples?\n- **Fuentes:** ¿combinas fuentes primarias y secundarias? ¿Cómo evalúas su sesgo?\n- **Reflexión:** ¿qué evidencia mostrará tu crecimiento como estudiante a lo largo del proceso?\n\nComparte tu pregunta de investigación actual y la pondremos a prueba juntos.`,
  },
};

const INTEGRITY_REPLY =
  "Entiendo que quieras avanzar rápido, pero no voy a hacer el trabajo por ti: el objetivo es que aprendas y que lo que entregues sea tuyo, como exige la integridad académica del IB.\n\nLo que sí puedo hacer:\n\n- Explicarte los conceptos que necesitas.\n- Ayudarte a hacer un esquema con tus propias ideas.\n- Darte pistas si te atascas en un paso.\n- Revisar lo que escribas y darte retroalimentación.\n\n**Empecemos:** ¿qué parte de la tarea ya tienes clara y en cuál te has atascado?";

function greetingReply(profile: StudentProfile): string {
  return `¡Hola! ¿En qué estás trabajando hoy? Puedes contarme qué tema estudias, qué tarea tienes pendiente o qué parte de un trabajo quieres mejorar.\n\n${PROFILE_NOTE[profile]}`;
}

function generalReply(topic: string, profile: StudentProfile): string {
  return `Gracias por contármelo. Para ayudarte mejor, ¿qué te gustaría hacer con ${topic}?\n\n- **Entenderlo** mejor\n- **Organizar** tu estudio\n- **Mejorar** un trabajo que ya tienes\n- **Avanzar** en un proyecto\n\n${PROFILE_NOTE[profile]}`;
}

export function generateDemoReply({ messages, profile, intent }: ChatRequestBody): string {
  const userMessages = messages.filter((m) => m.role === "user");
  const last = userMessages[userMessages.length - 1]?.content ?? "";
  const normalized = normalize(last);

  // 1. Integridad académica: nunca hacer el trabajo por el estudiante.
  if (WORK_REQUEST.test(normalized)) return INTEGRITY_REPLY;

  // 2. Conversación iniciada con una opción rápida: primero pedir contexto.
  if (intent && userMessages.length === 1) {
    return `${ASK_CONTEXT[intent]}\n\n${PROFILE_NOTE[profile]}`;
  }

  // 3. Saludo corto.
  if (GREETING.test(normalized) && normalized.length < 30) return greetingReply(profile);

  // 4. Intención detectada en el mensaje o, si no, la de la conversación.
  const resolved = detectIntent(normalized) ?? intent;
  const topic = topicLabel(last);
  if (!resolved) return generalReply(topic, profile);

  return TEMPLATES[resolved][profile](topic);
}
