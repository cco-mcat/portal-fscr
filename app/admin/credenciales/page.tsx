import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { PanelCredenciales } from "@/components/admin/panel-credenciales";

export default async function CredencialesPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/login");

  return <PanelCredenciales sesion={sesion} />;
}
