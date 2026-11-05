import Image from "next/image";
import Link from "next/link";

/** Logo horizontal: emblema oficial (LV com prédios) + nome da empresa. */
export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3" aria-label="Luiz Vieira Negócios Imobiliários — início">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${light ? "" : "bg-ink"}`}>
        <Image src="/brand/logo-mark.png" alt="" width={44} height={44} priority className="h-10 w-10 object-contain" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[20px] font-medium tracking-[0.08em] uppercase ${light ? "text-gold-light" : "text-ink"}`}
        >
          Luiz Vieira
        </span>
        <span className={`mt-1 text-[8.5px] font-semibold tracking-[0.3em] ${light ? "text-white/70" : "text-gold-deep"}`}>
          NEGÓCIOS IMOBILIÁRIOS
        </span>
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
