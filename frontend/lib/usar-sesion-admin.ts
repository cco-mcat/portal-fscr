"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-cliente";

// Espejo del tipo que expone el backend (backend/lib/auth.ts) — se duplica
// acá porque frontend y backend ya son proyectos Next.js independientes sin
// paquete compartido, igual que lib/sistemas.ts y lib/validacion-clave.ts.
export type SesionAdmin = {
  usuarioPigoId: number;
  nombre: string;
  usuario: string;
};

/**
 * Guard de /admin y /admin/credenciales, ahora del lado cliente: el export
 * estático no puede validar la cookie en el servidor (no hay servidor). La
 * protección real de los datos sigue viviendo en el backend — cada endpoint
 * de /api/admin/* revalida la sesión de forma independiente (ver
 * backend/lib/auth.ts, obtenerSesionActual) — esto solo evita mostrar el
 * shell del panel y redirige a quien no tiene sesión.
 */
export function useSesionAdmin() {
  const router = useRouter();
  const [sesion, setSesion] = useState<SesionAdmin | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    apiFetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((datos) => {
        if (vigente) setSesion(datos.sesion);
      })
      .catch(() => {
        if (vigente) router.replace("/login");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [router]);

  return { sesion, cargando };
}
