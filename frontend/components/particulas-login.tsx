"use client";

import { useEffect, useRef } from "react";

// Fondo de partículas del login — red de nodos conectados como circuito +
// descargas tipo rayo, mismo mecanismo exacto del proyecto DevForge
// (C:\dev\solicitudes-de-desarrollo\components\particulas-login.tsx), acá
// con el azul eléctrico real de PIGO en vez del indigo de DevForge. Canvas
// puro con rAF, respeta prefers-reduced-motion y se limpia al desmontar.

const GLIFOS = ["</>"];

interface Nodo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface Glifo {
  x: number;
  y: number;
  vy: number;
  vx: number;
  texto: string;
  tam: number;
  alfa: number;
  fase: number;
}

interface Rayo {
  puntos: { x: number; y: number }[];
  vida: number;
  vidaMax: number;
}

export function ParticulasLogin() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducirMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let ancho = 0;
    let alto = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId = 0;

    const mouse = { x: -9999, y: -9999 };

    let nodos: Nodo[] = [];
    let glifos: Glifo[] = [];
    let rayos: Rayo[] = [];
    let frame = 0;

    // Azul eléctrico de PIGO (#0010f1) y su variante clara (--color-brand-blue-claro)
    const AZUL = "0, 16, 241";
    const AZUL_CLARO = "97, 107, 246";

    function redimensionar() {
      if (!canvas || !ctx) return;
      ancho = canvas.offsetWidth;
      alto = canvas.offsetHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sembrar();
    }

    function sembrar() {
      const area = ancho * alto;
      const nNodos = Math.min(55, Math.max(20, Math.round(area / 32000)));
      const nGlifos = Math.min(5, Math.max(2, Math.round(area / 260000)));

      nodos = Array.from({ length: nNodos }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.7,
      }));

      glifos = Array.from({ length: nGlifos }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.25 + 0.08),
        texto: GLIFOS[0],
        tam: Math.random() * 6 + 10,
        alfa: Math.random() * 0.08 + 0.05,
        fase: Math.random() * Math.PI * 2,
      }));

      rayos = [];
    }

    function crearRayo() {
      if (nodos.length < 2) return;
      const a = nodos[Math.floor(Math.random() * nodos.length)];
      const candidatos = nodos.filter((n) => {
        const d = Math.hypot(n.x - a.x, n.y - a.y);
        return d > 60 && d < 260 && n !== a;
      });
      if (candidatos.length === 0) return;
      const b = candidatos[Math.floor(Math.random() * candidatos.length)];

      const segmentos = 7;
      const puntos = [];
      for (let i = 0; i <= segmentos; i++) {
        const t = i / segmentos;
        const jitter = i === 0 || i === segmentos ? 0 : (Math.random() - 0.5) * 26;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        puntos.push({
          x: a.x + dx * t + (-dy / len) * jitter,
          y: a.y + dy * t + (dx / len) * jitter,
        });
      }
      rayos.push({ puntos, vida: 14, vidaMax: 14 });
    }

    function dibujar() {
      if (!ctx) return;
      ctx.clearRect(0, 0, ancho, alto);
      frame++;

      const DIST_CONEXION = 130;
      for (let i = 0; i < nodos.length; i++) {
        const n = nodos[i];

        if (!reducirMotion) {
          n.x += n.vx;
          n.y += n.vy;

          const dm = Math.hypot(mouse.x - n.x, mouse.y - n.y);
          if (dm < 110) {
            const f = ((110 - dm) / 110) * 0.6;
            n.x -= ((mouse.x - n.x) / (dm || 1)) * f;
            n.y -= ((mouse.y - n.y) / (dm || 1)) * f;
          }

          if (n.x < -20) n.x = ancho + 20;
          if (n.x > ancho + 20) n.x = -20;
          if (n.y < -20) n.y = alto + 20;
          if (n.y > alto + 20) n.y = -20;
        }

        for (let j = i + 1; j < nodos.length; j++) {
          const m = nodos[j];
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < DIST_CONEXION) {
            const alfa = (1 - d / DIST_CONEXION) * 0.28;
            ctx.strokeStyle = `rgba(${AZUL}, ${alfa})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodos) {
        const pulso = 0.55 + 0.45 * Math.sin(frame * 0.03 + n.x * 0.01);
        ctx.fillStyle = `rgba(${AZUL_CLARO}, ${0.35 + 0.4 * pulso})`;
        ctx.shadowColor = `rgba(${AZUL}, 0.9)`;
        ctx.shadowBlur = 6 * pulso;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (!reducirMotion && Math.random() < 0.012 && rayos.length < 3) {
        crearRayo();
      }
      for (let i = rayos.length - 1; i >= 0; i--) {
        const r = rayos[i];
        const t = r.vida / r.vidaMax;
        const alfa = t * 0.75;

        ctx.strokeStyle = `rgba(${AZUL_CLARO}, ${alfa})`;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = `rgba(${AZUL}, ${alfa})`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(r.puntos[0].x, r.puntos[0].y);
        for (const p of r.puntos.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        r.vida--;
        if (r.vida <= 0) rayos.splice(i, 1);
      }

      for (const g of glifos) {
        if (!reducirMotion) {
          g.x += g.vx;
          g.y += g.vy;
          g.fase += 0.015;
          if (g.y < -30) {
            g.y = alto + 30;
            g.x = Math.random() * ancho;
          }
          if (g.x < -40) g.x = ancho + 40;
          if (g.x > ancho + 40) g.x = -40;
        }
        const parpadeo = 0.8 + 0.2 * Math.sin(g.fase);
        ctx.font = `${g.tam}px ui-monospace, "Cascadia Code", monospace`;
        ctx.fillStyle = `rgba(${AZUL_CLARO}, ${g.alfa * parpadeo})`;
        ctx.fillText(g.texto, g.x, g.y);
      }

      if (!reducirMotion) {
        rafId = requestAnimationFrame(dibujar);
      }
    }

    function onMouse(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    redimensionar();
    dibujar();

    window.addEventListener("resize", redimensionar);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mouseout", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", redimensionar);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseout", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
