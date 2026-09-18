// Base del backend (VPS). Vacía en dev local (npm run dev sin la variable)
// para seguir pegándole al propio origen si alguna vez se prueba con un
// backend embebido; en el build de producción SIEMPRE debe apuntar al VPS,
// ya que el export estático no tiene servidor propio que resuelva /api/*.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Wrapper de `fetch` para toda llamada a la API — nunca usar `fetch` a pelo
 * contra `/api/...` en este proyecto: el frontend y el backend ya no
 * comparten origen, así que hacen falta la URL absoluta del VPS y
 * `credentials: "include"` para que la cookie de sesión (SameSite=None)
 * viaje en la petición cross-origin.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });
}
