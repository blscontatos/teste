import { ProductEditor } from "@/components/admin/ProductEditor";

// "Adicionar produto nesta categoria" abre esta página com ?categoria=<id> já escolhida.
export default async function Page({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  return <ProductEditor initialCategoryId={categoria} />;
}
