import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-sand px-6 text-center">
      <div>
        <p className="eyebrow justify-center">Erro 404</p>
        <h1 className="heading-lg mt-5">Página não encontrada</h1>
        <p className="mx-auto mt-4 max-w-md text-ink/60">O imóvel ou a página que você procura pode ter sido vendido, removido ou mudado de endereço.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/imoveis" className="btn-dark">Ver imóveis disponíveis</Link>
          <Link href="/" className="btn-outline">Voltar ao início</Link>
        </div>
      </div>
    </main>
  );
}
