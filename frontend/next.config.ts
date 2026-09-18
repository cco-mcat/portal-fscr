import type { NextConfig } from "next";

// Export estático: cPanel solo sirve archivos, no puede correr un server
// Next.js (sin "Setup Node.js App" disponible). output/cookies/redirects()
// de servidor y next.config `headers()` no están soportados en este modo —
// el guard de /admin y los headers de seguridad HTTP los aplica el backend
// (VPS, ver backend/next.config.ts y backend/proxy.ts), no esta app.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    // Sin servidor Next detrás no hay optimización on-demand posible; las
    // imágenes (logos subidos vía Dropbox) ya vienen del origen tal cual.
    unoptimized: true,
  },
};

export default nextConfig;
