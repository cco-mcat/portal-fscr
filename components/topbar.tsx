"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Search, Settings } from "lucide-react";
import { FiltroCategoria } from "@/components/filtro-categoria";

type TopbarProps = {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  categorias: string[];
  categoria: string;
  onCategoriaChange: (categoria: string) => void;
};

export function Topbar({
  busqueda,
  onBusquedaChange,
  categorias,
  categoria,
  onCategoriaChange,
}: TopbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="gradiente-pigo sticky top-0 z-20"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-2.5">
        <div className="flex shrink-0 items-center gap-3">
          <Image
            src="/logo-cco.png"
            alt="FSCR Ingeniería S.A.S."
            width={303}
            height={116}
            priority
            className="h-[48px] w-auto"
          />
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="relative w-full max-w-[11rem] sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="Buscar un sistema…"
              className="input-portal w-full py-2 pl-10 pr-4 text-sm text-ink"
            />
          </div>

          <FiltroCategoria
            categorias={categorias}
            categoria={categoria}
            onCategoriaChange={onCategoriaChange}
          />

          <Link
            href="/admin"
            aria-label="Gestionar proyectos"
            title="Gestionar proyectos"
            className="input-portal flex size-9 shrink-0 items-center justify-center text-ink-faint transition-colors hover:text-brand"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
