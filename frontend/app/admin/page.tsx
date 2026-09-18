"use client";

import { useSesionAdmin } from "@/lib/usar-sesion-admin";
import { PanelAdmin } from "@/components/admin/panel-admin";

export default function AdminPage() {
  const { sesion, cargando } = useSesionAdmin();

  // Mientras carga o si no hay sesión (ya redirigiendo a /login en
  // useSesionAdmin) no se renderiza nada del panel.
  if (cargando || !sesion) return null;

  return <PanelAdmin sesion={sesion} />;
}
