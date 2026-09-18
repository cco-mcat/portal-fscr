"use client";

import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { ICONOS_DISPONIBLES } from "@/lib/sistemas";
import { ICONOS_SISTEMA } from "@/components/iconos-sistema";
import type { Categoria } from "@/components/admin/panel-admin";
import { apiFetch } from "@/lib/api-cliente";

type Props = {
  categorias: Categoria[];
  onCreado: () => void | Promise<void>;
  onError: (mensaje: string) => void;
};

const VACIO = {
  categoriaId: "",
  nombre: "",
  descripcion: "",
  href: "",
  icono: ICONOS_DISPONIBLES[0] as string,
  fondoLogo: "claro" as "claro" | "oscuro",
};

// Caption pequeña en mayúsculas encima de cada campo — mismo patrón de
// "chip-mono" que usa el formulario de solicitudes de DevForge (Label
// component sobre @radix-ui/react-label), acá como bloque simple porque
// el proyecto no trae esa dependencia.
function Campo({ children }: { children: React.ReactNode }) {
  return <span className="chip-mono mb-1.5 block text-ink-faint">{children}</span>;
}

export function FormularioProyecto({ categorias, onCreado, onError }: Props) {
  const [valores, setValores] = useState(VACIO);
  const [logo, setLogo] = useState<File | null>(null);
  const [sinLogo, setSinLogo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!valores.categoriaId) {
      onError("Selecciona una categoría.");
      return;
    }
    if (!sinLogo && !logo) {
      onError("Sube el logo del proyecto o activa \"Sin logo\" para usar un ícono.");
      return;
    }
    if (!valores.nombre.trim()) {
      onError("El nombre del proyecto es obligatorio.");
      return;
    }
    if (!valores.href.trim()) {
      onError("El enlace del proyecto es obligatorio.");
      return;
    }
    if (!valores.descripcion.trim()) {
      onError("La descripción es obligatoria.");
      return;
    }
    setEnviando(true);
    const form = new FormData();
    form.set("categoriaId", valores.categoriaId);
    form.set("nombre", valores.nombre);
    form.set("descripcion", valores.descripcion);
    form.set("href", valores.href);
    form.set("icono", valores.icono);
    form.set("fondoLogo", valores.fondoLogo);
    if (!sinLogo && logo) form.set("logo", logo);

    const res = await apiFetch("/api/admin/proyectos", { method: "POST", body: form });
    const datos = await res.json();
    setEnviando(false);
    if (!res.ok) {
      onError(datos.error ?? "No se pudo crear el proyecto.");
      return;
    }
    setValores(VACIO);
    setLogo(null);
    setSinLogo(false);
    await onCreado();
  }

  return (
    <form onSubmit={enviar} noValidate className="mt-4 space-y-4">
      <div>
        <Campo>Categoría</Campo>
        <select
          value={valores.categoriaId}
          onChange={(e) => setValores((v) => ({ ...v, categoriaId: e.target.value }))}
          className="input-portal w-full px-3 py-2 text-sm text-ink"
        >
          <option value="">Selecciona una categoría…</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-ink">Sin logo</p>
          <p className="text-xs text-ink-faint">Usa un ícono en vez de subir una imagen.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={sinLogo}
          onClick={() => {
            setSinLogo((v) => !v);
            setLogo(null);
          }}
          className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors cursor-pointer ${
            sinLogo ? "bg-brand" : "bg-line"
          }`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
              sinLogo ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {sinLogo && (
        <div>
          <Campo>Ícono</Campo>
          <div className="flex flex-wrap gap-2.5">
            {ICONOS_DISPONIBLES.map((i) => {
              const Icono = ICONOS_SISTEMA[i as keyof typeof ICONOS_SISTEMA];
              const activo = valores.icono === i;
              return (
                <button
                  key={i}
                  type="button"
                  title={i}
                  onClick={() => setValores((v) => ({ ...v, icono: i }))}
                  className={`flex size-[54px] shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                    activo
                      ? "border-brand-line bg-brand-soft text-brand"
                      : "border-line bg-neutro-bg text-neutro-texto hover:border-brand-line"
                  }`}
                >
                  <Icono className="size-6" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <Campo>Nombre del proyecto</Campo>
        <input
          placeholder="Ej: Gestión Documental"
          value={valores.nombre}
          onChange={(e) => setValores((v) => ({ ...v, nombre: e.target.value }))}
          className="input-portal w-full px-3 py-2 text-sm text-ink"
        />
      </div>

      <div>
        <Campo>Enlace</Campo>
        <input
          type="text"
          placeholder="https://… o siges.fscr.com.co (si no pones protocolo, se asume https)"
          value={valores.href}
          onChange={(e) => setValores((v) => ({ ...v, href: e.target.value }))}
          className="input-portal w-full px-3 py-2 text-sm text-ink"
        />
      </div>

      <div>
        <Campo>Descripción</Campo>
        <textarea
          placeholder="Qué hace este sistema y para quién es útil"
          rows={2}
          value={valores.descripcion}
          onChange={(e) => setValores((v) => ({ ...v, descripcion: e.target.value }))}
          className="input-portal w-full px-3 py-2 text-sm text-ink"
        />
      </div>

      {!sinLogo && (
        <>
          <div>
            <Campo>Logo</Campo>
            <label className="input-portal flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink-dim">
              <UploadCloud className="size-4 shrink-0" />
              {logo ? logo.name : "PNG, JPG, WEBP o SVG — máx 2MB"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <Campo>Fondo del logo</Campo>
            {/* Muchos logos vienen con fondo blanco/transparente sólido —
                sobre una tarjeta clara casi no se nota, pero si el fondo del
                logo es blanco puro puede verse "flotando" sin marco. Este
                selector deja elegir el recuadro donde se apoya: beige (el
                mismo neutro que ya usan los íconos del portal) u oscuro (el
                mismo navy del header, no negro puro). Solo aplica cuando SÍ
                hay logo — sin logo, el que se ve es el ícono de arriba. */}
            <div className="flex gap-2">
              {(
                [
                  { valor: "claro", etiqueta: "Claro", swatch: "var(--color-neutro-bg)" },
                  { valor: "oscuro", etiqueta: "Oscuro", swatch: "var(--color-brand-navy)" },
                ] as const
              ).map((op) => {
                const activo = valores.fondoLogo === op.valor;
                return (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setValores((v) => ({ ...v, fondoLogo: op.valor }))}
                    className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors cursor-pointer ${
                      activo
                        ? "border-brand-line bg-brand-soft text-brand font-semibold"
                        : "border-line text-ink-dim hover:border-brand-line"
                    }`}
                  >
                    <span
                      className="size-4 shrink-0 rounded-full border border-line"
                      style={{ background: op.swatch }}
                    />
                    {op.etiqueta}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-line pt-4">
        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60 cursor-pointer"
        >
          {enviando && <Loader2 className="size-4 animate-spin" />}
          {enviando ? "Creando…" : "Crear proyecto"}
        </button>
      </div>
    </form>
  );
}
