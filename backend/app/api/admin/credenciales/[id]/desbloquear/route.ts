import { NextResponse } from "next/server";
import { obtenerSesionActual, verificarClavePropia } from "@/lib/auth";
import { desbloquearCredencial } from "@/lib/repos/credenciales";

// Doble verificación para ver el contenido de un contenedor: la clave
// maestra del contenedor Y la contraseña propia de quien la pide (segundo
// factor — tener sesión admin abierta no alcanza). Ninguna de las dos
// viaja de vuelta: ambas solo se comparan contra su hash.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const claveContenedor = typeof body?.claveContenedor === "string" ? body.claveContenedor : "";
  const claveUsuario = typeof body?.claveUsuario === "string" ? body.claveUsuario : "";
  if (!claveContenedor || !claveUsuario) {
    return NextResponse.json(
      { error: "Ingresa tu contraseña y la clave maestra del contenedor." },
      { status: 400 }
    );
  }

  const claveUsuarioValida = await verificarClavePropia(sesion.usuarioPigoId, claveUsuario);
  if (!claveUsuarioValida) {
    return NextResponse.json({ error: "Tu contraseña no es correcta." }, { status: 403 });
  }

  const contenido = await desbloquearCredencial(idNumerico, claveContenedor);
  if (!contenido) {
    return NextResponse.json({ error: "La clave maestra del contenedor es incorrecta." }, { status: 403 });
  }
  return NextResponse.json(contenido);
}
