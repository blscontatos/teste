import Link from "next/link";

export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3" aria-label="Luiz Vieira Negócios Imobiliários — início">
      <span
        className={`relative grid h-11 w-11 place-items-center rounded-[10px] border transition-colors duration-500 ${
          light ? "border-gold/60 bg-white/5" : "border-gold/70 bg-ink"
        }`}
      >
        <span className="font-display text-[19px] leading-none font-medium tracking-wide text-gold-light">LV</span>
        <span className="absolute inset-[3px] rounded-[7px] border border-gold/20" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[21px] font-medium tracking-wide ${light ? "text-white" : "text-ink"}`}>
          Luiz Vieira
        </span>
        <span className={`mt-1 text-[8.5px] font-semibold tracking-[0.32em] ${light ? "text-gold-light" : "text-gold-deep"}`}>
          NEGÓCIOS IMOBILIÁRIOS
        </span>
      </span>
    </Link>
  );
}
