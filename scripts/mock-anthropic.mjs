#!/usr/bin/env node
/**
 * SIMULADOR LOCAL DE LA API DE ANTHROPIC (solo para pruebas técnicas)
 *
 * Permite comprobar qué enviaría GRIOT a Claude SIN gastar créditos:
 * el servidor de GRIOT se arranca apuntando a este simulador con una
 * clave falsa, y el simulador guarda la última petición en un archivo JSON.
 *
 * Uso:
 *   node scripts/mock-anthropic.mjs <puerto> <archivo-salida.json>
 *   ANTHROPIC_BASE_URL=http://127.0.0.1:<puerto> ANTHROPIC_API_KEY=mock-key npm start
 *
 * Variables opcionales del simulador:
 *   MOCK_STATUS=401|429|500   responde con ese error HTTP
 *   MOCK_STOP=refusal         responde con stop_reason "refusal"
 *
 * Nunca guarda ni muestra cabeceras: solo indica si la clave recibida era la falsa.
 */
import { writeFileSync } from "node:fs";
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4010);
const outFile = process.argv[3] ?? "mock-last-request.json";
const status = Number(process.env.MOCK_STATUS ?? 200);
const stop = process.env.MOCK_STOP ?? "end_turn";

createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    if (req.method !== "POST" || !req.url?.startsWith("/v1/messages")) {
      res.writeHead(404).end();
      return;
    }
    const body = JSON.parse(raw || "{}");
    writeFileSync(
      outFile,
      JSON.stringify(
        {
          // El SDK 1.x envía la clave como "Authorization: Bearer …"; versiones anteriores, como "x-api-key".
          usedMockKey:
            req.headers.authorization === "Bearer mock-key" || req.headers["x-api-key"] === "mock-key",
          body,
        },
        null,
        2,
      ),
    );

    if (status !== 200) {
      const type = { 401: "authentication_error", 429: "rate_limit_error" }[status] ?? "api_error";
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify({ type: "error", error: { type, message: "simulado" } }));
      return;
    }

    // Indica qué perfil encontró en las instrucciones, para comprobarlo en pantalla.
    const systemText = Array.isArray(body.system)
      ? body.system.map((b) => b.text ?? "").join("\n")
      : String(body.system ?? "");
    const profile = systemText.match(/Perfil seleccionado: ([^\n]+)/)?.[1] ?? "ninguno";
    const turns = Array.isArray(body.messages) ? body.messages.length : 0;
    const replyText = `Respuesta del simulador (no es Claude). Perfil recibido en las instrucciones: ${profile}. Mensajes del historial recibidos: ${turns}.`;

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        id: "msg_mock",
        type: "message",
        role: "assistant",
        model: body.model,
        content: stop === "refusal" ? [] : [{ type: "text", text: replyText }],
        stop_reason: stop,
        stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0 },
      }),
    );
  });
}).listen(port, "127.0.0.1", () => console.log(`Simulador de Anthropic en http://127.0.0.1:${port}`));
