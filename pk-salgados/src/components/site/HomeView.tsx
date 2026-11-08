import type { SiteData } from "@/lib/types";
import { env } from "@/lib/env";
import { ShopProvider } from "@/components/order/ShopProvider";
import { Overlays } from "@/components/order/Overlays";
import { Header } from "@/components/site/Header";
import { ClosedBanner } from "@/components/site/ClosedBanner";
import { Hero } from "@/components/site/Hero";
import { MenuSection } from "@/components/site/MenuSections";
import { Promotions } from "@/components/site/Promotions";
import { Testimonials } from "@/components/site/Testimonials";
import { About } from "@/components/site/About";
import { Footer } from "@/components/site/Footer";
import { MotionProvider } from "@/components/ui/MotionProvider";

/** Página inicial completa (usada pelo site e pela prévia do painel). */
export function HomeView({ data, preview = false }: { data: SiteData; preview?: boolean }) {
  const s = data.settings;

  // Dados de negócio local para o Google (LocalBusiness).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: data.content.marca.name,
    url: env.siteUrl,
    image: `${env.siteUrl}/og.jpg`,
    logo: `${env.siteUrl}${data.content.marca.logo_url.startsWith("/") ? data.content.marca.logo_url : "/brand/logo.png"}`,
    telephone: s.whatsapp ? `+${s.whatsapp}` : undefined,
    address: s.address ? { "@type": "PostalAddress", streetAddress: s.address, addressLocality: "Rio de Janeiro", addressRegion: "RJ", addressCountry: "BR" } : undefined,
    servesCuisine: "Brasileira",
    priceRange: "$",
    sameAs: [s.instagram && `https://instagram.com/${s.instagram.replace(/^@/, "")}`, s.facebook && `https://facebook.com/${s.facebook}`].filter(Boolean),
  };

  return (
    <MotionProvider>
      <ShopProvider data={data} preview={preview}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <Header />
        <ClosedBanner />
        <main id="conteudo">
          <Hero />
          <MenuSection section="salgado" />
          <MenuSection section="doce" />
          <Promotions />
          <Testimonials />
          <About />
        </main>
        <Footer />
        <Overlays />
      </ShopProvider>
    </MotionProvider>
  );
}
