"use client";

import { useSesionAdmin } from "@/lib/usar-sesion-admin";
import { PanelCredenciales } from "@/components/admin/panel-credenciales";

export default function CredencialesPage() {
  const { sesion, cargando } = useSesionAdmin();

  if (cargando || !sesion) return null;

  return <PanelCredenciales sesion={sesion} />;
}
