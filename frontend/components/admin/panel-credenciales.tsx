"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  KeyRound,
  ListChecks,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import type { SesionAdmin } from "@/lib/usar-sesion-admin";
import { EncabezadoAdmin } from "@/components/admin/encabezado-admin";
import { Modal } from "@/components/admin/modal";
import { validarClaveMaestra } from "@/lib/validacion-clave";
import { apiFetch } from "@/lib/api-cliente";

const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94] as const;

type Item = { etiqueta: string; valor: string };

type Credencial = {
  id: number;
  titulo: string;
  creado_por_nombre: string | null;
  categoria: string | null;
  actualizado_en: string;
  cantidad_items: number;
  tiene_notas: boolean;
};

type Contenido = { notas: string | null; items: Item[] };

const VACIO = { titulo: "", clave: "", claveConfirmar: "", categoria: "", notas: "" };
const ITEM_VACIO: Item = { etiqueta: "", valor: "" };

function Campo({ children }: { children: React.ReactNode }) {
  return <span className="chip-mono mb-1.5 block text-ink-faint">{children}</span>;
}

export function PanelCredenciales({ sesion }: { sesion: SesionAdmin }) {
  const router = useRouter();
  const [credenciales, setCredenciales] = useState<Credencial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario de crear/editar contenedor (título, clave, categoría, notas, ítems)
  // — error propio, separado del banner de la página: un error de validación
  // acá no debe verse duplicado afuera del modal.
  const [modalAbierto, setModalAbierto] = useState<"nueva" | Credencial | null>(null);
  const [valores, setValores] = useState(VACIO);
  const [items, setItems] = useState<Item[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  const [aConfirmar, setAConfirmar] = useState<Credencial | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [claveUsuarioBorrar, setClaveUsuarioBorrar] = useState("");
  const [claveContenedorBorrar, setClaveContenedorBorrar] = useState("");
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);

  // Desbloqueo: pide DOS claves antes de mostrar u ofrecer editar el
  // contenido real — la maestra del contenedor y la contraseña propia de
  // quien está logueado (segundo factor, no alcanza con tener sesión
  // abierta). Ninguna se cachea entre tarjetas ni persiste tras cerrar.
  const [objetivo, setObjetivo] = useState<{ credencial: Credencial; proposito: "ver" | "editar" } | null>(null);
  const [claveUsuario, setClaveUsuario] = useState("");
  const [claveContenedor, setClaveContenedor] = useState("");
  const [desbloqueando, setDesbloqueando] = useState(false);
  const [errorDesbloqueo, setErrorDesbloqueo] = useState<string | null>(null);

  const [contenidoVisible, setContenidoVisible] = useState<{ credencial: Credencial; contenido: Contenido } | null>(
    null
  );
  const [copiado, setCopiado] = useState<number | null>(null);

  async function cargarTodo() {
    setError(null);
    const res = await apiFetch("/api/admin/credenciales");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const datos = await res.json();
    setCredenciales(datos.credenciales ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pedirDesbloqueo(c: Credencial, proposito: "ver" | "editar") {
    setError(null);
    setErrorDesbloqueo(null);
    setClaveUsuario("");
    setClaveContenedor("");
    setObjetivo({ credencial: c, proposito });
  }

  function abrirEdicionConContenido(c: Credencial, contenido: Contenido) {
    setValores({ titulo: c.titulo, clave: "", claveConfirmar: "", categoria: c.categoria ?? "", notas: contenido.notas ?? "" });
    setItems(contenido.items.length > 0 ? contenido.items.map((it) => ({ ...it })) : [{ ...ITEM_VACIO }]);
    setErrorFormulario(null);
    setModalAbierto(c);
  }

  function abrirNueva() {
    setValores(VACIO);
    setItems([{ ...ITEM_VACIO }]);
    setErrorFormulario(null);
    setModalAbierto("nueva");
  }

  async function confirmarDesbloqueo(e: React.FormEvent) {
    e.preventDefault();
    if (!objetivo) return;
    setDesbloqueando(true);
    setErrorDesbloqueo(null);
    const res = await apiFetch(`/api/admin/credenciales/${objetivo.credencial.id}/desbloquear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claveUsuario, claveContenedor }),
    });
    const datos = await res.json();
    setDesbloqueando(false);
    if (!res.ok) {
      setErrorDesbloqueo(datos.error ?? "No se pudo verificar la clave.");
      return;
    }
    const { credencial, proposito } = objetivo;
    setObjetivo(null);
    setClaveUsuario("");
    setClaveContenedor("");
    if (proposito === "editar") {
      abrirEdicionConContenido(credencial, datos);
    } else {
      setContenidoVisible({ credencial, contenido: datos });
    }
  }

  function actualizarItem(i: number, campo: keyof Item, valor: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)));
  }

  function quitarItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrorFormulario(null);
    const titulo = valores.titulo.trim();
    if (!titulo) {
      setErrorFormulario("El título es obligatorio.");
      return;
    }
    const esNueva = modalAbierto === "nueva";
    if (esNueva && !valores.clave) {
      setErrorFormulario("La clave es obligatoria.");
      return;
    }
    // Al crear siempre se pide clave, al editar solo si se está cambiando —
    // pero en ambos casos, si hay clave, debe cumplir la regla y coincidir
    // con su confirmación (capa extra contra errores de tipeo).
    if (valores.clave) {
      const errorRegla = validarClaveMaestra(valores.clave);
      if (errorRegla) {
        setErrorFormulario(errorRegla);
        return;
      }
      if (valores.clave !== valores.claveConfirmar) {
        setErrorFormulario("La clave y su confirmación no coinciden.");
        return;
      }
    }

    setEnviando(true);
    const cuerpo = {
      titulo,
      clave: valores.clave,
      categoria: valores.categoria.trim(),
      notas: valores.notas.trim(),
      items: items.filter((it) => it.etiqueta.trim() && it.valor.trim()),
    };
    const res = esNueva
      ? await apiFetch("/api/admin/credenciales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuerpo),
        })
      : await apiFetch(`/api/admin/credenciales/${(modalAbierto as Credencial).id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuerpo),
        });
    const datos = await res.json();
    setEnviando(false);
    if (!res.ok) {
      setErrorFormulario(datos.error ?? "No se pudo guardar la credencial.");
      return;
    }
    setModalAbierto(null);
    await cargarTodo();
  }

  function pedirBorrado(c: Credencial) {
    setErrorBorrar(null);
    setClaveUsuarioBorrar("");
    setClaveContenedorBorrar("");
    setAConfirmar(c);
  }

  async function confirmarBorrar(e: React.FormEvent) {
    e.preventDefault();
    if (!aConfirmar) return;
    setBorrando(true);
    setErrorBorrar(null);
    const res = await apiFetch(`/api/admin/credenciales/${aConfirmar.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claveUsuario: claveUsuarioBorrar, claveContenedor: claveContenedorBorrar }),
    });
    const datos = await res.json();
    setBorrando(false);
    if (!res.ok) {
      setErrorBorrar(datos.error ?? "No se pudo borrar la credencial.");
      return;
    }
    setAConfirmar(null);
    await cargarTodo();
  }

  async function copiarValor(valor: string, indice: number) {
    await navigator.clipboard.writeText(valor);
    setCopiado(indice);
    setTimeout(() => setCopiado((actual) => (actual === indice ? null : actual)), 1500);
  }

  return (
    <div className="fondo-panel-admin min-h-screen">
      <EncabezadoAdmin sesion={sesion} titulo="Información sensible" subtitulo="Acceso restringido" />

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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-ink">Contenedores ({credenciales.length})</h2>
                <p className="chip-mono text-ink-faint">Accesos, cuentas y contraseñas del equipo</p>
              </div>
              <button
                onClick={abrirNueva}
                className="flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover cursor-pointer"
              >
                <Plus className="size-3.5" />
                Agregar contenedor
              </button>
            </div>

            {credenciales.length === 0 ? (
              <div className="tarjeta relative flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="icono-sistema relative flex size-14 shrink-0 items-center justify-center rounded-xl">
                  <KeyRound className="size-6" />
                </span>
                <div className="relative">
                  <p className="text-sm font-bold text-ink">Todavía no hay contenedores</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Guarda el primer acceso sensible para tenerlo a mano de forma segura.
                  </p>
                </div>
                <button
                  onClick={abrirNueva}
                  className="relative mt-1 flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Agregar el primero
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {credenciales.map((c, i) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, ease: EASE_OUT_QUAD, delay: i * 0.04 }}
                    className="tarjeta flex flex-col gap-3 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="icono-sistema flex size-10 shrink-0 items-center justify-center rounded-lg">
                        <KeyRound className="size-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-bold text-ink">{c.titulo}</h3>
                          <button
                            onClick={() => pedirBorrado(c)}
                            aria-label={`Borrar ${c.titulo}`}
                            className="shrink-0 text-ink-faint transition-colors hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        {c.creado_por_nombre && (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
                            <UserCircle2 className="size-3" />
                            Guardado por {c.creado_por_nombre}
                          </p>
                        )}
                        {c.categoria && (
                          <span className="chip mt-1.5 inline-flex bg-neutro-bg text-neutro-texto">{c.categoria}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1">
                        <ListChecks className="size-3" />
                        {c.cantidad_items} dato{c.cantidad_items === 1 ? "" : "s"} protegido
                        {c.cantidad_items === 1 ? "" : "s"}
                      </span>
                      {c.tiene_notas && (
                        <span className="flex items-center gap-1">
                          <FileText className="size-3" />
                          Con notas
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => pedirDesbloqueo(c, "ver")}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-semibold text-ink-dim transition-colors hover:border-brand-line hover:text-brand cursor-pointer"
                      >
                        <Lock className="size-3.5" />
                        Desbloquear
                      </button>
                      <button
                        onClick={() => pedirDesbloqueo(c, "editar")}
                        aria-label={`Editar ${c.titulo}`}
                        title="Editar"
                        className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line text-ink-faint transition-colors hover:border-brand-line hover:text-brand cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Verificación de clave maestra — paso obligatorio antes de ver o editar
          el contenido real de un contenedor. La clave nunca se guarda ni se
          muestra: solo se manda a /desbloquear para que el servidor la
          compare contra su hash. */}
      <Modal
        abierto={objetivo !== null}
        titulo={objetivo ? `Verificar clave — ${objetivo.credencial.titulo}` : ""}
        onCerrar={() => setObjetivo(null)}
      >
        {errorDesbloqueo && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{errorDesbloqueo}</p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Por seguridad se piden dos claves: tu propia contraseña (confirma que sos vos) y la clave maestra
          de este contenedor en particular.
        </p>
        <form onSubmit={confirmarDesbloqueo} className="mt-4 space-y-4">
          <div>
            <Campo>Tu contraseña</Campo>
            <input
              autoFocus
              type="password"
              value={claveUsuario}
              onChange={(e) => setClaveUsuario(e.target.value)}
              className="input-portal w-full px-3 py-2 font-mono text-sm text-ink"
            />
          </div>
          <div>
            <Campo>Clave maestra del contenedor</Campo>
            <input
              type="password"
              value={claveContenedor}
              onChange={(e) => setClaveContenedor(e.target.value)}
              className="input-portal w-full px-3 py-2 font-mono text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={desbloqueando || !claveUsuario || !claveContenedor}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60 cursor-pointer"
          >
            {desbloqueando && <Loader2 className="size-4 animate-spin" />}
            {desbloqueando ? "Verificando…" : "Desbloquear"}
          </button>
        </form>
      </Modal>

      {/* Contenido ya desbloqueado — vive solo en memoria mientras este modal
          está abierto, se descarta al cerrarlo. */}
      <Modal
        abierto={contenidoVisible !== null}
        titulo={contenidoVisible ? contenidoVisible.credencial.titulo : ""}
        onCerrar={() => setContenidoVisible(null)}
      >
        {contenidoVisible && (
          <div className="mt-4 space-y-4">
            {contenidoVisible.contenido.items.length === 0 && !contenidoVisible.contenido.notas ? (
              <p className="text-sm text-ink-faint">Este contenedor no tiene datos adicionales guardados.</p>
            ) : (
              <>
                {contenidoVisible.contenido.items.length > 0 && (
                  <ul className="space-y-2">
                    {contenidoVisible.contenido.items.map((it, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 rounded-md border border-line bg-neutro-bg/40 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="chip-mono text-ink-faint">{it.etiqueta}</p>
                          <p className="truncate font-mono text-sm text-ink">{it.valor}</p>
                        </div>
                        <button
                          onClick={() => copiarValor(it.valor, idx)}
                          aria-label={`Copiar ${it.etiqueta}`}
                          className="shrink-0 text-ink-faint transition-colors hover:text-brand cursor-pointer"
                        >
                          {copiado === idx ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {contenidoVisible.contenido.notas && (
                  <div>
                    <Campo>Notas</Campo>
                    <p className="whitespace-pre-wrap text-sm text-ink-dim">{contenidoVisible.contenido.notas}</p>
                  </div>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => {
                const { credencial, contenido } = contenidoVisible;
                setContenidoVisible(null);
                abrirEdicionConContenido(credencial, contenido);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-line py-2.5 text-sm font-semibold text-ink-dim transition-colors hover:border-brand-line hover:text-brand cursor-pointer"
            >
              <Pencil className="size-3.5" />
              Editar
            </button>
          </div>
        )}
      </Modal>

      <Modal
        abierto={modalAbierto !== null}
        titulo={modalAbierto === "nueva" ? "Agregar contenedor" : `Editar — ${(modalAbierto as Credencial)?.titulo ?? ""}`}
        onCerrar={() => setModalAbierto(null)}
      >
        {errorFormulario && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{errorFormulario}</p>
        )}
        <form onSubmit={guardar} className="mt-4 space-y-4">
          <div>
            <Campo>Título</Campo>
            <input
              autoFocus
              placeholder="Ej: Router principal, Cuenta AWS…"
              value={valores.titulo}
              onChange={(e) => setValores((v) => ({ ...v, titulo: e.target.value }))}
              className="input-portal w-full px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <Campo>{modalAbierto === "nueva" ? "Clave maestra" : "Nueva clave (dejar vacío para no cambiarla)"}</Campo>
            <input
              type="text"
              value={valores.clave}
              onChange={(e) => setValores((v) => ({ ...v, clave: e.target.value }))}
              className="input-portal w-full px-3 py-2 font-mono text-sm text-ink"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
              Mínimo 10 caracteres, con al menos una mayúscula y un símbolo especial. Una vez guardada, nadie
              podrá volver a verla — solo se puede verificar.
            </p>
          </div>
          {valores.clave && (
            <div>
              <Campo>Confirmar clave</Campo>
              <input
                type="text"
                value={valores.claveConfirmar}
                onChange={(e) => setValores((v) => ({ ...v, claveConfirmar: e.target.value }))}
                className="input-portal w-full px-3 py-2 font-mono text-sm text-ink"
              />
            </div>
          )}

          <div>
            <Campo>Datos adicionales (usuario, IP, PIN…)</Campo>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Etiqueta (ej: Usuario)"
                    value={it.etiqueta}
                    onChange={(e) => actualizarItem(i, "etiqueta", e.target.value)}
                    className="input-portal w-2/5 px-3 py-2 text-sm text-ink"
                  />
                  <input
                    placeholder="Valor"
                    value={it.valor}
                    onChange={(e) => actualizarItem(i, "valor", e.target.value)}
                    className="input-portal flex-1 px-3 py-2 text-sm text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => quitarItem(i)}
                    aria-label="Quitar dato"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-neutro-bg hover:text-red-500 cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { ...ITEM_VACIO }])}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover cursor-pointer"
            >
              <Plus className="size-3.5" />
              Agregar dato
            </button>
          </div>

          <div>
            <Campo>Categoría</Campo>
            <input
              placeholder="Ej: Infraestructura, Servicios externos…"
              value={valores.categoria}
              onChange={(e) => setValores((v) => ({ ...v, categoria: e.target.value }))}
              className="input-portal w-full px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <Campo>Notas</Campo>
            <textarea
              rows={2}
              value={valores.notas}
              onChange={(e) => setValores((v) => ({ ...v, notas: e.target.value }))}
              className="input-portal w-full px-3 py-2 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60 cursor-pointer"
          >
            {enviando && <Loader2 className="size-4 animate-spin" />}
            {enviando ? "Guardando…" : "Guardar"}
          </button>
        </form>
      </Modal>

      <Modal abierto={aConfirmar !== null} titulo="Borrar contenedor" onCerrar={() => setAConfirmar(null)}>
        {aConfirmar && (
          <form onSubmit={confirmarBorrar} className="mt-4 space-y-4">
            <div className="flex items-start gap-3 rounded-md bg-red-50 px-3 py-3">
              <AlertTriangle className="size-4.5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">
                ¿Borrar <strong>{aConfirmar.titulo}</strong> y todos sus datos? Esta acción no se puede deshacer.
                Por seguridad, escribe tu contraseña y la clave maestra del contenedor para confirmar.
              </p>
            </div>
            {errorBorrar && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{errorBorrar}</p>
            )}
            <div>
              <Campo>Tu contraseña</Campo>
              <input
                autoFocus
                type="password"
                value={claveUsuarioBorrar}
                onChange={(e) => setClaveUsuarioBorrar(e.target.value)}
                className="input-portal w-full px-3 py-2 font-mono text-sm text-ink"
              />
            </div>
            <div>
              <Campo>Clave maestra del contenedor</Campo>
              <input
                type="password"
                value={claveContenedorBorrar}
                onChange={(e) => setClaveContenedorBorrar(e.target.value)}
                className="input-portal w-full px-3 py-2 font-mono text-sm text-ink"
              />
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
                type="submit"
                disabled={borrando || !claveUsuarioBorrar || !claveContenedorBorrar}
                className="rounded-md bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {borrando ? "Borrando…" : "Sí, borrar"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
