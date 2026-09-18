import { NextResponse } from "next/server";
import { validarLogin, crearCookieSesion } from "@/lib/auth";

// Límite de intentos muy simple, en memoria, por proceso — suficiente para
// 3 usuarios conocidos (no es un sistema público con miles de cuentas).
// Se resetea si el servidor se reinicia; eso es aceptable acá porque el
// objetivo es frenar fuerza bruta automatizada, no ser un rate-limiter
// distribuido de nivel producción masiva.
const intentosFallidos = new Map<string, { cantidad: number; hasta: number }>();
const LIMITE_INTENTOS = 5;
const VENTANA_BLOQUEO_MS = 15 * 60 * 1000; // 15 min

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";

  const bloqueo = intentosFallidos.get(ip);
  if (bloqueo && bloqueo.hasta > Date.now()) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const usuario = typeof body?.usuario === "string" ? body.usuario.trim() : "";
  const clave = typeof body?.clave === "string" ? body.clave : "";

  if (!usuario || !clave) {
    return NextResponse.json({ error: "Usuario y contraseña son obligatorios." }, { status: 400 });
  }

  const resultado = await validarLogin(usuario, clave);

  if (!resultado.ok) {
    const previo = intentosFallidos.get(ip)?.cantidad ?? 0;
    const cantidad = previo + 1;
    intentosFallidos.set(ip, {
      cantidad,
      hasta: cantidad >= LIMITE_INTENTOS ? Date.now() + VENTANA_BLOQUEO_MS : 0,
    });
    return NextResponse.json({ error: resultado.error }, { status: 401 });
  }

  intentosFallidos.delete(ip);
  await crearCookieSesion(resultado.sesion);
  return NextResponse.json({ ok: true, sesion: resultado.sesion });
}
