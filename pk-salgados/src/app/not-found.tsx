import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4 text-center">
      <div>
        <p className="font-title text-7xl text-gold">404</p>
        <h1 className="mt-2 font-title text-3xl text-navy">Página não encontrada</h1>
        <Link href="/" className="mt-6 inline-block rounded-full bg-navy px-6 py-3 font-semibold text-white">Voltar ao início</Link>
      </div>
    </main>
  );
}
