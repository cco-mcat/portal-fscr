import { NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";
import {
  borrarProyecto,
  alternarActivoProyecto,
  actualizarFondoLogoProyecto,
  actualizarDetallesProyecto,
  type FondoLogo,
} from "@/lib/repos/proyectos";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const ok = await borrarProyecto(idNumerico);
  if (!ok) return NextResponse.json({ error: "El proyecto no existe." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);

  if (typeof body?.activo === "boolean") {
    const ok = await alternarActivoProyecto(idNumerico, body.activo);
    if (!ok) return NextResponse.json({ error: "El proyecto no existe." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (body?.fondoLogo === "claro" || body?.fondoLogo === "oscuro") {
    const ok = await actualizarFondoLogoProyecto(idNumerico, body.fondoLogo as FondoLogo);
    if (!ok) return NextResponse.json({ error: "El proyecto no existe." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (typeof body?.nombre === "string" && typeof body?.descripcion === "string") {
    const nombre = body.nombre.trim();
    const descripcion = body.descripcion.trim();
    if (!nombre || nombre.length > 120) {
      return NextResponse.json({ error: "El nombre debe tener entre 1 y 120 caracteres." }, { status: 400 });
    }
    if (!descripcion || descripcion.length > 500) {
      return NextResponse.json(
        { error: "La descripción debe tener entre 1 y 500 caracteres." },
        { status: 400 }
      );
    }
    const ok = await actualizarDetallesProyecto(idNumerico, { nombre, descripcion });
    if (!ok) return NextResponse.json({ error: "El proyecto no existe." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    {
      error:
        "Falta un campo válido para actualizar ('activo' boolean, 'fondoLogo' claro/oscuro, o 'nombre'+'descripcion').",
    },
    { status: 400 }
  );
}
