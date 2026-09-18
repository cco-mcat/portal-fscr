import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Único origen permitido: el frontend estático servido en cPanel. A
// diferencia del ejemplo genérico de la doc de Next (allowedOrigins: []),
// acá además hace falta Allow-Credentials porque la cookie de sesión viaja
// cross-origin (SameSite=None) — sin este header el navegador descarta la
// respuesta aunque el origen esté permitido.
const ORIGEN_PERMITIDO = process.env.FRONTEND_ORIGIN ?? "https://app.fscr.com.co";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const esOrigenPermitido = origin === ORIGEN_PERMITIDO;

  if (request.method === "OPTIONS") {
    return NextResponse.json(
      {},
      {
        headers: {
          ...(esOrigenPermitido && { "Access-Control-Allow-Origin": origin }),
          ...CORS_HEADERS,
        },
      }
    );
  }

  const response = NextResponse.next();
  if (esOrigenPermitido) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  Object.entries(CORS_HEADERS).forEach(([clave, valor]) => response.headers.set(clave, valor));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
