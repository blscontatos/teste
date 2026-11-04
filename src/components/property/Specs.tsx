import { Bath, BedDouble, Car, Ruler } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatArea } from "@/lib/format";

export function Specs({
  p,
  className = "",
  light = false,
}: {
  p: Pick<Property, "total_area" | "built_area" | "bedrooms" | "bathrooms" | "parking_spots">;
  className?: string;
  light?: boolean;
}) {
  const area = p.built_area ?? p.total_area;
  const items = [
    area != null && { icon: Ruler, label: formatArea(area), title: "Área" },
    p.bedrooms != null && { icon: BedDouble, label: `${p.bedrooms} ${p.bedrooms === 1 ? "quarto" : "quartos"}`, title: "Quartos" },
    p.bathrooms != null && { icon: Bath, label: `${p.bathrooms} ${p.bathrooms === 1 ? "banheiro" : "banheiros"}`, title: "Banheiros" },
    p.parking_spots != null && { icon: Car, label: `${p.parking_spots} ${p.parking_spots === 1 ? "vaga" : "vagas"}`, title: "Vagas" },
  ].filter(Boolean) as { icon: typeof Ruler; label: string; title: string }[];
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-2 text-[13px] ${light ? "text-white/75" : "text-ink/65"} ${className}`}>
      {items.map(({ icon: Icon, label, title }) => (
        <li key={title} className="flex items-center gap-1.5" title={title}>
          <Icon className={`h-4 w-4 ${light ? "text-gold-light" : "text-gold-deep"}`} strokeWidth={1.6} />
          {label}
        </li>
      ))}
    </ul>
  );
}
