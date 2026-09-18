import { NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";
import { listarProyectos, crearProyecto, type FondoLogo } from "@/lib/repos/proyectos";
import { subirLogoADropbox } from "@/lib/dropbox";

// SVG incluido a pedido explícito. Un SVG puede llevar <script>/onload
// embebido — la mitigación real NO es prohibirlo, es que el frontend
// SIEMPRE lo renderice con <img src="..."> (nunca inline/dangerouslySetInnerHTML
// ni <object>/<iframe>): los navegadores no ejecutan scripts de un SVG
// cargado como <img>, lo tratan como imagen estática. Ver TarjetaSistema —
// ese contrato debe respetarse si se toca ese componente más adelante.
const TIPOS_PERMITIDOS = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const proyectos = await listarProyectos();
  return NextResponse.json({ proyectos });
}

export async function POST(request: Request) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });

  const categoriaId = Number(form.get("categoriaId"));
  const nombre = String(form.get("nombre") ?? "").trim();
  const descripcion = String(form.get("descripcion") ?? "").trim();
  const hrefIngresada = String(form.get("href") ?? "").trim();
  // Muchos sistemas internos se escriben sin protocolo ("siges.fscr.com.co")
  // porque viven en la red propia de la empresa — antes eso se rechazaba
  // de plano porque new URL() exige protocolo explícito. Si falta, se
  // asume https:// (nunca http, para no degradar servidores que sí sirven
  // por TLS) en vez de obligar al usuario a escribirlo a mano.
  const href = /^https?:\/\//i.test(hrefIngresada) ? hrefIngresada : `https://${hrefIngresada}`;
  const icono = String(form.get("icono") ?? "").trim();
  const logo = form.get("logo");
  const fondoLogoRecibido = String(form.get("fondoLogo") ?? "").trim();
  const fondoLogo: FondoLogo = fondoLogoRecibido === "oscuro" ? "oscuro" : "claro";

  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    return NextResponse.json({ error: "Selecciona una categoría válida." }, { status: 400 });
  }
  if (!nombre || nombre.length > 120) {
    return NextResponse.json({ error: "El nombre debe tener entre 1 y 120 caracteres." }, { status: 400 });
  }
  if (!descripcion || descripcion.length > 500) {
    return NextResponse.json(
      { error: "La descripción debe tener entre 1 y 500 caracteres." },
      { status: 400 }
    );
  }
  let hrefValida: URL;
  try {
    hrefValida = new URL(href);
    if (hrefValida.protocol !== "https:" && hrefValida.protocol !== "http:") throw new Error();
  } catch {
    return NextResponse.json({ error: "El enlace debe ser una URL http(s) válida." }, { status: 400 });
  }
  if (!icono) {
    return NextResponse.json({ error: "Selecciona un ícono." }, { status: 400 });
  }

  let logoUrl: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    if (!TIPOS_PERMITIDOS.has(logo.type)) {
      return NextResponse.json(
        { error: "El logo debe ser PNG, JPG, WEBP o SVG." },
        { status: 400 }
      );
    }
    if (logo.size > TAMANO_MAXIMO_BYTES) {
      return NextResponse.json({ error: "El logo no puede pesar más de 2MB." }, { status: 400 });
    }
    const buffer = Buffer.from(await logo.arrayBuffer());
    const extensionesPorTipo: Record<string, string> = {
      "image/png": "png",
      "image/webp": "webp",
      "image/jpeg": "jpg",
      "image/svg+xml": "svg",
    };
    const extension = extensionesPorTipo[logo.type] ?? "jpg";
    const nombreArchivo = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    try {
      logoUrl = await subirLogoADropbox(buffer, nombreArchivo);
    } catch {
      return NextResponse.json(
        { error: "No se pudo subir el logo a Dropbox. Intenta de nuevo." },
        { status: 502 }
      );
    }
  }

  const { id } = await crearProyecto({
    categoriaId,
    nombre,
    descripcion,
    href: hrefValida.toString(),
    icono,
    logoUrl,
    fondoLogo,
    creadoPorUsuarioId: sesion.usuarioPigoId,
  });

  return NextResponse.json({ id }, { status: 201 });
}
