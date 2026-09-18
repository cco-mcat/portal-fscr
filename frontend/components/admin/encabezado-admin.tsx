"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import type { SesionAdmin } from "@/lib/usar-sesion-admin";
import { apiFetch } from "@/lib/api-cliente";

const VISTAS = [
  { href: "/admin", etiqueta: "Panel admin", icono: LayoutDashboard },
  { href: "/admin/credenciales", etiqueta: "Información sensible", icono: KeyRound },
];

type Props = {
  sesion: SesionAdmin;
  titulo: string;
  subtitulo: string;
};

export function EncabezadoAdmin({ sesion, titulo, subtitulo }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const iniciales = useMemo(
    () =>
      sesion.nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase(),
    [sesion.nombre]
  );

  async function cerrarSesion() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="gradiente-pigo sticky top-0 z-20 border-b border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3.5">
          <Image
            src="/logo-cco.png"
            alt="FSCR Ingeniería S.A.S."
            width={303}
            height={116}
            priority
            className="h-9 w-auto shrink-0"
          />
          <div className="h-8 w-px shrink-0 bg-white/20" />
          <div>
            <h1 className="text-sm font-bold text-white">{titulo}</h1>
            <p className="chip-mono mt-0.5 flex items-center gap-1 text-white/60">
              <ShieldCheck className="size-3" />
              {subtitulo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <nav className="relative flex items-center gap-0.5 rounded-md bg-white/10 p-1">
            {VISTAS.map((vista) => {
              const activa = pathname === vista.href;
              const Icono = vista.icono;
              return (
                <Link
                  key={vista.href}
                  href={vista.href}
                  className="relative flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  {activa && (
                    <motion.span
                      layoutId="switch-vista-admin"
                      className="absolute inset-0 rounded-[7px] bg-white/20"
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  )}
                  <span className={`relative flex items-center gap-1.5 ${activa ? "text-white" : "text-white/60 hover:text-white/85"}`}>
                    <Icono className="size-3.5" />
                    <span className="hidden sm:inline">{vista.etiqueta}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white">
              {iniciales}
            </span>
            <span className="text-xs font-semibold text-white/85">{sesion.nombre}</span>
          </div>
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 rounded-md border border-transparent bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-red-400/70 hover:bg-red-500/10 hover:text-red-100 cursor-pointer"
          >
            <LogOut className="size-3.5" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
