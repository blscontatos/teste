import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { HomeView } from "@/components/site/HomeView";

// "Ver como fica": mostra os textos e imagens em rascunho. Só para as donas logadas.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prévia", robots: { index: false, follow: false } };

export default async function Preview() {
  await requireAdmin();
  return <HomeView data={await getSiteData({ preview: true })} preview />;
}
