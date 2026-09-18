import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { poolGestorp, poolProyecciones } from "@/lib/db";

const NOMBRE_COOKIE = "portal_admin_sesion";
const DURACION_SESION_SEGUNDOS = 60 * 60 * 8; // 8h — igual que la sesión de PIGO

export type SesionAdmin = {
  usuarioPigoId: number;
  nombre: string;
  usuario: string;
};

interface FilaUsuarioPigo extends RowDataPacket {
  id: number;
  nombres: string;
  apellidos: string;
  usuario: string;
  clave: string;
  estado: string;
}

interface FilaAdminPermitido extends RowDataPacket {
  id: number;
}

interface FilaEstadoUsuario extends RowDataPacket {
  estado: string;
}

/**
 * Valida usuario+clave contra bd_proyecciones.usuario (la MISMA contraseña
 * que ya usan a diario en PIGO) y exige además que el id esté en
 * portal_admins_permitidos (bd_gestorp) — las dos condiciones son
 * obligatorias, ninguna sustituye a la otra.
 *
 * A propósito NO toca bd_proyecciones.usuario.active_session_id: eso es el
 * control de sesión única de PIGO — si lo tocáramos desde acá, cerraríamos
 * sin avisar la sesión real de la persona en PIGO.
 *
 * Mensaje de error siempre genérico (nunca distingue "no existe" de
 * "contraseña incorrecta") para no permitir enumeración de cuentas.
 */
export async function validarLogin(
  usuario: string,
  clave: string
): Promise<{ ok: true; sesion: SesionAdmin } | { ok: false; error: string }> {
  const ERROR_GENERICO = "Usuario o contraseña incorrectos.";

  const [filas] = await poolProyecciones().query<FilaUsuarioPigo[]>(
    "SELECT id, nombres, apellidos, usuario, clave, estado FROM usuario WHERE usuario = ? LIMIT 1",
    [usuario]
  );
  const fila = filas[0];
  if (!fila || fila.estado !== "ACTIVO") {
    return { ok: false, error: ERROR_GENERICO };
  }

  // El hash de PIGO puede venir como $2y$ (formato PHP) — bcryptjs espera
  // $2a$/$2b$; son el mismo algoritmo, solo cambia la etiqueta de versión.
  const hashCompatible = fila.clave.replace(/^\$2y\$/, "$2a$");
  const claveValida = await bcrypt.compare(clave, hashCompatible);
  if (!claveValida) {
    return { ok: false, error: ERROR_GENERICO };
  }

  const [permitidos] = await poolGestorp().query<FilaAdminPermitido[]>(
    "SELECT id FROM portal_admins_permitidos WHERE usuario_pigo_id = ? AND activo = 1 LIMIT 1",
    [fila.id]
  );
  if (permitidos.length === 0) {
    // Mismo mensaje genérico: no revelamos que la contraseña SÍ era
    // correcta pero el usuario no tiene acceso a este panel en particular.
    return { ok: false, error: ERROR_GENERICO };
  }

  return {
    ok: true,
    sesion: {
      usuarioPigoId: fila.id,
      nombre: `${fila.nombres} ${fila.apellidos}`.trim(),
      usuario: fila.usuario,
    },
  };
}

/**
 * `seguro` decide el atributo `Secure` de la cookie y SIEMPRE debe reflejar
 * si la petición actual llegó por HTTPS real (ver app/api/auth/login/route.ts) —
 * nunca `NODE_ENV === "production"` a secas: ese chequeo marca la cookie
 * como Secure aunque el sitio se sirva por HTTP plano (ej. acceso directo
 * por IP:puerto sin nginx/TLS delante todavía), y un navegador DESCARTA en
 * silencio cualquier cookie Secure recibida por una conexión no-HTTPS — el
 * login responde 200 pero la sesión nunca queda guardada.
 */
export async function crearCookieSesion(sesion: SesionAdmin, seguro: boolean) {
  const token = jwt.sign(sesion, process.env.AUTH_JWT_SECRET!, {
    expiresIn: DURACION_SESION_SEGUNDOS,
  });
  const store = await cookies();
  store.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: seguro,
    // "lax" no viaja en un fetch cross-site (solo en navegación top-level),
    // y frontend (app.fscr.com.co) y backend (api-fscr.analisisinteligente.com.co)
    // ya son orígenes distintos — sin "none" el login nunca guardaría sesión.
    // "none" exige Secure=true, por eso depende del mismo flag.
    sameSite: seguro ? "none" : "lax",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  });
}

export async function cerrarSesion() {
  const store = await cookies();
  store.delete(NOMBRE_COOKIE);
}

/**
 * Lee y valida la sesión actual — usar al INICIO de cada route handler
 * protegido, nunca confiar solo en que el frontend oculte un botón.
 *
 * La cookie firmada solo prueba que hace ≤8h alguien pasó validarLogin();
 * NO prueba que el acceso siga vigente en este instante. Sin la
 * revalidación de abajo, revocar a alguien de portal_admins_permitidos (o
 * que PIGO desactive su cuenta) era cosmético hasta que expirara su JWT —
 * hasta 8h con el panel todavía abierto. Por eso cada llamada vuelve a
 * consultar ambas condiciones en caliente, exactamente las mismas que
 * validarLogin exige al iniciar sesión — ninguna sustituye a la otra ahí
 * tampoco. El costo (dos SELECT por id indexado, contra una tabla de 3
 * filas y una de usuarios) es irrelevante para el tráfico real de este
 * panel; lo que compra es que una revocación surta efecto en la siguiente
 * request, no en la siguiente medianoche.
 */
export async function obtenerSesionActual(): Promise<SesionAdmin | null> {
  const store = await cookies();
  const token = store.get(NOMBRE_COOKIE)?.value;
  if (!token) return null;

  let sesion: SesionAdmin;
  try {
    sesion = jwt.verify(token, process.env.AUTH_JWT_SECRET!) as SesionAdmin;
  } catch {
    return null;
  }

  const [permitidos] = await poolGestorp().query<FilaAdminPermitido[]>(
    "SELECT id FROM portal_admins_permitidos WHERE usuario_pigo_id = ? AND activo = 1 LIMIT 1",
    [sesion.usuarioPigoId]
  );
  if (permitidos.length === 0) return null;

  const [usuarios] = await poolProyecciones().query<FilaEstadoUsuario[]>(
    "SELECT estado FROM usuario WHERE id = ? LIMIT 1",
    [sesion.usuarioPigoId]
  );
  if (usuarios.length === 0 || usuarios[0].estado !== "ACTIVO") return null;

  return sesion;
}

/**
 * Re-verifica la contraseña de PIGO de la sesión actual — usada como
 * segundo factor para desbloquear un contenedor de "Información sensible"
 * (además de la clave maestra propia del contenedor). Tener una sesión
 * admin válida no alcanza para ver esos datos: hay que volver a probar que
 * sos vos escribiendo tu propia contraseña, igual que al hacer login.
 */
export async function verificarClavePropia(usuarioPigoId: number, clave: string): Promise<boolean> {
  const [filas] = await poolProyecciones().query<FilaUsuarioPigo[]>(
    "SELECT clave, estado FROM usuario WHERE id = ? LIMIT 1",
    [usuarioPigoId]
  );
  const fila = filas[0];
  if (!fila || fila.estado !== "ACTIVO") return false;

  const hashCompatible = fila.clave.replace(/^\$2y\$/, "$2a$");
  return bcrypt.compare(clave, hashCompatible);
}
