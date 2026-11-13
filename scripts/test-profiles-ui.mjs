#!/usr/bin/env node
/**
 * PRUEBA FUNCIONAL DE CAMBIO DE PERFIL (sin gastar créditos)
 *
 * Abre GRIOT en un Chrome sin interfaz, simula una conversación con cambios de
 * perfil (Comprensión → Profundización → Organización), cambia entre
 * conversaciones, recarga la página y comprueba la vista móvil.
 * GRIOT se conecta al simulador local (scripts/mock-anthropic.mjs) con una
 * clave falsa, así que NO llama a Claude.
 *
 * Uso (desde la raíz del proyecto, después de `npm run build`):
 *   node scripts/test-profiles-ui.mjs [carpeta-de-capturas]
 * Variable opcional: CHROME_PATH (ruta del ejecutable de Chrome).
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const S = mkdtempSync(join(tmpdir(), "griot-ui-"));
const CAPTURE = `${S}/ui-capture.json`;
const SHOTS = resolve(process.argv[2] ?? "docs/ib-evidence/profile-review/capturas");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const APP = "http://127.0.0.1:3005";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];
const results = [];
const requests = [];

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASA " : "FALLA"} | ${name}${detail ? ` — ${detail}` : ""}`);
}

async function waitHttp(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
    } catch {}
    await sleep(250);
  }
  throw new Error(`No responde: ${url}`);
}

let ws;
let seq = 0;
const pending = new Map();
function cmd(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function js(expression) {
  const r = await cmd("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " :: " + expression.slice(0, 80));
  return r.result.value;
}
async function waitFor(expression, label, timeout = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await js(expression)) return;
    await sleep(150);
  }
  throw new Error(`Tiempo agotado esperando: ${label}`);
}
async function shot(name) {
  const { data } = await cmd("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${SHOTS}/${name}`, Buffer.from(data, "base64"));
}

const state = () => js(`JSON.parse(sessionStorage.getItem("griot:session:v1"))`);
const uiSelected = () => js(`document.querySelector('button[aria-pressed="true"]')?.textContent ?? ""`);
const composerLabel = () =>
  js(`document.querySelector('span[title^="Puedes cambiarlo en el menú lateral"]')?.textContent ?? ""`);
const bubbleLabels = () =>
  js(`[...document.querySelectorAll('span[title^="Perfil de aprendizaje activo"]')].map(s => s.textContent.trim())`);
const replyCount = () => js(`(document.body.innerText.match(/Respuesta del simulador/g) || []).length`);
const clickProfile = (label) =>
  js(`[...document.querySelectorAll('button[aria-pressed]')].find(b => b.textContent.includes(${JSON.stringify(label)})).click()`);

async function send(text) {
  const before = await replyCount();
  await js(`(() => {
    const ta = document.getElementById("griot-input");
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(ta, ${JSON.stringify(text)});
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await waitFor(`!document.querySelector('button[aria-label="Enviar mensaje"]').disabled`, "botón enviar activo");
  await js(`document.querySelector('button[aria-label="Enviar mensaje"]').click()`);
  await waitFor(
    `(document.body.innerText.match(/Respuesta del simulador/g) || []).length === ${before + 1} && !document.body.innerText.includes("GRIOT está pensando")`,
    "respuesta",
  );
  await sleep(400); // deja terminar la animación de entrada antes de capturar
  const cap = JSON.parse(readFileSync(CAPTURE, "utf8"));
  requests.push(cap);
  return cap;
}

try {
  mkdirSync(SHOTS, { recursive: true });
  rmSync(`${S}/chrome-profile`, { recursive: true, force: true });

  procs.push(spawn("node", [`${ROOT}/scripts/mock-anthropic.mjs`, "4012", CAPTURE], { stdio: "ignore" }));
  procs.push(
    spawn("npx", ["next", "start", "-p", "3005"], {
      cwd: ROOT,
      env: { ...process.env, ANTHROPIC_BASE_URL: "http://127.0.0.1:4012", ANTHROPIC_API_KEY: "mock-key" },
      stdio: "ignore",
    }),
  );
  await waitHttp(`${APP}/api/status`);

  procs.push(
    spawn(CHROME, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
      "--remote-debugging-port=9333", `--user-data-dir=${S}/chrome-profile`, "about:blank",
    ], { stdio: "ignore" }),
  );
  await waitHttp("http://127.0.0.1:9333/json/version");
  const page = (await (await fetch("http://127.0.0.1:9333/json/list")).json()).find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
    }
  });
  await cmd("Page.enable");
  await cmd("Runtime.enable");
  await cmd("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd("Page.navigate", { url: APP });
  await waitFor(`!!document.getElementById("griot-input") && document.body.innerText.includes("IA conectada")`, "app cargada");

  // ---- Mensaje 1 · Comprensión
  await clickProfile("Necesito entender mejor");
  check("UI: perfil Comprensión seleccionado antes del mensaje 1", (await uiSelected()).includes("Necesito entender mejor"));
  check("UI: campo de texto muestra «Perfil activo: Comprensión»", (await composerLabel()) === "Perfil activo: Comprensión");
  const r1 = await send("No entiendo cómo funciona la fotosíntesis. Explícamelo de forma sencilla.");
  await shot("01-mensaje1-comprension.png");
  let st = await state();
  const convId = st.activeId;
  check("Petición 1 usa el perfil Comprensión", r1.body.system[1].text.includes("Perfil seleccionado: Comprensión"));
  check("Petición 1 envía 1 mensaje de historial", r1.body.messages.length === 1);
  check("Sesión: 1 conversación con 2 mensajes", st.conversations.length === 1 && st.conversations[0].messages.length === 2);
  check("Respuesta 1 guardada con perfil comprension", st.conversations[0].messages[1].profile === "comprension");
  const reply1 = st.conversations[0].messages[1];

  // ---- Cambio a Profundización (sin enviar)
  const before = JSON.stringify(st.conversations);
  await clickProfile("Quiero profundizar");
  await sleep(200);
  st = await state();
  check("Cambiar de perfil no crea conversación ni cambia la activa", st.conversations.length === 1 && st.activeId === convId);
  check("Cambiar de perfil no modifica ningún mensaje", JSON.stringify(st.conversations) === before);
  check("Sesión: perfil global = profundizar", st.profile === "profundizar");
  check("UI: perfil Profundización resaltado", (await uiSelected()).includes("Quiero profundizar"));
  check("UI: campo de texto muestra «Perfil activo: Profundización»", (await composerLabel()) === "Perfil activo: Profundización");
  check("UI: la respuesta 1 sigue etiquetada como Comprensión", JSON.stringify(await bubbleLabels()) === JSON.stringify(["· Perfil Comprensión"]));
  await shot("02-cambio-a-profundizacion.png");

  // ---- Mensaje 2 · Profundización
  const r2 = await send("Explícame más sobre esto.");
  st = await state();
  check("Petición 2 usa el perfil Profundización (y solo ese)", r2.body.system[1].text.includes("Perfil seleccionado: Profundización") && !r2.body.system[1].text.includes("Perfil seleccionado: Comprensión"));
  check("Petición 2 incluye el historial anterior (3 mensajes)", r2.body.messages.length === 3 && r2.body.messages[1].content === reply1.content);
  check("Petición 2 incluye la indicación de cambio de perfil", r2.body.system[1].text.includes("puede cambiar de perfil en mitad de la conversación"));
  await shot("03-mensaje2-profundizacion.png");

  // ---- Mensaje 3 · Organización
  await clickProfile("Necesito organizarme");
  check("UI: campo de texto muestra «Perfil activo: Organización»", (await composerLabel()) === "Perfil activo: Organización");
  const r3 = await send("Ayúdame a organizar un plan para estudiar este tema.");
  st = await state();
  check("Petición 3 usa el perfil Organización (y solo ese)", r3.body.system[1].text.includes("Perfil seleccionado: Organización") && !r3.body.system[1].text.includes("Perfil seleccionado: Profundización"));
  check("Petición 3 incluye todo el historial (5 mensajes, empezando por el mensaje 1)", r3.body.messages.length === 5 && r3.body.messages[0].content.startsWith("No entiendo cómo funciona"));
  check("Sesión: sigue habiendo 1 sola conversación (6 mensajes)", st.conversations.length === 1 && st.conversations[0].messages.length === 6 && st.activeId === convId);
  check("Sesión: la respuesta 1 no se modificó", JSON.stringify(st.conversations[0].messages[1]) === JSON.stringify(reply1));
  check("Sesión: perfiles de las respuestas = comprension, profundizar, organizacion",
    JSON.stringify(st.conversations[0].messages.filter((m) => m.role === "assistant").map((m) => m.profile)) === JSON.stringify(["comprension", "profundizar", "organizacion"]));
  check("UI: etiquetas de las respuestas = Comprensión, Profundización, Organización",
    JSON.stringify(await bubbleLabels()) === JSON.stringify(["· Perfil Comprensión", "· Perfil Profundización", "· Perfil Organización"]));
  check("Bloque fijo de instrucciones idéntico en las 3 peticiones", r1.body.system[0].text === r2.body.system[0].text && r2.body.system[0].text === r3.body.system[0].text);
  await shot("04-mensaje3-organizacion.png");

  // ---- Cambio entre conversaciones guardadas
  await js(`[...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Nueva conversación").click()`);
  await waitFor(`document.body.innerText.includes("Hola, soy GRIOT")`, "pantalla de bienvenida");
  await send("¿Qué es una célula?");
  st = await state();
  const conv2 = st.activeId;
  check("Conversación 2 creada; la 1 se conserva", st.conversations.length === 2 && conv2 !== convId);
  check("La respuesta de la conversación 2 usa el perfil activo (organizacion)", st.conversations.find((c) => c.id === conv2).messages[1].profile === "organizacion");
  await clickProfile("Necesito entender mejor");
  await js(`[...document.querySelectorAll('nav[aria-label="Conversaciones"] button')].find(b => b.textContent.trim().startsWith("No entiendo cómo funciona")).click()`);
  await waitFor(`document.body.innerText.includes("Ayúdame a organizar un plan")`, "conversación 1 abierta");
  await sleep(300);
  st = await state();
  check("Al volver a la conversación 1, el perfil sigue siendo el global (comprension)", st.profile === "comprension" && st.activeId === convId);
  check("La conversación 1 conserva sus 6 mensajes y sus etiquetas",
    st.conversations.find((c) => c.id === convId).messages.length === 6 &&
      JSON.stringify(await bubbleLabels()) === JSON.stringify(["· Perfil Comprensión", "· Perfil Profundización", "· Perfil Organización"]));
  check("UI: campo de texto muestra «Perfil activo: Comprensión»", (await composerLabel()) === "Perfil activo: Comprensión");
  await shot("05-volver-a-conversacion-1.png");

  // ---- Recarga de la página y vista móvil
  await cmd("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cmd("Page.reload");
  await waitFor(`!!document.getElementById("griot-input") && document.body.innerText.includes("Ayúdame a organizar un plan")`, "recarga");
  await sleep(500);
  st = await state();
  check("Tras recargar: se conservan perfil, conversaciones y mensajes", st.profile === "comprension" && st.conversations.length === 2 && st.activeId === convId);
  const visible = await js(`(() => { const s = document.querySelector('span[title^="Puedes cambiarlo en el menú lateral"]'); const r = s.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight; })()`);
  check("Móvil (390 px): «Perfil activo» visible sin abrir el menú", visible === true);
  await shot("06-movil-perfil-activo.png");

  check("Todas las peticiones usaron la clave falsa del simulador", requests.every((r) => r.usedMockKey === true), `${requests.length} peticiones al simulador`);
} catch (e) {
  check("Ejecución sin errores", false, e.message);
} finally {
  try { ws?.close(); } catch {}
  procs.forEach((p) => p.kill());
  await sleep(800); // Chrome tarda un momento en soltar su carpeta temporal
  try {
    rmSync(S, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    console.log(`(No se pudo borrar la carpeta temporal ${S}; puedes borrarla a mano.)`);
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`\nResultado: ${ok}/${results.length} comprobaciones superadas`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}
