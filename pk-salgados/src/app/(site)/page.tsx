import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import { HomeView } from "@/components/site/HomeView";

// A página fica em cache e é atualizada a cada minuto (assim as promoções
// vencidas somem sozinhas) ou na hora, quando algo é salvo no painel.
export const revalidate = 60;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  return <HomeView data={await getSiteData()} />;
}
