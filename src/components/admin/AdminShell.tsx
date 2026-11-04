"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, MessageSquareQuote, Settings, Users, X } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import type { AppRole } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/admin/interessados", label: "Interessados", icon: Inbox, badge: "leads" },
  { href: "/admin/depoimentos", label: "Depoimentos", icon: MessageSquareQuote, adminOnly: true },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/usuarios", label: "Usuários", icon: Users, adminOnly: true },
] as const;

export function AdminShell({
  children,
  name,
  role,
  newLeads,
}: {
  children: React.ReactNode;
  name: string;
  role: AppRole;
  newLeads: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const items = NAV.filter((i) => !("adminOnly" in i && i.adminOnly) || role === "admin");
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Painel">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, "exact" in item ? item.exact : false);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-all duration-300 ${
              active ? "bg-gold text-ink shadow-[0_10px_25px_-12px_rgba(184,149,90,0.8)]" : "text-white/65 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
            <span className="flex-1">{item.label}</span>
            {"badge" in item && newLeads > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-ink text-gold-light" : "bg-gold/20 text-gold-light"}`}>
                {newLeads}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-3 border-t border-white/10 pt-5">
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white">
        <ExternalLink className="h-4 w-4" /> Ver site
      </Link>
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold font-display text-lg text-ink">{name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="text-[11px] tracking-wider text-gold-light uppercase">{role === "admin" ? "Administrador" : "Corretor"}</p>
        </div>
        <form action="/auth/sair" method="post">
          <button type="submit" className="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Sair" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f3ef]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col gap-8 bg-ink p-5 lg:flex">
        <div className="px-2 pt-2">
          <Logo light href="/admin" />
        </div>
        {nav}
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo href="/admin" />
        <button type="button" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-full border border-line" aria-label="Abrir menu do painel">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-ink/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[280px] flex-col gap-8 bg-ink p-5 transition-transform duration-500 ease-(--ease-luxe) ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-2 pt-2">
            <Logo light href="/admin" />
            <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-white" aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          {nav}
          {footer}
        </aside>
      </div>

      <main className="lg:pl-[264px]">
        <div className="mx-auto max-w-[1280px] animate-fade-in px-4 py-8 sm:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl font-medium">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, accent = false }: { label: string; value: number | string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-[22px] border p-5 ${accent ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
      <p className={`text-xs font-semibold tracking-wide uppercase ${accent ? "text-gold-light" : "text-stone"}`}>{label}</p>
      <p className="mt-2 font-display text-4xl font-medium">{value}</p>
      {hint && <p className={`mt-1 text-xs ${accent ? "text-white/60" : "text-stone"}`}>{hint}</p>}
    </div>
  );
}
