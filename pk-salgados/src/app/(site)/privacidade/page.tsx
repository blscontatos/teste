import type { Metadata } from "next";
import Link from "next/link";
import { getSiteData } from "@/lib/data";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Política de privacidade" };

export default async function Privacidade() {
  const { settings: s, content } = await getSiteData();
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-sm font-semibold text-navy underline">← Voltar ao site</Link>
      <h1 className="mt-6 font-title text-4xl text-navy">Política de privacidade</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted">
        <p>
          A {content.marca.name} usa os dados informados nos pedidos (nome, telefone, endereço, data desejada,
          observações e, nas encomendas de bolo, a foto de inspiração) <strong>somente para preparar, confirmar
          e entregar o seu pedido</strong>, conforme a Lei Geral de Proteção de Dados (LGPD).
        </p>
        <p>Não vendemos nem compartilhamos seus dados com terceiros para publicidade.</p>
        <p>
          Os dados ficam guardados em um banco de dados seguro, acessível apenas pelas responsáveis pela loja.
          Para evitar envios automáticos (spam), guardamos um código resumido e irreversível da conexão de onde
          o pedido foi feito — nunca o endereço de IP em si.
        </p>
        <p>
          Você pode pedir a consulta, correção ou exclusão dos seus dados a qualquer momento pelo WhatsApp
          {s.whatsapp ? ` (+${s.whatsapp})` : ""}.
        </p>
        <p>
          Guardamos apenas um item no seu navegador: a sua sacola, para você não perder os itens escolhidos.
          Não usamos cookies de propaganda.
        </p>
      </div>
    </main>
  );
}
