import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { PanelAdmin } from "@/components/admin/panel-admin";

export default async function AdminPage() {
  // Guard en el servidor — nunca confiar solo en que el frontend oculte el
  // panel; si no hay sesión válida, ni siquiera se llega a renderizar nada.
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/login");

  return <PanelAdmin sesion={sesion} />;
}
