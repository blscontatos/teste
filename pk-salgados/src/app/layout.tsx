import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "PK Salgados e Doces | Salgados, docinhos e bolos de festa no Rio",
    template: "%s | PK Salgados e Doces",
  },
  description:
    "Salgados assados e fritos, docinhos e bolos de festa sob encomenda em Guadalupe, Rio de Janeiro. Peça pelo site ou pelo WhatsApp.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "PK Salgados e Doces",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "PK Salgados e Doces" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0B2341",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
