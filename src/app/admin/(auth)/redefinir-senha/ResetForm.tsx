"use client";
import Link from "next/link";
import { useActionState } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { updatePasswordAction } from "../../actions";

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, {});
  if (state.ok)
    return (
      <div className="mt-8 rounded-2xl bg-emerald-50 p-6 text-emerald-900">
        <CircleCheck className="h-8 w-8" />
        <p className="mt-3 font-semibold">Senha atualizada com sucesso.</p>
        <Link href="/admin" className="btn-dark mt-5">
          Ir para o painel
        </Link>
      </div>
    );
  return (
    <form action={action} className="mt-8 space-y-5">
      <label className="block">
        <span className="field-label">Nova senha</span>
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </label>
      <label className="block">
        <span className="field-label">Confirmar nova senha</span>
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </label>
      {state.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      <button type="submit" className="btn-dark w-full" disabled={pending}>
        {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Salvar nova senha
      </button>
    </form>
  );
}
