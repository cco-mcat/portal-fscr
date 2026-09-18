"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { type Sistema } from "@/lib/sistemas";
import { ICONOS_SISTEMA } from "@/components/iconos-sistema";

// Misma receta EXACTA de "entrada de lista" que ya usan las tarjetas de
// Dashboard/Mis NC en nc_deploy (partials/scripts.php → window.ncAnim,
// animarEntradaLista): opacity 0→1, translateY 12→0, stagger 70ms,
// duración 380ms, easing "easeOutQuad" — acá con anime.js, acá con
// Framer Motion (misma librería que ya maneja todo lo demás en este
// proyecto: el crossfade por slot, el carrusel, popLayout), mismos
// números, sin el scale/pop que no encajaba.
const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94] as const;

const contenido: Variants = {
  oculto: { opacity: 0, y: 12 },
  visible: (indice: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: EASE_OUT_QUAD, delay: indice * 0.07 },
  }),
  // Salida corta y sin stagger — una tarjeta que se filtra debe irse ya,
  // no esperar su turno (nc_deploy no anima salidas de lista, solo
  // entradas; acá sí hace falta porque el carrusel/filtro remueve tarjetas
  // en vivo).
  saliendo: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

export function TarjetaSistema({ sistema, indice = 0 }: { sistema: Sistema; indice?: number }) {
  const Icono = ICONOS_SISTEMA[sistema.icono];

  return (
    // Mismo "truco" que en la versión de lista: este div es el slot fijo
    // por posición (lo indexa el padre con key={indice}, no con el slug del
    // sistema). Al cambiar de categoría con el mismo número de resultados,
    // el slot se queda montado — solo el contenido de adentro (AnimatePresence
    // por slug) hace crossfade, sin que la grilla entera se reacomode.
    <motion.div layout className="h-full">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.a
          key={sistema.slug}
          custom={indice}
          variants={contenido}
          initial="oculto"
          animate="visible"
          exit="saliendo"
          whileHover={{ y: -1, transition: { type: "tween", duration: 0.15, ease: "easeOut" } }}
          // El navegador arrastra los enlaces por defecto (el "fantasma" que
          // sale al hacer drag) — eso era lo que interfería con el gesto de
          // mover el carrusel al pasar por encima de una tarjeta.
          draggable={false}
          href={sistema.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group tarjeta-proyecto flex h-full flex-col gap-2.5 p-3.5"
        >
          <div className="flex items-start justify-between">
            {sistema.logoUrl ? (
              <span
                className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border ${
                  sistema.fondoLogo === "oscuro"
                    ? "border-transparent bg-[var(--color-brand-navy)]"
                    : "border-line bg-[var(--color-neutro-bg)]"
                }`}
              >
                <Image
                  src={sistema.logoUrl}
                  alt={sistema.nombre}
                  width={44}
                  height={44}
                  className="size-full object-contain p-1"
                  unoptimized
                />
              </span>
            ) : (
              <span className="icono-sistema flex size-11 shrink-0 items-center justify-center rounded-lg">
                <Icono className="size-5.5" />
              </span>
            )}
            <ArrowUpRight className="size-4 shrink-0 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="subrayado-azul max-w-full">
              <h3 className="text-[15px] font-bold text-ink">{sistema.nombre}</h3>
            </span>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#636f80]">
              {sistema.descripcion}
            </p>
          </div>

          <span className="chip chip-categoria w-fit shrink-0 bg-neutro-bg text-neutro-texto">
            {sistema.categoria}
          </span>
        </motion.a>
      </AnimatePresence>
    </motion.div>
  );
}
