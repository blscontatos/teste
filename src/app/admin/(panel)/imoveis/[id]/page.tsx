import { notFound } from "next/navigation";
import { PropertyWizard } from "@/components/admin/wizard/PropertyWizard";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

export default async function EditProperty({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ etapa?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { etapa } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data }, { data: catalog }, { data: settings }] = await Promise.all([
    supabase.from("properties").select("*, property_images(*)").eq("id", id).maybeSingle(),
    supabase.from("features_catalog").select("label, scope").order("position"),
    supabase.from("site_settings").select("featured_property_id").eq("id", 1).single(),
  ]);
  if (!data) notFound();
  return (
    <PropertyWizard
      property={data as Property}
      catalog={catalog ?? []}
      initialStep={etapa ? Number(etapa) : undefined}
      isFeatured={settings?.featured_property_id === id}
    />
  );
}
