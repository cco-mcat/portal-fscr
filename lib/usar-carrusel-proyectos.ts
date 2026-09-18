import { useEffect, useMemo, useState } from "react";
import type { Sistema } from "@/lib/sistemas";

const POR_PAGINA = 6;

function agruparDeSeis(sistemas: Sistema[]): Sistema[][] {
  const grupos: Sistema[][] = [];
  for (let i = 0; i < sistemas.length; i += POR_PAGINA) {
    grupos.push(sistemas.slice(i, i + POR_PAGINA));
  }
  return grupos.length > 0 ? grupos : [[]];
}

/**
 * Filtrado (búsqueda + categoría) y paginación de a 6 en un solo lugar —
 * page.tsx la necesita para las zonas de clic invisibles, PortalSistemas
 * para pintar las tarjetas; antes esto vivía solo dentro de PortalSistemas
 * y no había forma de disparar "avanzar/retroceder" desde afuera.
 */
export function usarCarruselProyectos(
  sistemas: Sistema[],
  busqueda: string,
  categoria: string
) {
  const [pagina, setPagina] = useState(0);

  const sistemasFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return sistemas.filter((s) => {
      const coincideCategoria = categoria === "Todos" || s.categoria === categoria;
      const coincideTexto =
        !texto ||
        s.nombre.toLowerCase().includes(texto) ||
        s.descripcion.toLowerCase().includes(texto);
      return coincideCategoria && coincideTexto;
    });
  }, [sistemas, busqueda, categoria]);

  const paginas = useMemo(() => agruparDeSeis(sistemasFiltrados), [sistemasFiltrados]);

  // Nuevo filtro/búsqueda = nuevo conjunto de páginas; si nos quedábamos en
  // la página 1 de un resultado que ahora solo tiene una, se vería vacío.
  useEffect(() => {
    setPagina(0);
  }, [busqueda, categoria]);

  const totalPaginas = paginas.length;
  const paginaSegura = Math.min(pagina, totalPaginas - 1);
  const sistemasPagina = paginas[paginaSegura] ?? [];

  const avanzar = () => setPagina((p) => (p + 1) % totalPaginas);
  const retroceder = () => setPagina((p) => (p - 1 + totalPaginas) % totalPaginas);

  return { sistemasFiltrados, sistemasPagina, totalPaginas, avanzar, retroceder };
}
