<div align="center">

# GRIOT

**Mentor académico con inteligencia artificial para estudiantes del Bachillerato Internacional (IB)**

*«Hola, soy GRIOT. Estoy aquí para ayudarte a aprender, no para hacer el trabajo por ti.»*

### [▶ Probar GRIOT: griot-coral.vercel.app](https://griot-coral.vercel.app)

</div>

---

## Qué es GRIOT

GRIOT es una aplicación web conversacional que ayuda a estudiantes del IB a **entender temas, organizar su estudio y mejorar sus trabajos sin hacer el trabajo por ellos**. Es el producto de un *Personal Project* del IB MYP. En el informe académico del proyecto aparece con el nombre **Mentor AIB**.

GRIOT no es un chatbot genérico. Sus instrucciones siguen un ciclo pedagógico flexible:

**Diagnosticar → Explicar → Comprobar → Adaptar**

- **Diagnosticar:** detecta qué intenta aprender el estudiante y dónde está la dificultad.
- **Explicar:** da explicaciones concretas, con ejemplos, analogías y pasos.
- **Comprobar:** propone una pregunta o un ejercicio breve. Al analizar la respuesta, distingue entre respuesta correcta, error conceptual y error de procedimiento.
- **Adaptar:** si el estudiante no entiende, cambia de estrategia en lugar de repetir la misma explicación, y sube la dificultad poco a poco.

GRIOT protege la **integridad académica**: no entrega trabajos evaluados completos (ensayos, evaluaciones internas, informes), pero sí explica, resuelve ejemplos de práctica y da retroalimentación.

## Los tres perfiles de aprendizaje

El estudiante elige un perfil en el menú lateral. **El perfil cambia la forma de ayudar, no el tema.** Se puede cambiar en cualquier momento: se aplica a la siguiente respuesta y no borra la conversación.

| Perfil | Botón | Cómo ayuda GRIOT |
| ------ | ----- | ---------------- |
| **Comprensión** | «Necesito entender mejor» | Lenguaje sencillo, pasos cortos, ejemplos cotidianos y comprobaciones breves. |
| **Organización** | «Necesito organizarme» | Objetivos, prioridades y planes realistas; divide las tareas grandes en pasos concretos. |
| **Profundización** | «Quiero profundizar» | Conexiones entre conceptos y materias, preguntas críticas y retos progresivos. |

Cada respuesta muestra con qué perfil se generó, y bajo el campo de texto se ve siempre el perfil activo.

## Tecnologías

