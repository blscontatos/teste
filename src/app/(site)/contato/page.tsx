import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { HelpSection } from "@/components/home/HelpSection";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Luiz Vieira Negócios Imobiliários pelo WhatsApp, telefone ou e-mail. Atendimento na Barra da Tijuca e no Recreio dos Bandeirantes.",
  alternates: { canonical: "/contato" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const wa = whatsappLink(s.whatsapp_number, s.whatsapp_message);
  return (
    <>
      <section className="bg-gradient-to-b from-sand to-white pt-36 pb-6 sm:pt-44">
        <div className="container-luxe">
          <p className="eyebrow animate-fade-up">Contato</p>
          <h1 className="heading-xl mt-6 max-w-3xl animate-fade-up text-balance [animation-delay:100ms]">Vamos conversar sobre o seu próximo passo.</h1>
          <div className="mt-12 grid animate-fade-up gap-4 [animation-delay:200ms] md:grid-cols-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="group rounded-[24px] bg-ink p-7 text-white transition hover:-translate-y-1">
              <WhatsAppIcon className="h-7 w-7 text-[#25D366]" />
              <p className="mt-5 font-display text-2xl">WhatsApp</p>
              <p className="mt-1 text-sm text-white/60">{s.contact_phone || "Resposta rápida com um corretor"}</p>
            </a>
            {s.contact_email ? (
              <a href={`mailto:${s.contact_email}`} className="rounded-[24px] border border-line bg-white p-7 transition hover:-translate-y-1 hover:border-gold/50">
                <Mail className="h-7 w-7 text-gold-deep" strokeWidth={1.4} />
                <p className="mt-5 font-display text-2xl">E-mail</p>
                <p className="mt-1 text-sm break-all text-ink/60">{s.contact_email}</p>
              </a>
            ) : (
              <div className="rounded-[24px] border border-line bg-white p-7">
                <Phone className="h-7 w-7 text-gold-deep" strokeWidth={1.4} />
                <p className="mt-5 font-display text-2xl">Atendimento</p>
                <p className="mt-1 text-sm text-ink/60">Segunda a sábado, com hora marcada</p>
              </div>
            )}
            <div className="rounded-[24px] border border-line bg-white p-7">
              <MapPin className="h-7 w-7 text-gold-deep" strokeWidth={1.4} />
              <p className="mt-5 font-display text-2xl">Região</p>
              <p className="mt-1 text-sm text-ink/60">{s.address}</p>
            </div>
          </div>
        </div>
      </section>
      <HelpSection />
    </>
  );
}
