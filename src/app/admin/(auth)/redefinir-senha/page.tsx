import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/recuperar-senha?erro=link-invalido");
  return (
    <>
      <h1 className="font-display text-4xl font-medium">Criar nova senha</h1>
      <p className="mt-2 text-sm text-ink/60">Conta: {user.email}. Use pelo menos 10 caracteres, com letras e números.</p>
      <ResetForm />
    </>
  );
}
