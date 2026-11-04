import { PageHeader } from "@/components/admin/AdminShell";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Testimonial } from "@/lib/types";

export default async function TestimonialsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("*").order("position").order("created_at", { ascending: false });
  return (
    <>
      <PageHeader
        title="Depoimentos"
        subtitle="Cadastre apenas avaliações reais, com autorização do cliente. Enquanto nenhum estiver publicado, o site mostra exemplos identificados como demonstração."
      />
      <TestimonialsManager items={(data ?? []) as Testimonial[]} />
    </>
  );
}
