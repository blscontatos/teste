"use client";
// Botão em formato de pílula com as animações do site:
// leve aumento + sombra no hover, "aperto" ao clicar e seta que desliza.
import { motion, type HTMLMotionProps } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "./icons";

type Variant = "navy" | "gold" | "outline" | "white";
const styles: Record<Variant, string> = {
  navy: "bg-navy text-white hover:bg-navy-700",
  gold: "bg-gold text-navy hover:bg-gold-600",
  outline: "border-2 border-navy text-navy bg-transparent hover:bg-navy hover:text-white",
  white: "bg-white text-navy hover:bg-cream-50",
};

type Props = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  arrow?: boolean;
  whatsapp?: boolean;
  size?: "md" | "lg" | "sm";
  children: React.ReactNode;
  href?: string;
};

const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-[0.95rem]", lg: "px-7 py-3.5 text-base" };

export function PillButton({ variant = "navy", arrow, whatsapp, size = "md", className = "", children, href, ...rest }: Props) {
  const cls = `group inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-pill transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles[variant]} ${sizes[size]} ${className}`;
  const inner = (
    <>
      {whatsapp && <WhatsAppIcon className="h-5 w-5" />}
      <span className="inline-flex items-center gap-2">{children}</span>
      {arrow && <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />}
    </>
  );
  const motionProps = {
    whileHover: { scale: 1.04, boxShadow: "0 14px 28px -10px rgba(11,35,65,0.55)" },
    whileTap: { scale: 0.96 },
    transition: { type: "spring" as const, stiffness: 400, damping: 22 },
  };
  if (href) {
    const external = href.startsWith("http");
    return (
      <motion.a
        href={href}
        className={cls}
        onClick={rest.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        aria-label={rest["aria-label"]}
        {...motionProps}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" className={cls} {...motionProps} {...rest}>
      {inner}
    </motion.button>
  );
}
