export function PieCorporativo() {
  return (
    <footer className="gradiente-pigo mt-auto">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-0.5 px-6 py-2.5 text-center">
        <div className="chip-mono text-white/80">
          <span className="font-bold text-brand-blue-claro">FSCR</span> · CCO —{" "}
          <span className="texto-recorrido font-bold">Departamento de Innovación Tecnológica</span>
        </div>
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} FSCR · Portal interno de sistemas · Uso exclusivo corporativo
        </p>
      </div>
    </footer>
  );
}
