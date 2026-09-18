import bcrypt from "bcryptjs";

// La clave maestra de un contenedor se guarda como hash irreversible —
// igual que las contraseñas de PIGO (lib/auth.ts) — nunca como algo que se
// pueda descifrar y mostrar de nuevo. Solo sirve para verificar.
const RONDAS_SAL = 10;

export async function hashClaveMaestra(clave: string): Promise<string> {
  return bcrypt.hash(clave, RONDAS_SAL);
}

export async function verificarClaveMaestra(clave: string, hash: string): Promise<boolean> {
  return bcrypt.compare(clave, hash);
}
