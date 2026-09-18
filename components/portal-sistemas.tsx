"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Sistema } from "@/lib/sistemas";
import { TarjetaSistema } from "@/components/tarjeta-sistema";

type PortalSistemasProps = {
  busqueda: string;
  sistemasFiltrados: Sistema[];
  sistemasPagina: Sistema[];
  totalPaginas: number;
  avanzar: () => void;
  retroceder: () => void;
};

export function PortalSistemas({
  busqueda,
  sistemasFiltrados,
  sistemasPagina,
  totalPaginas,
  avanzar,
  retroceder,
}: PortalSistemasProps) {
  // Bonus además de las zonas de clic (ver page.tsx): scroll horizontal
  // (shift + rueda) o swipe de dos dedos en trackpad, sobre la grilla.
  // bloqueoRueda evita que un solo gesto dispare varias páginas de una (el
  // wheel manda muchos eventos seguidos por cada "empujón").
  const bloqueoRueda = useRef(false);
  const alMoverRueda = (e: React.WheelEvent) => {
    if (totalPaginas <= 1) return;
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (Math.abs(horizontal) < 25 || bloqueoRueda.current) return;
    bloqueoRueda.current = true;
    if (horizontal > 0) avanzar();
    else retroceder();
    setTimeout(() => {
      bloqueoRueda.current = false;
    }, 500);
  };

  return (
    // min-h-0 (sin shrink-0 ni flex-1): con el valor por defecto de flexbox
    // (grow:0, shrink:1) este panel toma su tamaño natural cuando sobra
    // espacio, pero SÍ puede achicarse cuando no alcanza — sin min-h-0 el
    // "min-height:auto" implícito de todo flex item se lo impediría y
    // volveríamos al bug: el panel se sale de su contenedor y el body
    // (que no scrollea) lo recorta a mitad de fila, perdiendo el pie de
    // página sin ninguna forma de llegar a él.
    <div className="pointer-events-auto min-h-0">
      <AnimatePresence mode="wait">
        {sistemasFiltrados.length > 0 ? (
          // key fija ("grid"), no key={categoria+busqueda}: antes cada
          // tecla en el buscador remontaba TODA la tarjeta (cabecera
          // incluida) de golpe. Con key fija, el contenedor se queda
          // montado entre filtros y solo sus hijos cambian — layout anima
          // la altura sola cuando entran/salen tarjetas, sin saltos.
          <motion.div
            key="grid"
            layout
            onWheel={alMoverRueda}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              // Misma curva easeOutQuad que las tarjetas (ver
              // tarjeta-sistema.tsx) — todo el sistema de entrada se siente
              // como una sola cosa, no dos animaciones distintas.
              duration: 0.38,
              ease: [0.25, 0.46, 0.45, 0.94],
              layout: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] },
            }}
            className="sin-scrollbar h-full min-h-0 overflow-x-hidden overflow-y-auto"
          >
            {/* key={i} (posición) en cada tarjeta, NO key={s.slug}: el
                mismo "truco" que ya usábamos para los filtros de categoría
                sirve igual para el carrusel — cada slot (0 a 5) se queda
                montado entre una página y la siguiente, y el crossfade del
                sistema que le toca pasa DENTRO de TarjetaSistema, sin que
                esta grilla se entere ni se reacomode de golpe. */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {sistemasPagina.map((s, i) => (
                  <TarjetaSistema key={i} sistema={s} indice={i} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="vacio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-dashed border-line py-16 text-center text-sm text-ink-faint"
          >
            {busqueda
              ? <>Ningún sistema coincide con &ldquo;{busqueda}&rdquo;.</>
              : "Todavía no hay sistemas publicados en el portal."}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