| Tecnología | Uso |
| ---------- | --- |
| [Next.js 16](https://nextjs.org) y React 19 | Interfaz y servidor (API `/api/chat`) |
| TypeScript | Lenguaje con tipos |
| Tailwind CSS 4 | Estilos |
| [SDK oficial de Anthropic](https://github.com/anthropics/anthropic-sdk-typescript) | Conexión con Claude, **solo en el servidor** |
| Claude Haiku 5.5 (`claude-haiku-5-5`) | Modelo que genera las respuestas |
| [Vercel](https://vercel.com) | Publicación de la aplicación |

## Cómo funciona

```
Navegador (React)                      Servidor (Next.js)
─────────────────                      ──────────────────
ChatApp ── useChat ── chat-client ──►  POST /api/chat
              │                           ├ validate.ts      valida la entrada
              └─ chat-store               ├ rate-limit.ts    límite de solicitudes
                 (sessionStorage)         └ mentor/
                                               ├ claude.ts           SDK de Anthropic
                                               ├ system-prompt.ts    monta las instrucciones
                                               └ pedagogy/           metodología · perfiles · integridad
```

- **La clave de la API nunca llega al navegador:** todo pasa por `/api/chat`, en el servidor.
- **Las instrucciones del agente** están en [`src/lib/mentor/system-prompt.ts`](src/lib/mentor/system-prompt.ts) y [`src/lib/mentor/pedagogy/`](src/lib/mentor/pedagogy/). Están separadas en una parte fija, que Claude guarda en caché, y una variable (perfil y contexto).
- **Las conversaciones** se guardan solo en la pestaña del navegador (`sessionStorage`). No hay cuentas ni base de datos.
- **Si Claude falla**, se muestra un error claro con un botón «Reintentar». Nunca se sustituye en silencio por una respuesta inventada.
- **Los registros del servidor** guardan solo metadatos (modelo, tokens, perfil), nunca el texto de las conversaciones.

## Ejecutarlo en tu ordenador

Requisitos: **Node.js 20 o superior** y una clave de la [API de Anthropic](https://console.anthropic.com).

```bash
git clone https://github.com/PabloRubio734/GRIOT.git
cd GRIOT
npm install
cp .env.example .env.local      # y escribe tu clave en ANTHROPIC_API_KEY
npm run dev
```

Abre <http://localhost:3000>.

Si no tienes clave, puedes probar la interfaz en **modo demostración** con `GRIOT_DEMO_MODE=true` en `.env.local`. Las respuestas serán plantillas, siempre marcadas como «Respuesta de demostración».

| Comando | Qué hace |
| ------- | -------- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` y `npm start` | Versión de producción |
| `npm run lint` | Revisión del código con ESLint |
| `npx tsc --noEmit` | Comprobación de tipos |

### Variables de entorno

Todas se configuran en `.env.local`, un archivo que **nunca** se sube al repositorio. La plantilla está en [`.env.example`](.env.example).

| Variable | Por defecto | Para qué sirve |
| -------- | ----------- | -------------- |
| `ANTHROPIC_API_KEY` | — (obligatoria) | Clave de la API. Solo la lee el servidor. |
| `ANTHROPIC_MODEL` | — (obligatoria) | Modelo de Claude (recomendado: `claude-haiku-5-5`). |
| `GRIOT_DEMO_MODE` | `false` | `true` = respuestas de demostración, sin llamar a Claude. |
| `ANTHROPIC_EFFORT` | `low` | Esfuerzo de razonamiento (`low`, `medium`, `high`). |
| `GRIOT_MAX_OUTPUT_TOKENS` | `1500` | Tope de tokens por respuesta. |
| `GRIOT_MAX_HISTORY_MESSAGES` | `12` | Mensajes recientes que se envían a Claude. |
| `GRIOT_MAX_HISTORY_CHARS` | `16000` | Caracteres máximos del historial enviado. |
| `GRIOT_RATE_LIMIT_PER_MINUTE` | `8` | Solicitudes por minuto y por usuario. |
| `GRIOT_RATE_LIMIT_PER_DAY` | `150` | Solicitudes por día en todo el servidor. |

### Pruebas sin gastar créditos

[`scripts/mock-anthropic.mjs`](scripts/mock-anthropic.mjs) imita la API de Anthropic en tu ordenador. Con él puedes comprobar qué enviaría GRIOT a Claude (instrucciones, perfil, historial) sin coste. [`scripts/test-profiles-ui.mjs`](scripts/test-profiles-ui.mjs) usa la interfaz en un Chrome automatizado para probar el cambio de perfil, la conservación del historial, la recarga de la página y la vista móvil.

```bash
npm run build
node scripts/test-profiles-ui.mjs
```

## Cómo se desarrolló: uso de Claude Code

Por transparencia: **GRIOT se desarrolló con la ayuda de [Claude Code](https://claude.com/claude-code)**, un asistente de programación con inteligencia artificial de Anthropic.

El proyecto avanzó por fases a partir de instrucciones escritas para el asistente: interfaz, conexión con Claude, metodología pedagógica, revisión de los perfiles, pruebas y publicación. Claude Code escribió gran parte del código y de las pruebas automáticas siguiendo esas instrucciones. El equipo del proyecto fijó los objetivos de cada fase y autorizó expresamente cada prueba con la API real.

Además, la aplicación usa un modelo de Claude para generar las respuestas del mentor. Por eso la interfaz recuerda que **GRIOT puede equivocarse** y que conviene contrastar la información importante.

## Limitaciones

- Es un proyecto educativo, no un servicio profesional. Las respuestas pueden contener errores.
- Solo recuerda los mensajes recientes de la conversación actual, y todo se borra al cerrar la pestaña.
- La versión pública tiene límites de uso para controlar el gasto, así que puede responder «espera un momento» si recibe muchos mensajes seguidos.

## Identidad visual

El símbolo (dos rombos concéntricos con un núcleo) y el logotipo se crearon para este proyecto. No se usan logos, personajes ni diseños protegidos.
