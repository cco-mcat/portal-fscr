"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type Props = {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  etiquetaAccion: string;
  onClick: () => void;
};

// Tarjeta de acción compacta — icono en cuadro de color, título, descripción
// corta y un enlace de acción abajo a la derecha. Reemplaza a los formularios
// completos que antes vivían siempre abiertos en la columna angosta (el
// selector de íconos + todos los campos hacían que "Nuevo proyecto" se
// comiera el resto del layout); acá solo se abre el formulario real al
// hacer clic, dentro de un modal con más espacio para respirar.
export function TarjetaAccion({ icono: Icono, titulo, descripcion, etiquetaAccion, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="tarjeta tarjeta-hover flex w-full flex-col gap-3 !border-brand-line p-4 text-left cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icono className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-ink">{titulo}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-dim">{descripcion}</p>
        </div>
      </div>
      <span className="flex items-center justify-end gap-1 text-xs font-semibold text-brand">
        {etiquetaAccion}
        <ArrowRight className="size-3.5" />
      </span>
    </button>
  );
}
