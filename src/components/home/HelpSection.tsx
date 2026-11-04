import { LeadForms } from "@/components/forms/LeadForms";
import { Reveal } from "@/components/ui/Reveal";

export function HelpSection({ initial = null }: { initial?: "comprar" | "vender" | null }) {
  return (
    <section id="como-ajudar" className="bg-white py-24 sm:py-32">
      <div className="container-luxe">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="eyebrow justify-center">Atendimento personalizado</p>
          <h2 className="heading-lg mt-5">Como podemos ajudar você?</h2>
          <p className="mt-5 text-ink/60">
            Escolha uma opção e compartilhe alguns detalhes. Um corretor retornará com atenção ao seu momento.
          </p>
        </Reveal>
        <div className="mx-auto max-w-4xl">
          <LeadForms initial={initial} />
        </div>
      </div>
    </section>
  );
}
