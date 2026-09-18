import { NextResponse } from "next/server";
import { listarCategorias } from "@/lib/repos/categorias";
import { listarProyectos } from "@/lib/repos/proyectos";
import type { IconoSistema, Sistema } from "@/lib/sistemas";
import { ICONOS_DISPONIBLES } from "@/lib/sistemas";

const ICONO_POR_DEFECTO: IconoSistema = "line-chart";

function esIconoValido(valor: string): valor is IconoSistema {
  return (ICONOS_DISPONIBLES as readonly string[]).includes(valor);
}

/**
 * Endpoint público (sin sesión) que alimenta la grilla del portal — a
 * diferencia de /api/admin/proyectos, que exige sesión y devuelve TODOS los
 * proyectos (activos e inactivos) para gestionarlos. Acá solo se exponen
 * los proyectos con activo=1, y ya en la forma que espera el frontend
 * (type Sistema), para que page.tsx no tenga que conocer la forma cruda de
 * la fila de base de datos.
 */
export async function GET() {
  const [proyectos, categorias] = await Promise.all([listarProyectos(), listarCategorias()]);

  const sistemas: Sistema[] = proyectos
    .filter((p) => p.activo === 1)
    .map((p) => ({
      slug: String(p.id),
      nombre: p.nombre,
      descripcion: p.descripcion,
      categoria: p.categoria_nombre,
      href: p.href,
      icono: esIconoValido(p.icono) ? p.icono : ICONO_POR_DEFECTO,
      logoUrl: p.logo_url,
      fondoLogo: p.fondo_logo,
    }));

  return NextResponse.json({
    sistemas,
    categorias: ["Todos", ...categorias.map((c) => c.nombre)],
  });
}
