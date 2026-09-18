import { NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";
import { listarCategorias, crearCategoria } from "@/lib/repos/categorias";

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const categorias = await listarCategorias();
  return NextResponse.json({ categorias });
}

export async function POST(request: Request) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  if (!nombre || nombre.length > 80) {
    return NextResponse.json({ error: "El nombre debe tener entre 1 y 80 caracteres." }, { status: 400 });
  }

  const categoria = await crearCategoria(nombre);
  return NextResponse.json({ categoria }, { status: 201 });
}
