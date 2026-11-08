"use client";
// Janela que abre deslizando de baixo (celular) ou com fade + zoom (computador).
// Também usada como gaveta lateral (sacola) no computador.
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export function useIsDesktop() {
  // Lê o tamanho da tela já na primeira renderização (a janela só abre após um clique,
  // então sempre roda no navegador) — evita começar com a animação do celular.
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function Sheet({
  onClose,
  title,
  children,
  side = false,
  footer,
  onBack,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: boolean; // gaveta lateral no computador
  footer?: React.ReactNode;
  onBack?: () => void;
}) {
  const desktop = useIsDesktop();
  const panel = useRef<HTMLDivElement>(null);

  // Esc fecha, foco vai para a janela e volta ao fechar, rolagem da página travada.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  const variants = desktop
    ? side
      ? { initial: { x: "100%" }, animate: { x: 0, y: 0 }, exit: { x: "100%" } }
      : { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1, x: 0, y: 0 }, exit: { opacity: 0, scale: 0.96 } }
    : { initial: { y: "100%" }, animate: { y: 0, x: 0 }, exit: { y: "100%" } };

  const position = desktop
    ? side
      ? "right-0 top-0 h-full w-[460px] rounded-l-[2rem]"
      : "left-1/2 top-1/2 max-h-[90vh] w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem]"
    : "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[2rem]";

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-navy/55 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />
      {/* O wrapper centraliza no desktop sem conflitar com o transform da animação */}
      <div className={`pointer-events-none absolute ${desktop && !side ? "inset-0 grid place-items-center" : "inset-0"}`}>
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          {...variants}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className={`pointer-events-auto flex flex-col overflow-hidden bg-cream-50 shadow-2xl outline-none ${
            desktop && !side ? "max-h-[90vh] w-[min(640px,92vw)] rounded-[2rem]" : `absolute ${position}`
          }`}
        >
          {!desktop && <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-navy/20" aria-hidden />}
          <div className="flex shrink-0 items-center gap-2 border-b border-navy/10 px-5 py-3.5">
            {onBack && (
              <button type="button" onClick={onBack} className="rounded-full px-2 py-1 text-sm font-semibold text-navy hover:bg-cream" aria-label="Voltar">
                ← Voltar
              </button>
            )}
            <h2 className="flex-1 truncate font-title text-xl text-navy">{title}</h2>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-navy hover:bg-cream" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="shrink-0 border-t border-navy/10 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}
