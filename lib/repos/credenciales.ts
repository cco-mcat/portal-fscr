import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { poolGestorp } from "@/lib/db";
import { cifrar, descifrar } from "@/lib/crypto";
import { hashClaveMaestra, verificarClaveMaestra } from "@/lib/clave-maestra";

export type ItemCredencial = { etiqueta: string; valor: string };

/** Vista de listado — nunca trae el hash de la clave ni el contenido
 *  sensible (ítems/notas), solo lo necesario para reconocer la tarjeta. */
export interface CredencialResumen {
  id: number;
  titulo: string;
  creado_por_nombre: string | null;
  categoria: string | null;
  actualizado_en: string;
  cantidad_items: number;
  tiene_notas: boolean;
}

export interface ContenidoCredencial {
  notas: string | null;
  items: ItemCredencial[];
}

interface FilaResumen extends RowDataPacket {
  id: number;
  titulo: string;
  creado_por_nombre: string | null;
  categoria: string | null;
  actualizado_en: string;
  notas: string | null;
}

interface FilaConteoItems extends RowDataPacket {
  credencial_id: number;
  total: number;
}

interface FilaConHash extends RowDataPacket {
  clave_hash: string;
}

interface FilaConNotasCifradas extends RowDataPacket {
  notas: string | null;
}

interface FilaItem extends RowDataPacket {
  etiqueta: string;
  valor: string;
}

export async function listarCredenciales(): Promise<CredencialResumen[]> {
  const [contenedores] = await poolGestorp().query<FilaResumen[]>(
    "SELECT id, titulo, creado_por_nombre, categoria, actualizado_en, notas FROM portal_credenciales ORDER BY titulo ASC"
  );
  if (contenedores.length === 0) return [];

  const [conteos] = await poolGestorp().query<FilaConteoItems[]>(
    "SELECT credencial_id, COUNT(*) AS total FROM portal_credenciales_items WHERE credencial_id IN (?) GROUP BY credencial_id",
    [contenedores.map((c) => c.id)]
  );
  const conteoPorId = new Map(conteos.map((c) => [c.credencial_id, c.total]));

  return contenedores.map(({ notas, ...resto }) => ({
    ...resto,
    cantidad_items: conteoPorId.get(resto.id) ?? 0,
    tiene_notas: notas !== null && notas !== "",
  }));
}

async function reemplazarItems(credencialId: number, items: ItemCredencial[]) {
  await poolGestorp().query("DELETE FROM portal_credenciales_items WHERE credencial_id = ?", [credencialId]);
  if (items.length === 0) return;
  const filas = items.map((it, i) => [credencialId, it.etiqueta, cifrar(it.valor), i]);
  await poolGestorp().query(
    "INSERT INTO portal_credenciales_items (credencial_id, etiqueta, valor, orden) VALUES ?",
    [filas]
  );
}

export async function crearCredencial(datos: {
  titulo: string;
  clave: string;
  categoria: string | null;
  notas: string | null;
  items: ItemCredencial[];
  creadoPorId: number;
  creadoPorNombre: string;
}): Promise<{ id: number }> {
  const [resultado] = await poolGestorp().query<ResultSetHeader>(
    "INSERT INTO portal_credenciales (titulo, clave_hash, creado_por_id, creado_por_nombre, notas, categoria) VALUES (?, ?, ?, ?, ?, ?)",
    [
      datos.titulo,
      await hashClaveMaestra(datos.clave),
      datos.creadoPorId,
      datos.creadoPorNombre,
      datos.notas ? cifrar(datos.notas) : null,
      datos.categoria,
    ]
  );
  await reemplazarItems(resultado.insertId, datos.items);
  return { id: resultado.insertId };
}

/** clave es opcional: si no viene, se deja el hash existente sin tocar.
 *  creado_por_id/nombre nunca se tocan acá — son autoría fijada al crear. */
export async function actualizarCredencial(
  id: number,
  datos: {
    titulo: string;
    clave: string | null;
    categoria: string | null;
    notas: string | null;
    items: ItemCredencial[];
  }
): Promise<boolean> {
  const notasCifradas = datos.notas ? cifrar(datos.notas) : null;
  const [resultado] = datos.clave
    ? await poolGestorp().query<ResultSetHeader>(
        "UPDATE portal_credenciales SET titulo = ?, clave_hash = ?, notas = ?, categoria = ? WHERE id = ?",
        [datos.titulo, await hashClaveMaestra(datos.clave), notasCifradas, datos.categoria, id]
      )
    : await poolGestorp().query<ResultSetHeader>(
        "UPDATE portal_credenciales SET titulo = ?, notas = ?, categoria = ? WHERE id = ?",
        [datos.titulo, notasCifradas, datos.categoria, id]
      );
  if (resultado.affectedRows === 0) return false;
  await reemplazarItems(id, datos.items);
  return true;
}

export async function borrarCredencial(id: number): Promise<boolean> {
  // Los ítems se borran solos por ON DELETE CASCADE.
  const [resultado] = await poolGestorp().query<ResultSetHeader>(
    "DELETE FROM portal_credenciales WHERE id = ?",
    [id]
  );
  return resultado.affectedRows > 0;
}

/** Solo confirma si la clave maestra coincide con su hash — sin tocar el
 *  contenido cifrado. Se usa antes de borrar, donde no hace falta descifrar
 *  nada, solo probar que quien pide el borrado conoce la clave. */
export async function verificarClaveContenedor(id: number, clave: string): Promise<boolean> {
  const [filas] = await poolGestorp().query<FilaConHash[]>(
    "SELECT clave_hash FROM portal_credenciales WHERE id = ? LIMIT 1",
    [id]
  );
  const fila = filas[0];
  if (!fila) return false;
  return verificarClaveMaestra(clave, fila.clave_hash);
}

/** Verifica la clave maestra contra su hash y, solo si coincide, descifra y
 *  devuelve el contenido sensible (notas + ítems). Nunca devuelve la clave
 *  en sí — no existe forma de recuperarla, solo de confirmarla. */
export async function desbloquearCredencial(id: number, clave: string): Promise<ContenidoCredencial | null> {
  const correcta = await verificarClaveContenedor(id, clave);
  if (!correcta) return null;

  const [[filasNotas], [items]] = await Promise.all([
    poolGestorp().query<FilaConNotasCifradas[]>("SELECT notas FROM portal_credenciales WHERE id = ? LIMIT 1", [id]),
    poolGestorp().query<FilaItem[]>(
      "SELECT etiqueta, valor FROM portal_credenciales_items WHERE credencial_id = ? ORDER BY orden ASC, id ASC",
      [id]
    ),
  ]);

  const notasCifradas = filasNotas[0]?.notas ?? null;
  return {
    notas: notasCifradas ? descifrar(notasCifradas) : null,
    items: items.map((it) => ({ etiqueta: it.etiqueta, valor: descifrar(it.valor) })),
  };
}
