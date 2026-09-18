// Regla única para la clave maestra de un contenedor — se usa tanto en el
// formulario (feedback inmediato) como en la API (nunca confiar solo en la
// validación del cliente).
const LARGO_MINIMO = 10;
const REGEX_MAYUSCULA = /[A-ZÁÉÍÓÚÑ]/;
const REGEX_SIMBOLO = /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/;

export function validarClaveMaestra(clave: string): string | null {
  if (clave.length < LARGO_MINIMO) {
    return `La clave debe tener al menos ${LARGO_MINIMO} caracteres.`;
  }
  if (!REGEX_MAYUSCULA.test(clave)) {
    return "La clave debe tener al menos una letra mayúscula.";
  }
  if (!REGEX_SIMBOLO.test(clave)) {
    return "La clave debe tener al menos un símbolo especial.";
  }
  return null;
}
