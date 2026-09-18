"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type FiltroCategoriaProps = {
  categorias: string[];
  categoria: string;
  onCategoriaChange: (categoria: string) => void;
};

export function FiltroCategoria({ categorias, categoria, onCategoriaChange }: FiltroCategoriaProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const alClicFuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", alClicFuera);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alEscape);
    };
  }, [abierto]);

  return (
    <div ref={contenedorRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={cn(
          "input-portal flex items-center gap-2 py-2 pl-3.5 pr-3 text-sm font-medium text-ink cursor-pointer",
          abierto && "border-brand shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-brand)_15%,transparent)]"
        )}
      >
        <SlidersHorizontal className="size-4 text-ink-faint" />
        <span className="max-w-[9rem] truncate sm:max-w-[11rem]">{categoria}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-ink-faint transition-transform", abierto && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="tarjeta absolute left-0 z-30 mt-2 w-64 origin-top-left overflow-hidden !p-1.5 shadow-md"
          >
            {categorias.map((c) => {
              const activa = c === categoria;
              return (
                <button
                  key={c}
                  role="option"
                  aria-selected={activa}
                  onClick={() => {
                    onCategoriaChange(c);
                    setAbierto(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                    activa
                      ? "bg-brand-soft font-semibold text-brand"
                      : "text-ink-dim hover:bg-line-soft hover:text-ink"
                  )}
                >
                  <span className="truncate">{c}</span>
                  {activa && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
