// Slugs de íconos de lucide-react — el mapeo a componente real vive en
// components/tarjeta-sistema.tsx (así lib/sistemas.ts se queda como datos
// puros, sin importar React/JSX). El array es la única fuente de verdad —
// el type se deriva de él, así el selector de íconos del admin nunca
// puede desincronizarse del type en tiempo de compilación.
export const ICONOS_DISPONIBLES = [
  "shield-alert",
  "hammer",
  "line-chart",
  "gavel",
  "life-buoy",
  "target",
  "hard-hat",
  "clipboard-check",
  "eye",
  "ticket",
  "bot",
  "plug",
] as const;

export type IconoSistema = (typeof ICONOS_DISPONIBLES)[number];

export type Sistema = {
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  href: string;
  icono: IconoSistema;
  logoUrl: string | null;
  fondoLogo: "claro" | "oscuro";
};

// Categoría especial que representa "sin filtro" — las categorías reales
// vienen de bd_gestorp (portal_categorias) vía /api/proyectos, creadas y
// administradas desde el panel de admin. Los proyectos de ejemplo que
// vivían acá como array estático ya se dieron de baja: la grilla pública
// ahora consume el backend real (ver app/page.tsx).
export const CATEGORIA_TODOS = "Todos";
