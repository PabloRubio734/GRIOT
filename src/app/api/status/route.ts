import { connection } from "next/server";
import { getMentorMode } from "@/lib/mentor/config";

/**
 * GET /api/status
 * Indica a la interfaz en qué modo funciona GRIOT ("claude", "demo" o
 * "unconfigured"). No revela la clave ni ningún otro dato de configuración.
 */
export async function GET() {
  await connection(); // Se evalúa en cada petición, no al compilar.
  return Response.json({ mode: getMentorMode() }, { headers: { "Cache-Control": "no-store" } });
}
