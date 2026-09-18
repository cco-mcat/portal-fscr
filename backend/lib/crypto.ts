import crypto from "crypto";

const ALGORITMO = "aes-256-gcm";
const LARGO_IV = 12;

function obtenerClave(): Buffer {
  const clave = process.env.CRED_ENCRYPTION_KEY;
  if (!clave) throw new Error("Falta CRED_ENCRYPTION_KEY en el entorno.");
  const buffer = Buffer.from(clave, "base64");
  if (buffer.length !== 32) {
    throw new Error("CRED_ENCRYPTION_KEY debe ser una clave base64 de 32 bytes.");
  }
  return buffer;
}

/** iv + authTag + ciphertext concatenados y codificados en un solo base64. */
export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(LARGO_IV);
  const cipher = crypto.createCipheriv(ALGORITMO, obtenerClave(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, cifrado]).toString("base64");
}

export function descifrar(payload: string): string {
  const datos = Buffer.from(payload, "base64");
  const iv = datos.subarray(0, LARGO_IV);
  const authTag = datos.subarray(LARGO_IV, LARGO_IV + 16);
  const cifrado = datos.subarray(LARGO_IV + 16);
  const decipher = crypto.createDecipheriv(ALGORITMO, obtenerClave(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
}
