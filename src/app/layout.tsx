import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";
import { COMPANY } from "@/lib/constants";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${COMPANY.name} | Imóveis na Barra da Tijuca e Recreio dos Bandeirantes`,
    template: `%s | ${COMPANY.name}`,
  },
  description:
    "Imóveis de alto padrão no Recreio dos Bandeirantes, Barra da Tijuca e Barra Olímpica. Casas, apartamentos e coberturas selecionados com atendimento personalizado no Rio de Janeiro.",
  keywords: [
    "imóveis no Recreio dos Bandeirantes",
    "imóveis na Barra da Tijuca",
    "casas à venda no Recreio",
    "apartamentos na Barra da Tijuca",
    "imóveis de alto padrão no Rio de Janeiro",
    "coberturas na Barra da Tijuca",
    "corretor de imóveis Recreio",
  ],
  applicationName: COMPANY.name,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: COMPANY.name,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
