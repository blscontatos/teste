/** Composição arquitetônica abstrata usada quando ainda não há fotografia cadastrada. */
export function ArtPlaceholder({ className = "", label }: { className?: string; label?: string }) {
  return (
    <div className={`relative isolate overflow-hidden bg-ink ${className}`} aria-hidden={!label}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d1b18" />
            <stop offset="1" stopColor="#0d0d0c" />
          </linearGradient>
          <linearGradient id="goldg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d9c39a" />
            <stop offset="1" stopColor="#9a7a43" />
          </linearGradient>
        </defs>
        <rect width="600" height="700" fill="url(#sky)" />
        <circle cx="450" cy="170" r="70" fill="url(#goldg)" opacity="0.18" />
        <g fill="none" stroke="#b8955a" strokeOpacity="0.45" strokeWidth="1.2">
          <path d="M60 640 V330 h170 v310" />
          <path d="M230 640 V230 h200 v410" />
          <path d="M430 640 V380 h120 v260" />
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={i} d={`M250 ${270 + i * 45} h160`} strokeOpacity="0.25" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <path key={`b${i}`} d={`M80 ${370 + i * 50} h130`} strokeOpacity="0.25" />
          ))}
          <path d="M0 640 H600" strokeOpacity="0.7" />
          <path d="M0 668 C120 650 240 686 360 668 S560 652 600 664" strokeOpacity="0.35" />
        </g>
      </svg>
      <div className="grain absolute inset-0" />
      {label && (
        <span className="absolute bottom-5 left-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-light/80">
          {label}
        </span>
      )}
    </div>
  );
}
