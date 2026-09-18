import { NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";
import { borrarCategoria } from "@/lib/repos/categorias";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const resultado = await borrarCategoria(idNumerico);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
