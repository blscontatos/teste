import { Suspense } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/format";
import { env } from "@/lib/env";
import { COMPANY } from "@/lib/constants";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const wa = whatsappLink(settings.whatsapp_number, settings.whatsapp_message);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: COMPANY.name,
    url: env.siteUrl,
    areaServed: ["Recreio dos Bandeirantes", "Barra da Tijuca", "Barra Olímpica", "Rio de Janeiro", "Angra dos Reis"],
    address: { "@type": "PostalAddress", addressLocality: "Rio de Janeiro", addressRegion: "RJ", addressCountry: "BR" },
    ...(settings.contact_phone ? { telephone: settings.contact_phone } : {}),
    ...(settings.contact_email ? { email: settings.contact_email } : {}),
  };

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Pular para o conteúdo
      </a>
      <Suspense fallback={null}>
        <Header whatsappHref={wa} />
      </Suspense>
      <main id="conteudo">{children}</main>
      <Footer settings={settings} whatsappHref={wa} />
      <WhatsAppFloat href={wa} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
