// Elementos decorativos: ondas azuis com borda dourada, folhagens douradas e títulos de seção.

/** Onda curva separando seções. `flip` inverte verticalmente. */
export function Wave({ fill = "#0B2341", className = "", flip = false }: { fill?: string; className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
      className={`block h-[48px] w-full sm:h-[80px] ${flip ? "rotate-180" : ""} ${className}`}
    >
      <path d="M0,64 C240,128 480,0 720,40 C960,80 1200,120 1440,56 L1440,120 L0,120 Z" fill={fill} />
      <path d="M0,64 C240,128 480,0 720,40 C960,80 1200,120 1440,56" fill="none" stroke="#F6A623" strokeWidth="4" />
    </svg>
  );
}

/** Ramo de folhas em traço fino dourado (laterais das seções). */
export function Leaves({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 260"
      fill="none"
      stroke="#F6A623"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
      className={`pointer-events-none ${flip ? "-scale-x-100" : ""} ${className}`}
    >
      <path d="M20 255 C40 190 50 120 95 10" />
      {[
        [32, 215, -1], [38, 190, 1], [44, 165, -1], [52, 140, 1], [60, 115, -1], [70, 90, 1], [80, 65, -1], [88, 42, 1],
      ].map(([x, y, s], i) => (
        <path
          key={i}
          d={`M${x} ${y} q ${s === 1 ? 26 : -26} -6 ${s === 1 ? 34 : -34} -26 q ${s === 1 ? -24 : 24} -2 ${s === 1 ? -34 : 34} 26 Z`}
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

/** Título de seção com "olho" (texto pequeno) e linha dourada. */
export function SectionTitle({ eyebrow, title, subtitle, light = false }: { eyebrow?: string; title: string; subtitle?: string; light?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
      )}
      <h2 className={`font-title text-3xl sm:text-4xl md:text-5xl ${light ? "text-white" : "text-navy"}`}>{title}</h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2" aria-hidden>
        <span className="h-px w-10 bg-gold" />
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <span className="h-px w-10 bg-gold" />
      </div>
      {subtitle && <p className={`mt-4 text-[0.98rem] ${light ? "text-white/80" : "text-muted"}`}>{subtitle}</p>}
    </div>
  );
}

export function Stars({ n, className = "h-4 w-4" }: { n: number; className?: string }) {
  return (
    <div className="flex gap-1 text-gold" role="img" aria-label={`${n} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={className} fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </div>
  );
}
