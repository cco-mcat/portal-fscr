"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, FolderKanban, FolderPlus, LayoutGrid, Tags, Trash2 } from "lucide-react";
import type { SesionAdmin } from "@/lib/auth";
import { EncabezadoAdmin } from "@/components/admin/encabezado-admin";
import { FormularioProyecto } from "@/components/admin/formulario-proyecto";
import { ListaProyectos, type Proyecto } from "@/components/admin/lista-proyectos";
import { Modal } from "@/components/admin/modal";
import { TarjetaAccion } from "@/components/admin/tarjeta-accion";

const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94] as const;

export type Categoria = { id: number; nombre: string; slug: string; orden: number };

export function PanelAdmin({ sesion }: { sesion: SesionAdmin }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState<"categoria" | "proyecto" | null>(null);
  const [categoriaAConfirmar, setCategoriaAConfirmar] = useState<Categoria | null>(null);
  const [borrandoCategoria, setBorrandoCategoria] = useState(false);

  async function cargarTodo() {
    setError(null);
    const [resCategorias, resProyectos] = await Promise.all([
      fetch("/api/admin/categorias"),
      fetch("/api/admin/proyectos"),
    ]);
    if (resCategorias.status === 401 || resProyectos.status === 401) {
      router.push("/login");
      return;
    }
    const datosCategorias = await resCategorias.json();
    const datosProyectos = await resProyectos.json();
    setCategorias(datosCategorias.categorias ?? []);
    setProyectos(datosProyectos.proyectos ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function crearCategoria(e: React.FormEvent) {
    e.preventDefault();
    const nombre = nombreCategoria.trim();
    if (!nombre) return;
    const res = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    const datos = await res.json();
    if (!res.ok) {
      setError(datos.error ?? "No se pudo crear la categoría.");
      return;
    }
    setNombreCategoria("");
    setModalAbierto(null);
    await cargarTodo();
  }

  async function confirmarBorrarCategoria() {
    if (!categoriaAConfirmar) return;
    setBorrandoCategoria(true);
    const res = await fetch(`/api/admin/categorias/${categoriaAConfirmar.id}`, { method: "DELETE" });
    const datos = await res.json();
    setBorrandoCategoria(false);
    if (!res.ok) {
      setError(datos.error ?? "No se pudo borrar la categoría.");
      setCategoriaAConfirmar(null);
      return;
    }
    setCategoriaAConfirmar(null);
    await cargarTodo();
  }

  const visibles = useMemo(() => proyectos.filter((p) => p.activo === 1).length, [proyectos]);
  // Cuántos proyectos usan la categoría que se está por borrar — ya lo
  // sabemos en el cliente (proyectos ya está cargado), así que el modal
  // puede bloquear el borrado de una vez en vez de mandar el DELETE y
  // recién enterarse por la respuesta del servidor de que no se podía.
  const proyectosDeCategoriaAConfirmar = useMemo(
    () =>
      categoriaAConfirmar
        ? proyectos.filter((p) => p.categoria_id === categoriaAConfirmar.id).length
        : 0,
    [categoriaAConfirmar, proyectos]
  );
  return (
    <div className="fondo-panel-admin min-h-screen">
      <EncabezadoAdmin sesion={sesion} titulo="Panel de administración" subtitulo="Acceso restringido" />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
          >
            {error}
          </motion.p>
        )}

        {cargando ? (
          <p className="text-sm text-ink-dim">Cargando…</p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Resumen — lectura rápida del estado del portal antes de entrar al detalle */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icono: Tags,
                  etiqueta: "Categorías",
                  valor: categorias.length,
                  acento: "linear-gradient(135deg, #fbbf24, #d97706)",
                },
                {
                  icono: FolderKanban,
                  etiqueta: "Proyectos",
                  valor: proyectos.length,
                  acento: "linear-gradient(135deg, #60a5fa, #2563eb)",
                },
                {
                  icono: LayoutGrid,
                  etiqueta: "Visibles en el portal",
                  valor: visibles,
                  acento: "linear-gradient(135deg, #34d399, #059669)",
                },
              ].map(({ icono: Icono, etiqueta, valor, acento }, i) => (
                <motion.div
                  key={etiqueta}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: EASE_OUT_QUAD, delay: i * 0.04 }}
                  className="tarjeta relative flex items-center gap-3 overflow-hidden px-4 py-3.5"
                >
                  {/* Acento en la esquina — cuadrado pegado a las esquinas
                      reales de la tarjeta con la esquina opuesta redondeada
                      al máximo (evita el recorte raro de un círculo flotante
                      contra el overflow-hidden). Un color distinto por
                      tarjeta para diferenciarlas, pero suave (opacidad baja)
                      para que acompañe sin gritar. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-0 size-14 rounded-bl-[56px] opacity-30"
                    style={{ background: acento }}
                  />
                  <span className="icono-sistema relative flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icono className="size-5" />
                  </span>
                  <div className="relative">
                    <p className="text-xl font-bold leading-none text-ink">{valor}</p>
                    <p className="mt-1 text-xs text-ink-faint">{etiqueta}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Gestión — categorías y alta de proyecto en una columna angosta,
                el listado (lo que más espacio necesita para leerse bien) a la
                derecha, ya no todo apilado en una sola columna angosta. */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
              <div className="flex flex-col gap-4">
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, ease: EASE_OUT_QUAD, delay: 0.06 }}
                  className="tarjeta p-5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="icono-sistema flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Tags className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-ink">Categorías</h2>
                      <p className="chip-mono text-ink-faint">Clasificación de proyectos</p>
                    </div>
                  </div>

                  <ul className="mt-4 flex flex-wrap gap-2">
                    {categorias.map((c) => (
                      <li
                        key={c.id}
                        className="chip flex items-center gap-2 bg-neutro-bg text-neutro-texto"
                      >
                        {c.nombre}
                        <button
                          onClick={() => setCategoriaAConfirmar(c)}
                          aria-label={`Borrar categoría ${c.nombre}`}
                          className="text-ink-faint transition-colors hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    ))}
                    {categorias.length === 0 && (
                      <p className="text-xs text-ink-faint">Todavía no hay categorías.</p>
                    )}
                  </ul>
                </motion.section>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, ease: EASE_OUT_QUAD, delay: 0.1 }}
                >
                  <TarjetaAccion
                    icono={Tags}
                    titulo="Agregar categoría"
                    descripcion="Crea una nueva clasificación para ordenar los proyectos del portal."
                    etiquetaAccion="Agregar categoría"
                    onClick={() => {
                      setError(null);
                      setModalAbierto("categoria");
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, ease: EASE_OUT_QUAD, delay: 0.14 }}
                >
                  <TarjetaAccion
                    icono={FolderPlus}
                    titulo="Agregar proyecto"
                    descripcion="Publica un nuevo sistema en el portal con su logo, categoría e ícono."
                    etiquetaAccion="Nuevo proyecto"
                    onClick={() => {
                      setError(null);
                      setModalAbierto("proyecto");
                    }}
                  />
                </motion.div>
              </div>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, ease: EASE_OUT_QUAD, delay: 0.14 }}
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="icono-sistema flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <FolderKanban className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-ink">Proyectos ({proyectos.length})</h2>
                    <p className="chip-mono text-ink-faint">Visibles en el portal público</p>
                  </div>
                </div>
                <ListaProyectos
                  proyectos={proyectos}
                  onCambio={cargarTodo}
                  onError={setError}
                  onAgregar={() => {
                    setError(null);
                    setModalAbierto("proyecto");
                  }}
                />
              </motion.section>
            </div>
          </div>
        )}
      </main>

      <Modal
        abierto={modalAbierto === "categoria"}
        titulo="Agregar categoría"
        onCerrar={() => setModalAbierto(null)}
      >
        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
        )}
        <form onSubmit={crearCategoria} className="mt-4 flex gap-2">
          <input
            autoFocus
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
            placeholder="Nombre de la categoría"
            className="input-portal flex-1 px-3 py-2 text-sm text-ink"
          />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover cursor-pointer"
          >
            Agregar
          </button>
        </form>
      </Modal>

      <Modal
        abierto={modalAbierto === "proyecto"}
        titulo="Nuevo proyecto"
        onCerrar={() => setModalAbierto(null)}
      >
        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
        )}
        <FormularioProyecto
          categorias={categorias}
          onCreado={async () => {
            await cargarTodo();
            setModalAbierto(null);
          }}
          onError={setError}
        />
      </Modal>

      <Modal
        abierto={categoriaAConfirmar !== null}
        titulo={proyectosDeCategoriaAConfirmar > 0 ? "No se puede borrar" : "Borrar categoría"}
        onCerrar={() => setCategoriaAConfirmar(null)}
      >
        {categoriaAConfirmar &&
          (proyectosDeCategoriaAConfirmar > 0 ? (
            // Bloqueo directo, sin mandar la solicitud: ya sabemos en el
            // cliente que tiene proyectos, así que ni siquiera se ofrece
            // el botón de borrar — antes esto se descubría recién después
            // de confirmar y pegarle al backend.
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3 rounded-md bg-red-50 px-3 py-3">
                <AlertTriangle className="size-4.5 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">
                  <strong>{categoriaAConfirmar.nombre}</strong> tiene {proyectosDeCategoriaAConfirmar}{" "}
                  proyecto{proyectosDeCategoriaAConfirmar === 1 ? "" : "s"} asociado
                  {proyectosDeCategoriaAConfirmar === 1 ? "" : "s"} — muévelos a otra categoría o
                  bórralos primero para poder eliminarla.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCategoriaAConfirmar(null)}
                  className="rounded-md bg-neutro-bg px-3.5 py-2 text-sm font-semibold text-ink-dim transition-colors hover:bg-line-soft cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3 rounded-md bg-red-50 px-3 py-3">
                <AlertTriangle className="size-4.5 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">
                  ¿Borrar la categoría <strong>{categoriaAConfirmar.nombre}</strong>? Esta acción no
                  se puede deshacer.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoriaAConfirmar(null)}
                  className="rounded-md px-3.5 py-2 text-sm font-semibold text-ink-dim transition-colors hover:bg-neutro-bg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={borrandoCategoria}
                  onClick={confirmarBorrarCategoria}
                  className="rounded-md bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 cursor-pointer"
                >
                  {borrandoCategoria ? "Borrando…" : "Sí, borrar"}
                </button>
              </div>
            </div>
          ))}
      </Modal>
    </div>
  );
}
