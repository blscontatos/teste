import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export function WhatsAppFloat({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar pelo WhatsApp"
      className="group fixed right-4 bottom-4 z-40 grid h-14 w-14 animate-pop-in place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_-8px_rgba(37,211,102,0.65)] transition-all duration-500 ease-(--ease-luxe) [animation-delay:900ms] hover:scale-110 hover:shadow-[0_16px_36px_-10px_rgba(37,211,102,0.8)] sm:right-6 sm:bottom-6 sm:h-16 sm:w-16"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 motion-safe:animate-ping [animation-duration:2.8s] [animation-iteration-count:3]" />
      <WhatsAppIcon className="relative h-7 w-7 sm:h-8 sm:w-8" />
      <span className="pointer-events-none absolute right-full mr-3 hidden translate-x-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:block">
        Fale com um corretor
      </span>
    </a>
  );
}
