"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
};

// Modal centrado y simple — le da al formulario real el espacio que la
// columna angosta de la izquierda no puede darle (ahí solo quedan las
// tarjetas de acción compactas, ver tarjeta-accion.tsx).
export function Modal({ abierto, titulo, onCerrar, children }: Props) {
  useEffect(() => {
    if (!abierto) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--color-brand-navy)_55%,transparent)] px-4 py-10 backdrop-blur-sm"
          onClick={onCerrar}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="tarjeta w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">{titulo}</h2>
              <button
                onClick={onCerrar}
                aria-label="Cerrar"
                className="flex size-8 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-neutro-bg hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
