"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { AlertTriangle, FolderKanban, Plus, Trash2 } from "lucide-react";
import { ICONOS_SISTEMA } from "@/components/iconos-sistema";
import type { IconoSistema } from "@/lib/sistemas";
import { Modal } from "@/components/admin/modal";

export type FondoLogo = "claro" | "oscuro";

export type Proyecto = {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  nombre: string;
  descripcion: string;
  href: string;
  logo_url: string | null;
  fondo_logo: FondoLogo;
  icono: string;
  activo: number;
  orden: number;
  creado_en: string;
};

type Props = {
  proyectos: Proyecto[];
  onCambio: () => void | Promise<void>;
  onError: (mensaje: string) => void;
  onAgregar: () => void;
};

const OPCIONES_FONDO = [
  { valor: "claro" as const, etiqueta: "Claro", swatch: "var(--color-neutro-bg)" },
  { valor: "oscuro" as const, etiqueta: "Oscuro", swatch: "var(--color-brand-navy)" },
];

export function ListaProyectos({ proyectos, onCambio, onError, onAgregar }: Props) {
  const [editando, setEditando] = useState<Proyecto | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [descripcionEditada, setDescripcionEditada] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aConfirmar, setAConfirmar] = useState<Proyecto | null>(null);
  const [borrando, setBorrando] = useState(false);

  // Al abrir el editor de un proyecto, precargar los borradores con sus
  // valores actuales — si no, el primer render del modal mostraría los
  // inputs vacíos hasta el próximo cambio de estado.
  useEffect(() => {
    if (editando) {
      setNombreEditado(editando.nombre);
      setDescripcionEditada(editando.descripcion);
    }
  }, [editando]);

  async function confirmarBorrar() {
    if (!aConfirmar) return;
    setBorrando(true);
    const res = await fetch(`/api/admin/proyectos/${aConfirmar.id}`, { method: "DELETE" });
    const datos = await res.json();
    setBorrando(false);
    if (!res.ok) {
      onError(datos.error ?? "No se pudo borrar el proyecto.");
      setAConfirmar(null);
      return;
    }
    setAConfirmar(null);
    await onCambio();
  }

  async function guardarFondoLogo(fondoLogo: FondoLogo) {
    if (!editando) return;
    setGuardando(true);
    const res = await fetch(`/api/admin/proyectos/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fondoLogo }),
    });
    const datos = await res.json();
    setGuardando(false);
    if (!res.ok) {
      onError(datos.error ?? "No se pudo actualizar el fondo del logo.");
      return;
    }
    setEditando(null);
    await onCambio();
  }

  async function alternarActivoEnModal() {
    if (!editando) return;
    const nuevoActivo = editando.activo !== 1;
    setGuardando(true);
    const res = await fetch(`/api/admin/proyectos/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: nuevoActivo }),
    });
    const datos = await res.json();
    setGuardando(false);
    if (!res.ok) {
      onError(datos.error ?? "No se pudo actualizar el proyecto.");
      return;
    }
    // A diferencia de guardarFondoLogo, este NO cierra el modal — es un
    // interruptor que se puede prender/apagar varias veces mientras se
    // sigue editando el resto del proyecto.
    setEditando((prev) => (prev ? { ...prev, activo: nuevoActivo ? 1 : 0 } : prev));
    await onCambio();
  }

  async function guardarDetalles(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    const nombre = nombreEditado.trim();
    const descripcion = descripcionEditada.trim();
    if (!nombre) {
      onError("El nombre del proyecto es obligatorio.");
      return;
    }
    if (!descripcion) {
      onError("La descripción es obligatoria.");
      return;
    }
    setGuardando(true);
    const res = await fetch(`/api/admin/proyectos/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, descripcion }),
    });
    const datos = await res.json();
    setGuardando(false);
    if (!res.ok) {
      onError(datos.error ?? "No se pudo actualizar el proyecto.");
      return;
    }
    setEditando(null);
    await onCambio();
  }

  if (proyectos.length === 0) {
    return (
      <div className="tarjeta relative flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="icono-sistema relative flex size-14 shrink-0 items-center justify-center rounded-xl">
          <FolderKanban className="size-6" />
        </span>
        <div className="relative">
          <p className="text-sm font-bold text-ink">Todavía no hay proyectos</p>
          <p className="mt-1 text-xs text-ink-faint">
            Publica el primer sistema para que empiece a verse en el portal.
          </p>
        </div>
        <button
          onClick={onAgregar}
          className="relative mt-1 flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover cursor-pointer"
        >
          <Plus className="size-3.5" />
          Agregar el primer proyecto
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {proyectos.map((p, i) => {
          const Icono = ICONOS_SISTEMA[p.icono as IconoSistema] ?? ICONOS_SISTEMA["line-chart"];
          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.04 }}
              // Toda la tarjeta abre el editor de fondo del logo — el botón
              // de borrar y el chip Visible/Oculto detienen la propagación
              // para que no se abra el modal cuando el clic era para ellos.
              onClick={() => setEditando(p)}
              role="button"
              tabIndex={0}
              className="tarjeta tarjeta-hover flex items-start gap-3.5 p-4 text-left cursor-pointer"
            >
              {p.logo_url ? (
                <span
                  className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border ${
                    p.fondo_logo === "oscuro"
                      ? "border-transparent bg-[var(--color-brand-navy)]"
                      : "border-line bg-[var(--color-neutro-bg)]"
                  }`}
                >
                  <Image
                    src={p.logo_url}
                    alt={p.nombre}
                    width={40}
                    height={40}
                    className="size-full object-contain p-1"
                    unoptimized
                  />
                </span>
              ) : (
                <span className="icono-sistema flex size-11 shrink-0 items-center justify-center rounded-lg">
                  <Icono className="size-5" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-bold text-ink">{p.nombre}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAConfirmar(p);
                    }}
                    aria-label={`Borrar ${p.nombre}`}
                    className="shrink-0 text-ink-faint transition-colors hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-dim">{p.descripcion}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="chip bg-neutro-bg text-neutro-texto">{p.categoria_nombre}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal
        abierto={editando !== null}
        titulo={editando ? `Editar proyecto — ${editando.nombre}` : ""}
        onCerrar={() => setEditando(null)}
      >
        {editando && (
          <form onSubmit={guardarDetalles} className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    editando.activo === 1 ? "text-emerald-600" : "text-ink-faint"
                  }`}
                >
                  {editando.activo === 1 ? "Visible" : "Oculto"}
                </p>
                <p className="text-xs text-ink-faint">Los usuarios lo ven en la grilla pública.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={editando.activo === 1}
                disabled={guardando}
                onClick={alternarActivoEnModal}
                className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
                  editando.activo === 1 ? "bg-emerald-500" : "bg-line"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                    editando.activo === 1 ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div>
              <span className="chip-mono mb-1.5 block text-ink-faint">Nombre del proyecto</span>
              <input
                value={nombreEditado}
                onChange={(e) => setNombreEditado(e.target.value)}
                className="input-portal w-full px-3 py-2 text-sm text-ink"
              />
            </div>

            <div>
              <span className="chip-mono mb-1.5 block text-ink-faint">Descripción</span>
              <textarea
                value={descripcionEditada}
                onChange={(e) => setDescripcionEditada(e.target.value)}
                rows={2}
                className="input-portal w-full px-3 py-2 text-sm text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="flex w-full items-center justify-center rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60 cursor-pointer"
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>

            <div className="border-t border-line pt-4">
              <span className="chip-mono mb-2 block text-ink-faint">Fondo del logo</span>
              <p className="mb-3 text-xs text-ink-faint">
                Elige el recuadro donde se apoya el logo en el portal — útil cuando el logo
                trae su propio fondo blanco o transparente sólido.
              </p>
              <div className="flex gap-3">
              {OPCIONES_FONDO.map((op) => {
                const activo = editando.fondo_logo === op.valor;
                return (
                  <button
                    key={op.valor}
                    type="button"
                    disabled={guardando}
                    onClick={() => guardarFondoLogo(op.valor)}
                    className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-colors cursor-pointer disabled:opacity-60 ${
                      activo ? "border-brand-line bg-brand-soft" : "border-line hover:border-brand-line"
                    }`}
                  >
                    <span
                      className="flex size-12 items-center justify-center rounded-lg border border-line"
                      style={{ background: op.swatch }}
                    >
                      {editando.logo_url && (
                        <Image
                          src={editando.logo_url}
                          alt=""
                          width={40}
                          height={40}
                          className="size-full object-contain p-1.5"
                          unoptimized
                        />
                      )}
                    </span>
                    <span className={`text-xs font-semibold ${activo ? "text-brand" : "text-ink-dim"}`}>
                      {op.etiqueta}
                    </span>
                  </button>
                );
              })}
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        abierto={aConfirmar !== null}
        titulo="Borrar proyecto"
        onCerrar={() => setAConfirmar(null)}
      >
        {aConfirmar && (
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3 rounded-md bg-red-50 px-3 py-3">
              <AlertTriangle className="size-4.5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">
                ¿Borrar el proyecto <strong>{aConfirmar.nombre}</strong>? Desaparecerá del portal
                público de inmediato y esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAConfirmar(null)}
                className="rounded-md px-3.5 py-2 text-sm font-semibold text-ink-dim transition-colors hover:bg-neutro-bg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={borrando}
                onClick={confirmarBorrar}
                className="rounded-md bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {borrando ? "Borrando…" : "Sí, borrar"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
