import { NextResponse } from "next/server";
import { obtenerSesionActual, verificarClavePropia } from "@/lib/auth";
import { actualizarCredencial, borrarCredencial, verificarClaveContenedor, type ItemCredencial } from "@/lib/repos/credenciales";
import { validarClaveMaestra } from "@/lib/validacion-clave";

function normalizarOpcional(valor: unknown): string | null {
  const texto = typeof valor === "string" ? valor.trim() : "";
  return texto ? texto : null;
}

function normalizarItems(valor: unknown): ItemCredencial[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((it) => ({
      etiqueta: typeof it?.etiqueta === "string" ? it.etiqueta.trim() : "",
      valor: typeof it?.valor === "string" ? it.valor.trim() : "",
    }))
    .filter((it) => it.etiqueta && it.valor);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const titulo = typeof body?.titulo === "string" ? body.titulo.trim() : "";
  if (!titulo || titulo.length > 120) {
    return NextResponse.json({ error: "El título debe tener entre 1 y 120 caracteres." }, { status: 400 });
  }

  const claveNueva = typeof body?.clave === "string" && body.clave ? body.clave : null;
  if (claveNueva) {
    const errorClave = validarClaveMaestra(claveNueva);
    if (errorClave) {
      return NextResponse.json({ error: errorClave }, { status: 400 });
    }
  }

  const ok = await actualizarCredencial(idNumerico, {
    titulo,
    // Clave vacía/ausente = no se cambia (se deja la existente cifrada).
    clave: claveNueva,
    categoria: normalizarOpcional(body?.categoria),
    notas: normalizarOpcional(body?.notas),
    items: normalizarItems(body?.items),
  });
  if (!ok) return NextResponse.json({ error: "La credencial no existe." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Borrar exige la misma doble verificación que desbloquear (tu contraseña +
// la clave maestra del contenedor) — es la acción más destructiva de todas
// (se pierde el contenido para siempre), no debería pedir menos que ver.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const claveUsuario = typeof body?.claveUsuario === "string" ? body.claveUsuario : "";
  const claveContenedor = typeof body?.claveContenedor === "string" ? body.claveContenedor : "";
  if (!claveUsuario || !claveContenedor) {
    return NextResponse.json(
      { error: "Ingresa tu contraseña y la clave maestra del contenedor." },
      { status: 400 }
    );
  }

  const claveUsuarioValida = await verificarClavePropia(sesion.usuarioPigoId, claveUsuario);
  if (!claveUsuarioValida) {
    return NextResponse.json({ error: "Tu contraseña no es correcta." }, { status: 403 });
  }
  const claveContenedorValida = await verificarClaveContenedor(idNumerico, claveContenedor);
  if (!claveContenedorValida) {
    return NextResponse.json({ error: "La clave maestra del contenedor es incorrecta." }, { status: 403 });
  }

  const ok = await borrarCredencial(idNumerico);
  if (!ok) return NextResponse.json({ error: "La credencial no existe." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
