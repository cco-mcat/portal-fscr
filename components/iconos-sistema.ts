import {
  Bot,
  ClipboardCheck,
  Eye,
  Gavel,
  Hammer,
  HardHat,
  LifeBuoy,
  LineChart,
  Plug,
  ShieldAlert,
  Target,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import type { IconoSistema } from "@/lib/sistemas";

// Único lugar donde vive este mapeo — tarjeta-sistema.tsx (la grilla
// pública) y el formulario de proyectos del admin lo comparten, así un
// ícono nuevo en lib/sistemas.ts (ICONOS_DISPONIBLES) solo se agrega acá
// una vez.
export const ICONOS_SISTEMA: Record<IconoSistema, LucideIcon> = {
  "shield-alert": ShieldAlert,
  hammer: Hammer,
  "line-chart": LineChart,
  gavel: Gavel,
  "life-buoy": LifeBuoy,
  target: Target,
  "hard-hat": HardHat,
  "clipboard-check": ClipboardCheck,
  eye: Eye,
  ticket: Ticket,
  bot: Bot,
  plug: Plug,
};
