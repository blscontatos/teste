import { PropertyWizard } from "@/components/admin/wizard/PropertyWizard";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function NewProperty() {
  await requireStaff();
  const supabase = await createClient();
  const { data: catalog } = await supabase.from("features_catalog").select("label, scope").order("position");
  return <PropertyWizard property={null} catalog={catalog ?? []} />;
}
