import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { COMPANY } from "@/lib/constants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Luiz Vieira Negócios Imobiliários coleta, utiliza e protege seus dados pessoais, conforme a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default async function PrivacyPage() {
  const s = await getSettings();
  const contact = s.contact_email || "o e-mail informado na página de contato";
  return (
    <section className="pt-36 pb-24 sm:pt-44">
      <div className="container-luxe max-w-3xl">
        <p className="eyebrow">LGPD</p>
        <h1 className="heading-lg mt-5">Política de Privacidade</h1>
        <p className="mt-4 text-sm text-stone">Última atualização: {new Date(s.updated_at).getFullYear() > 2000 ? new Date(s.updated_at).toLocaleDateString("pt-BR") : "—"}</p>
        <div className="mt-10 space-y-8 leading-relaxed text-ink/75 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          <p>
            Esta política explica como a <strong>{COMPANY.name}</strong>
            {s.creci ? ` (CRECI ${s.creci})` : ""} trata os dados pessoais coletados por este site, em conformidade com a Lei
            Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
          </p>
          <div>
            <h2>1. Dados coletados</h2>
            <p className="mt-3">Coletamos apenas os dados que você nos fornece nos formulários:</p>
            <ul className="mt-3">
              <li>nome completo, e-mail, telefone/WhatsApp e idade;</li>
              <li>preferências de imóvel (bairro, tipo, faixa de preço, quartos) ou dados do imóvel que deseja vender;</li>
              <li>mensagens enviadas voluntariamente.</li>
            </ul>
          </div>
          <div>
            <h2>2. Finalidade e base legal</h2>
            <p className="mt-3">
              Os dados são utilizados exclusivamente para responder à sua solicitação, apresentar imóveis compatíveis com o seu
              interesse ou avaliar o imóvel que deseja vender. A base legal é o seu <strong>consentimento</strong> (art. 7º, I) e
              a execução de procedimentos preliminares a um contrato a seu pedido (art. 7º, V).
            </p>
          </div>
          <div>
            <h2>3. Compartilhamento</h2>
            <p className="mt-3">
              Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing. Os dados são armazenados em
              provedor de infraestrutura em nuvem com controles de acesso, e apenas a equipe autorizada pode consultá-los.
            </p>
          </div>
          <div>
            <h2>4. Armazenamento e segurança</h2>
            <p className="mt-3">
              Adotamos medidas técnicas como criptografia em trânsito, controle de acesso por perfil e registros de data e hora de
              cada envio. Os dados são mantidos pelo tempo necessário ao atendimento ou até que você solicite a exclusão.
            </p>
          </div>
          <div>
            <h2>5. Seus direitos</h2>
            <p className="mt-3">
              Você pode, a qualquer momento, solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade ou
              exclusão dos seus dados, além de revogar o consentimento, entrando em contato por {contact}.
            </p>
          </div>
          <div>
            <h2>6. Cookies</h2>
            <p className="mt-3">
              O site público não utiliza cookies de rastreamento ou publicidade. Cookies estritamente necessários são usados apenas
              na área restrita, para manter a sessão de usuários autorizados.
            </p>
          </div>
          <div>
            <h2>7. Contato do controlador</h2>
            <p className="mt-3">
              {COMPANY.name} — {s.address}. Dúvidas sobre esta política: {contact}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
