/** Transição suave entre páginas (re-renderizado a cada navegação). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
