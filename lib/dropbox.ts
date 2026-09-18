// Cliente mínimo de Dropbox sin SDK — solo las 3 llamadas que este
// proyecto necesita (refrescar token, subir archivo, obtener link
// público). Reutiliza la misma app de Dropbox que ya usa el sistema NC
// (DBX_APP_KEY/SECRET), pero con su propio refresh token y carpeta raíz
// separada (DBX_ROOT_FOLDER) para no mezclar archivos entre proyectos.

let tokenCache: { valor: string; expiraEn: number } | null = null;

async function obtenerAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiraEn > Date.now()) return tokenCache.valor;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: process.env.DBX_REFRESH_TOKEN!,
    client_id: process.env.DBX_APP_KEY!,
    client_secret: process.env.DBX_APP_SECRET!,
  });

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`No se pudo renovar el token de Dropbox (${res.status}).`);
  }
  const datos = (await res.json()) as { access_token: string; expires_in: number };
  // Restamos 60s de margen para no usar un token que expira justo durante la llamada.
  tokenCache = { valor: datos.access_token, expiraEn: Date.now() + (datos.expires_in - 60) * 1000 };
  return tokenCache.valor;
}

/** Sube un logo a Dropbox y devuelve una URL pública directa (dl=1, sirve el
 *  archivo crudo, apta para usar como src de <img>). */
export async function subirLogoADropbox(archivo: Buffer, nombreArchivo: string): Promise<string> {
  const accessToken = await obtenerAccessToken();
  const ruta = `${process.env.DBX_ROOT_FOLDER}/${nombreArchivo}`;

  const resSubida = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: ruta,
        mode: "add",
        autorename: true,
        mute: true,
      }),
    },
    body: new Uint8Array(archivo),
  });
  if (!resSubida.ok) {
    const detalle = await resSubida.text();
    throw new Error(`No se pudo subir el logo a Dropbox (${resSubida.status}): ${detalle}`);
  }
  const metadata = (await resSubida.json()) as { path_display: string };

  // Reusar un link existente si ya se creó antes (Dropbox rechaza crear dos
  // links para la misma ruta) — si no existe, se crea uno nuevo.
  const resLink = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: metadata.path_display }),
  });

  let urlCompartida: string;
  if (resLink.ok) {
    const datosLink = (await resLink.json()) as { url: string };
    urlCompartida = datosLink.url;
  } else {
    const resListado = await fetch("https://api.dropboxapi.com/2/sharing/list_shared_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: metadata.path_display, direct_only: true }),
    });
    if (!resListado.ok) {
      throw new Error("No se pudo obtener el link público del logo subido a Dropbox.");
    }
    const datosListado = (await resListado.json()) as { links: Array<{ url: string }> };
    urlCompartida = datosListado.links[0]?.url ?? "";
  }

  // El link de "compartir" de Dropbox (?dl=0) abre una página de preview,
  // no sirve la imagen cruda — se fuerza dl=1 para uso directo como <img src>.
  const url = new URL(urlCompartida);
  url.searchParams.set("dl", "1");
  return url.toString();
}
