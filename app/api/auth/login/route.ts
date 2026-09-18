import { NextResponse } from "next/server";
import { validarLogin, crearCookieSesion } from "@/lib/auth";

// Límite de intentos muy simple, en memoria, por proceso — suficiente para
// 3 usuarios conocidos (no es un sistema público con miles de cuentas).
// Se resetea si el servidor se reinicia; eso es aceptable acá porque el
// objetivo es frenar fuerza bruta automatizada, no ser un rate-limiter
// distribuido de nivel producción masiva.
//
// Dos mapas, no uno: `x-forwarded-for` solo es confiable cuando SIEMPRE
// llega a través de un proxy de confianza que lo sobreescribe (nginx). Hoy
// el contenedor también se expone directo por :8090 sin proxy delante, así
// que cualquiera puede mandar ese header con un valor distinto en cada
// intento y saltarse por completo un límite que dependiera solo de la IP.
// El límite por `usuario` no depende de ningún header controlado por quien
// llama, así que sigue frenando fuerza bruta contra una cuenta puntual aun
// si el de IP queda neutralizado.
const intentosPorIp = new Map<string, { cantidad: number; hasta: number }>();
const intentosPorUsuario = new Map<string, { cantidad: number; hasta: number }>();
const LIMITE_INTENTOS = 5;
const VENTANA_BLOQUEO_MS = 15 * 60 * 1000; // 15 min

function bloqueado(mapa: Map<string, { cantidad: number; hasta: number }>, clave: string): boolean {
  const registro = mapa.get(clave);
  return !!registro && registro.hasta > Date.now();
}

function registrarFallo(mapa: Map<string, { cantidad: number; hasta: number }>, clave: string) {
  const previo = mapa.get(clave)?.cantidad ?? 0;
  const cantidad = previo + 1;
  mapa.set(clave, {
    cantidad,
    hasta: cantidad >= LIMITE_INTENTOS ? Date.now() + VENTANA_BLOQUEO_MS : 0,
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";

  const body = await request.json().catch(() => null);
  const usuario = typeof body?.usuario === "string" ? body.usuario.trim().toLowerCase() : "";
  const clave = typeof body?.clave === "string" ? body.clave : "";

  if (!usuario || !clave) {
    return NextResponse.json({ error: "Usuario y contraseña son obligatorios." }, { status: 400 });
  }

  if (bloqueado(intentosPorIp, ip) || bloqueado(intentosPorUsuario, usuario)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const resultado = await validarLogin(usuario, clave);

  if (!resultado.ok) {
    registrarFallo(intentosPorIp, ip);
    registrarFallo(intentosPorUsuario, usuario);
    return NextResponse.json({ error: resultado.error }, { status: 401 });
  }

  intentosPorIp.delete(ip);
  intentosPorUsuario.delete(usuario);

  // Secure real: cierto solo si la petición llegó por HTTPS de verdad —
  // por `x-forwarded-proto` (detrás de nginx, una vez haya dominio/TLS) o
  // porque la propia URL ya es https. Ver el porqué en crearCookieSesion.
  const seguro =
    request.headers.get("x-forwarded-proto") === "https" || new URL(request.url).protocol === "https:";
  await crearCookieSesion(resultado.sesion, seguro);
  return NextResponse.json({ ok: true, sesion: resultado.sesion });
}
