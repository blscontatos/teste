"use client";
// Moldura do painel: menu lateral (computador) e barra inferior (celular).
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Cake, Clock, ExternalLink, LogOut, MessageSquareQuote, Percent, Settings, Type } from "lucide-react";
import { ToastProvider } from "./ui";

const LINKS = [
  { href: "/admin", label: "Pedidos", Icon: ClipboardList },
  { href: "/admin/produtos", label: "Produtos", Icon: Cake },
  { href: "/admin/promocoes", label: "Promoções", short: "Promo", Icon: Percent },
  { href: "/admin/conteudo", label: "Textos e imagens", short: "Textos", Icon: Type },
  { href: "/admin/horarios", label: "Horários", Icon: Clock },
  { href: "/admin/depoimentos", label: "Depoimentos", short: "Depoim.", Icon: MessageSquareQuote },
  { href: "/admin/configuracoes", label: "Configurações", short: "Ajustes", Icon: Settings },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-cream-50 lg:flex">
        <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-navy p-5 text-white lg:flex">
          <Image src="/brand/logo-pk-modelo-white.png" alt="PK Salgados e Doces" width={578} height={447} className="mx-auto h-16 w-auto" />
          <nav className="mt-8 flex-1 space-y-1" aria-label="Painel">
            {LINKS.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-medium transition ${active(href) ? "bg-gold text-navy" : "text-white/80 hover:bg-white/10"}`}>
                <Icon className="h-5 w-5" aria-hidden /> {label}
              </Link>
            ))}
          </nav>
          <a href="/" target="_blank" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/80 hover:bg-white/10">
            <ExternalLink className="h-4 w-4" /> Ver o site
          </a>
          <form action="/auth/sair" method="post">
            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/80 hover:bg-white/10">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
          <p className="mt-2 truncate px-4 text-xs text-white/50">{email}</p>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-navy/10 bg-cream-50/95 px-4 py-2.5 backdrop-blur lg:hidden">
            <Image src="/brand/logo-pk-modelo.png" alt="PK" width={578} height={447} className="h-10 w-auto" />
            <div className="flex items-center gap-1">
              <a href="/" target="_blank" className="rounded-full px-3 py-2 text-sm font-semibold text-navy">Ver site</a>
              <form action="/auth/sair" method="post">
                <button className="rounded-full px-3 py-2 text-sm font-semibold text-navy" aria-label="Sair"><LogOut className="h-5 w-5" /></button>
              </form>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
        </div>

        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-navy/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Painel">
          {LINKS.map(({ href, label, short, Icon }) => (
            <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[0.6rem] font-semibold ${active(href) ? "text-gold-600" : "text-navy/70"}`}>
              <Icon className="h-5 w-5" aria-hidden />
              {short ?? label}
            </Link>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}
