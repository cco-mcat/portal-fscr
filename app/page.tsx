"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/topbar";
import { PieCorporativo } from "@/components/pie-corporativo";
import { PortalSistemas } from "@/components/portal-sistemas";
import { FondoVideo } from "@/components/fondo-video";
import { CATEGORIA_TODOS, type Sistema } from "@/lib/sistemas";
import { usarCarruselProyectos } from "@/lib/usar-carrusel-proyectos";

export default function Home() {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIA_TODOS);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [categorias, setCategorias] = useState<string[]>([CATEGORIA_TODOS]);
  const [cargando, setCargando] = useState(true);

  // La grilla pública consume el mismo backend que administra el panel de
  // /admin (bd_gestorp vía /api/proyectos) — ya no hay proyectos de
  // ejemplo hardcodeados en lib/sistemas.ts.
  useEffect(() => {
    fetch("/api/proyectos")
      .then((res) => res.json())
      .then((datos) => {
        setSistemas(datos.sistemas ?? []);
        setCategorias(datos.categorias ?? [CATEGORIA_TODOS]);
      })
      .finally(() => setCargando(false));
  }, []);

  const { sistemasFiltrados, sistemasPagina, totalPaginas, avanzar, retroceder } =
    usarCarruselProyectos(sistemas, busqueda, categoria);

  return (
    <>
      <FondoVideo />
      <Topbar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        categorias={categorias}
        categoria={categoria}
        onCategoriaChange={setCategoria}
      />

      {/* Este div (no <main>) es el que ocupa TODO el espacio entre topbar y
          footer, a todo lo ancho de la pantalla — las zonas de clic viven
          acá para poder cubrir de verdad "entre las tarjetas y toda la
          pantalla", no solo la columna centrada de max-w-6xl. */}
      <div className="relative flex min-h-0 flex-1">
        {totalPaginas > 1 && (
          <>
            {/* Zonas invisibles, DETRÁS de las tarjetas (z-0 vs z-10 de
                main). No tapan nada: <main> lleva pointer-events-none, así
                que un clic solo "aterriza" acá si no cayó encima de una
                tarjeta real (esas sí capturan el clic, tienen su propio
                pointer-events-auto). Mitad izquierda retrocede, mitad
                derecha avanza. */}
            <button
              type="button"
              onClick={retroceder}
              aria-label="Página anterior de proyectos"
              className="absolute inset-y-0 left-0 z-0 w-1/2 cursor-w-resize"
            />
            <button
              type="button"
              onClick={avanzar}
              aria-label="Página siguiente de proyectos"
              className="absolute inset-y-0 right-0 z-0 w-1/2 cursor-e-resize"
            />
          </>
        )}

        <main className="pointer-events-none relative z-10 mx-auto flex w-full min-h-0 max-w-6xl flex-1 flex-col justify-center px-6 pt-6 pb-8">
          {cargando ? (
            <p className="text-center text-sm text-ink-faint">Cargando sistemas…</p>
          ) : (
            <PortalSistemas
              busqueda={busqueda}
              sistemasFiltrados={sistemasFiltrados}
              sistemasPagina={sistemasPagina}
              totalPaginas={totalPaginas}
              avanzar={avanzar}
              retroceder={retroceder}
            />
          )}
        </main>
      </div>

      <PieCorporativo />
    </>
  );
}
