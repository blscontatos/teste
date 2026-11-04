"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CircleCheck, CircleAlert } from "lucide-react";

type Toast = { id: number; type: "ok" | "error"; text: string };
const Ctx = createContext<(type: Toast["type"], text: string) => void>(() => {});

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((type: Toast["type"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:right-6 sm:left-auto sm:items-end" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex max-w-sm animate-fade-up items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-xl ${
              t.type === "ok" ? "bg-ink text-white" : "bg-red-700 text-white"
            }`}
          >
            {t.type === "ok" ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
