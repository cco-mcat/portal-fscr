"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fondo de video a pantalla completa — mismo patrón del portal original
 * (app.fscr.com.co) pero corregido: respeta prefers-reduced-motion (se
 * pausa y no hace autoplay para quien lo pidió) y lleva un overlay de
 * degradado para que el texto/tarjetas sigan siendo legibles encima.
 */
export function FondoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducirMovimiento, setReducirMovimiento] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducirMovimiento(mq.matches);
    const onChange = () => setReducirMovimiento(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // React a veces no aplica a tiempo la propiedad IDL `muted` (solo el
    // atributo) y los navegadores exigen la propiedad real en true para
    // permitir autoplay — se fuerza aquí antes de pedir play().
    video.muted = true;
    if (reducirMovimiento) {
      video.pause();
    } else {
      video.play().catch(() => {
        // Autoplay bloqueado por el navegador — no es crítico, el overlay
        // y el fondo de color de globals.css ya sostienen el diseño.
      });
    }
  }, [reducirMovimiento]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <video
        ref={videoRef}
        className="size-full object-cover opacity-90"
        src="/video/intro.mp4"
        autoPlay={!reducirMovimiento}
        loop
        muted
        playsInline
        preload="auto"
      />
      {/* Wash claro con la paleta de PIGO/NC — translúcido de verdad (color-mix
          contra "transparent"), bien bajo, solo para sostener el contraste
          del texto sin lavar el video (antes quedaba pálido). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--color-brand-navy) 10%, transparent) 0%, color-mix(in srgb, var(--color-bg) 14%, transparent) 45%, color-mix(in srgb, var(--color-bg) 22%, transparent) 100%)",
        }}
      />
    </div>
  );
}
