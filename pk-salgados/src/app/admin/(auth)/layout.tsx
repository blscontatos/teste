import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm">
        <Image src="/brand/logo.png" alt="PK Salgados e Doces" width={410} height={240} className="mx-auto h-24 w-auto" priority />
        <div className="mt-6 rounded-[2rem] bg-cream-50 p-6 shadow-card sm:p-8">{children}</div>
      </div>
    </main>
  );
}
