import mysql from "mysql2/promise";

// Dos pools separados a propósito: gestorp (lectura/escritura, nuestras
// tablas) y proyecciones (SOLO lectura, es la base de PIGO — nunca se
// debe escribir ahí desde este proyecto). Mantenerlos como pools
// distintos hace imposible, por diseño, escribir por accidente en la
// base de otra aplicación usando el pool equivocado.
function crearPool(nombreBaseDatos: string) {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: nombreBaseDatos,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    // Nunca hay razón de negocio para que una consulta tarde >10s en este
    // proyecto (tablas chicas, CRUD simple) — un valor bajo evita que una
    // conexión colgada agote el pool completo.
    connectTimeout: 10_000,
  });
}

let _poolGestorp: mysql.Pool | null = null;
let _poolProyecciones: mysql.Pool | null = null;

export function poolGestorp() {
  if (!_poolGestorp) _poolGestorp = crearPool(process.env.DB_NAME_GESTORP!);
  return _poolGestorp;
}

/** Solo lectura por convención — ningún repositorio de este proyecto debe
 *  ejecutar INSERT/UPDATE/DELETE contra este pool. */
export function poolProyecciones() {
  if (!_poolProyecciones) _poolProyecciones = crearPool(process.env.DB_NAME_PROYECCIONES!);
  return _poolProyecciones;
}
