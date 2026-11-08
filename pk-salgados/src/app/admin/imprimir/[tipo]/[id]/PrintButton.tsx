"use client";
import { useEffect } from "react";

export function PrintButton() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <button type="button" onClick={() => window.print()} className="no-print mb-3 w-full rounded-full bg-navy py-2 font-sans text-sm font-semibold text-white">
      Imprimir
    </button>
  );
}
