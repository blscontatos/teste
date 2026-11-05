import type { Metadata } from "next";
import { Logo, LogoFull } from "@/components/site/Logo";

export const metadata: Metadata = { title: "Área restrita", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grain absolute inset-0" />
        <div aria-hidden className="absolute -right-32 -bottom-32 h-[480px] w-[480px] rounded-full border border-gold/20" />
        <div aria-hidden className="absolute -right-12 -bottom-12 h-[320px] w-[320px] rounded-full border border-gold/30" />
        <div className="relative">
          <LogoFull width={200} className="h-auto w-[180px]" />
        </div>
        <div className="relative max-w-md">
          <p className="eyebrow text-gold-light">Painel administrativo</p>
          <p className="mt-6 font-display text-5xl leading-tight">Gerencie imóveis, destaques e contatos em um só lugar.</p>
        </div>
        <p className="relative text-xs text-white/40">Acesso exclusivo para a equipe autorizada.</p>
      </div>
      <div className="flex items-center justify-center bg-sand px-5 py-16">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
