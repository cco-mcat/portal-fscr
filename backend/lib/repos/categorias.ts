import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { poolGestorp } from "@/lib/db";

export interface Categoria extends RowDataPacket {
  id: number;
  nombre: string;
  slug: string;
  orden: number;
}

function generarSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes (marcas diacriticas combinantes)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listarCategorias(): Promise<Categoria[]> {
  const [filas] = await poolGestorp().query<Categoria[]>(
    "SELECT id, nombre, slug, orden FROM portal_categorias ORDER BY orden ASC, nombre ASC"
  );
  return filas;
}

export async function crearCategoria(nombre: string): Promise<Categoria> {
  const slug = generarSlug(nombre);
  const [resultado] = await poolGestorp().query<ResultSetHeader>(
    "INSERT INTO portal_categorias (nombre, slug) VALUES (?, ?)",
    [nombre, slug]
  );
  return { id: resultado.insertId, nombre, slug, orden: 0 } as Categoria;
}

export async function contarProyectosDeCategoria(id: number): Promise<number> {
  const [filas] = await poolGestorp().query<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM portal_proyectos WHERE categoria_id = ?",
    [id]
  );
  return filas[0]?.total ?? 0;
}

/** true si se pudo borrar; false si la categoría tiene proyectos.
 *
 * Doble capa de verificación a propósito: primero se cuenta explícitamente
 * (da un mensaje claro con el número real de proyectos, útil para la
 * confirmación en el frontend) y ADEMÁS se deja el FK con ON DELETE
 * RESTRICT como respaldo — si algo crea un proyecto entre el conteo y el
 * DELETE (condición de carrera), el propio motor de base de datos igual
 * rechaza el borrado; ese catch nunca debería dispararse en uso normal,
 * pero es la última línea de defensa real, no la primera. */
export async function borrarCategoria(id: number): Promise<{ ok: boolean; error?: string }> {
  const proyectosAsociados = await contarProyectosDeCategoria(id);
  if (proyectosAsociados > 0) {
    return {
      ok: false,
      error: `No se puede borrar: tiene ${proyectosAsociados} proyecto${proyectosAsociados === 1 ? "" : "s"} asociado${proyectosAsociados === 1 ? "" : "s"}.`,
    };
  }

  try {
    const [resultado] = await poolGestorp().query<ResultSetHeader>(
      "DELETE FROM portal_categorias WHERE id = ?",
      [id]
    );
    if (resultado.affectedRows === 0) {
      return { ok: false, error: "La categoría no existe." };
    }
    return { ok: true };
  } catch (error) {
    const codigo = (error as { code?: string }).code;
    if (codigo === "ER_ROW_IS_REFERENCED_2" || codigo === "ER_ROW_IS_REFERENCED") {
      return { ok: false, error: "No se puede borrar: hay proyectos que usan esta categoría." };
    }
    throw error;
  }
}
