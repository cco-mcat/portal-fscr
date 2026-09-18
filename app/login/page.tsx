"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { ParticulasLogin } from "@/components/particulas-login";

// Video acotado solo al panel derecho de este login (a diferencia de
// FondoVideo, que es `fixed inset-0` a propósito para el resto del portal).
// Mismo arreglo de autoplay que FondoVideo: forzar `video.muted` como
// propiedad IDL antes de pedir play(), y respetar prefers-reduced-motion.
function VideoPanelLogin() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducirMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    video.muted = true;
    if (reducirMovimiento) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        // Mismo duotono navy que la foto del panel izquierdo (saturate/
        // brightness/hue-rotate) — el video trae sus propios colores
        // crudos (tonos cálidos de la torre), sin esto el ojo lee "dos
        // fotografías distintas" en vez de una sola atmósfera de marca.
        className="size-full object-cover opacity-90"
        style={{ filter: "saturate(0.75) brightness(0.8) hue-rotate(-6deg)" }}
        src="/video/intro.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      {/* Misma receta de wash que el panel de la foto (navy 55→88%), un
          poco más suave para dejar respirar el movimiento del video, más
          un halo horizontal hacia el borde izquierdo (la costura con el
          panel de la foto) para que ambos lados se fundan en vez de
          cortar en seco. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--color-brand-navy) 42%, transparent) 0%, color-mix(in srgb, var(--color-brand-navy) 64%, transparent) 55%, color-mix(in srgb, var(--color-brand-navy) 78%, transparent) 100%), radial-gradient(ellipse 55% 90% at 0% 50%, color-mix(in srgb, var(--color-brand-navy) 55%, transparent), transparent 65%)",
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const datos = await res.json();
      if (!res.ok) {
        setError(datos.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <div className="relative flex min-h-screen overflow-hidden bg-[var(--color-brand-navy)]">
        {/* Panel izquierdo — narrativa de marca, foto de fondo + partículas, solo en desktop */}
        <div className="relative hidden flex-1 flex-col overflow-hidden p-12 lg:flex">
          <Image
            src="/fondologin.png"
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover"
            style={{ filter: "saturate(0.85) brightness(0.75)" }}
          />
          {/* Mismo wash navy que el video del panel derecho, con un halo
              hacia el borde derecho (la costura) para que ambos fondos se
              fundan en un solo degradado en vez de partirse en dos fotos
              inconexas. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--color-brand-navy) 50%, transparent) 0%, color-mix(in srgb, var(--color-brand-navy) 72%, transparent) 60%, color-mix(in srgb, var(--color-brand-navy) 84%, transparent) 100%), radial-gradient(ellipse 55% 90% at 100% 50%, color-mix(in srgb, var(--color-brand-navy) 55%, transparent), transparent 65%)",
            }}
          />
          <ParticulasLogin />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center gap-3"
          >
            <Image
              src="/logo-cco.png"
              alt="FSCR Ingeniería S.A.S."
              width={303}
              height={116}
              priority
              className="h-11 w-auto"
            />
          </motion.div>

          <div className="relative mt-16">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-lg text-4xl font-semibold leading-[1.15] tracking-normal text-white"
            >
              Un solo lugar para
              <br />
              todos los <span className="text-brand-blue-claro">sistemas</span> de la
              organización.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-5 max-w-md leading-relaxed text-white/70"
            >
              Panel de administración del portal: gestiona los proyectos y
              categorías visibles para toda la compañía, con acceso
              restringido al equipo autorizado.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="relative chip-mono !text-sm mt-auto mb-10 flex items-center gap-2 text-white/60"
          >
            <Building2 className="size-4" />
            <span className="font-bold text-brand-blue-claro">FSCR</span> · CCO —{" "}
            <span className="texto-recorrido font-bold">
              Área de Innovación Tecnológica
            </span>
          </motion.div>
        </div>

        {/* Panel derecho — formulario, con el video solo en este lado */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6 lg:pl-16">
          <VideoPanelLogin />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Halo ambiental detrás de la tarjeta — la ata a la atmósfera
                azul de fondo en vez de flotar como un rectángulo gris plano
                encima del video. */}
            <div
              className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-70 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--color-brand-blue) 30%, transparent), transparent 70%)",
              }}
            />
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <Image
                src="/logo-cco.png"
                alt="FSCR Ingeniería S.A.S."
                width={303}
                height={116}
                priority
                className="h-10 w-auto"
              />
            </div>

            <div className="tarjeta-proyecto !bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] p-8">
              <h2 className="text-2xl font-bold tracking-tight text-ink">
                Iniciar sesión
              </h2>
              <p className="mt-1 text-sm text-ink-dim">
                Acceso restringido — Panel de administración del Portal FSCR.
              </p>

              <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="input-portal w-full py-2.5 pl-10 pr-4 text-sm text-ink"
                  />
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type={verClave ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Contraseña"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    className="input-portal w-full py-2.5 pl-10 pr-10 text-sm text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink cursor-pointer"
                    aria-label={verClave ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {verClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="gradiente-pigo flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verificando…
                    </>
                  ) : (
                    <>
                      Entrar <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
