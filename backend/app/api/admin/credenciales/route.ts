import { NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";
import { listarCredenciales, crearCredencial, type ItemCredencial } from "@/lib/repos/credenciales";
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

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const credenciales = await listarCredenciales();
  return NextResponse.json({ credenciales });
}

export async function POST(request: Request) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const titulo = typeof body?.titulo === "string" ? body.titulo.trim() : "";
  const clave = typeof body?.clave === "string" ? body.clave : "";
  if (!titulo || titulo.length > 120) {
    return NextResponse.json({ error: "El título debe tener entre 1 y 120 caracteres." }, { status: 400 });
  }
  if (!clave) {
    return NextResponse.json({ error: "La clave es obligatoria." }, { status: 400 });
  }
  const errorClave = validarClaveMaestra(clave);
  if (errorClave) {
    return NextResponse.json({ error: errorClave }, { status: 400 });
  }

  const { id } = await crearCredencial({
    titulo,
    clave,
    categoria: normalizarOpcional(body?.categoria),
    notas: normalizarOpcional(body?.notas),
    items: normalizarItems(body?.items),
    creadoPorId: sesion.usuarioPigoId,
    creadoPorNombre: sesion.nombre,
  });
  return NextResponse.json({ id }, { status: 201 });
}
