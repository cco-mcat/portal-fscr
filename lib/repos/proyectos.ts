import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { poolGestorp } from "@/lib/db";

export type FondoLogo = "claro" | "oscuro";

export interface Proyecto extends RowDataPacket {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  nombre: string;
  descripcion: string;
  href: string;
  logo_url: string | null;
  fondo_logo: FondoLogo;
  icono: string;
  activo: number;
  orden: number;
  creado_en: string;
}

export type DatosNuevoProyecto = {
  categoriaId: number;
  nombre: string;
  descripcion: string;
  href: string;
  icono: string;
  logoUrl: string | null;
  fondoLogo: FondoLogo;
  creadoPorUsuarioId: number;
};

/** JOIN con portal_categorias para traer el nombre ya resuelto — evita el
 *  problema N+1 de consultar la categoría aparte por cada proyecto. */
export async function listarProyectos(): Promise<Proyecto[]> {
  const [filas] = await poolGestorp().query<Proyecto[]>(
    `SELECT p.id, p.categoria_id, c.nombre AS categoria_nombre, p.nombre, p.descripcion,
            p.href, p.logo_url, p.fondo_logo, p.icono, p.activo, p.orden, p.creado_en
     FROM portal_proyectos p
     JOIN portal_categorias c ON c.id = p.categoria_id
     ORDER BY p.orden ASC, p.creado_en DESC`
  );
  return filas;
}

export async function crearProyecto(datos: DatosNuevoProyecto): Promise<{ id: number }> {
  const [resultado] = await poolGestorp().query<ResultSetHeader>(
    `INSERT INTO portal_proyectos
       (categoria_id, nombre, descripcion, href, logo_url, fondo_logo, icono, creado_por_usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.categoriaId,
      datos.nombre,
      datos.descripcion,
      datos.href,
      datos.logoUrl,
      datos.fondoLogo,
      datos.icono,
      datos.creadoPorUsuarioId,
    ]
  );
  return { id: resultado.insertId };
}

export async function actualizarFondoLogoProyecto(id: number, fondoLogo: FondoLogo): Promise<boolean> {
  const [resultado] = await poolGestorp().query<ResultSetHeader>(
    "UPDATE portal_proyectos SET fondo_logo = ? WHERE id = ?",
    [fondoLogo, id]
  );
  return resultado.affectedRows > 0;
}

export async function actualizarDetallesProyecto(
  id: number,
  datos: { nombre: string; descripcion: string }
): Promise<boolean> {
  const [resultado] = await poolGestorp().query<ResultSetHeader>(
    "UPDATE portal_proyectos SET nombre = ?, descripcion = ? WHERE id = ?",
    [datos.nombre, datos.descripcion, id]
  );
  return resultado.affectedRows > 0;
}

export async function borrarProyecto(id: number): Promise<boolean> {
  const [resultado] = await poolGestorp().query<ResultSetHeader>(
    "DELETE FROM portal_proyectos WHERE id = ?",
    [id]
  );
  return resultado.affectedRows > 0;
}

export async function alternarActivoProyecto(id: number, activo: boolean): Promise<boolean> {
  const [resultado] = await poolGestorp().query<ResultSetHeader>(
    "UPDATE portal_proyectos SET activo = ? WHERE id = ?",
    [activo ? 1 : 0, id]
  );
  return resultado.affectedRows > 0;
}
