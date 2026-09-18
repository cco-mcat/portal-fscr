import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PORTAL FSCR — CCO",
  description:
    "Punto de acceso central a los sistemas internos de FSCR: no conformidades, solicitudes de desarrollo, proyecciones y más.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${poppins.variable} h-full overflow-hidden`}>
      <body className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
