import Image from "next/image";
import Link from "next/link";

/**
 * Logo do cabeçalho.
 * - Fundo claro: somente o emblema LV em preto.
 * - Fundo escuro (light): emblema dourado + nome da empresa.
 */
export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  if (!light) {
    return (
      <Link href={href} className="flex items-center" aria-label="Luiz Vieira Negócios Imobiliários — início">
        <Image src="/brand/logo-mark-black.png" alt="Luiz Vieira Negócios Imobiliários" width={64} height={64} priority className="h-14 w-14 object-contain" />
      </Link>
    );
  }
  return (
    <Link href={href} className="group flex items-center gap-3" aria-label="Luiz Vieira Negócios Imobiliários — início">
      <Image src="/brand/logo-mark.png" alt="" width={52} height={52} priority className="h-12 w-12 shrink-0 object-contain" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[20px] font-medium tracking-[0.08em] text-gold-light uppercase">Luiz Vieira</span>
        <span className="mt-1 text-[8.5px] font-semibold tracking-[0.3em] text-white/70">NEGÓCIOS IMOBILIÁRIOS</span>
      </span>
    </Link>
  );
}

/** Logo completa (vertical), para fundos escuros. */
export function LogoFull({ className = "", width = 220 }: { className?: string; width?: number }) {
  return (
    <Image
      src="/brand/logo-full.png"
      alt="Luiz Vieira Negócios Imobiliários"
      width={width}
      height={Math.round((width * 590) / 628)}
      className={className}
    />
  );
}
