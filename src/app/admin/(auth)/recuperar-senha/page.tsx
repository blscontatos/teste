"use client";
import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, MailCheck } from "lucide-react";
import { requestPasswordReset } from "../../actions";
import { Suspense } from "react";

function Inner() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  const invalid = useSearchParams().get("erro") === "link-invalido";
  if (state.ok) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto h-12 w-12 text-gold-deep" strokeWidth={1.3} />
        <h1 className="mt-5 font-display text-4xl">Verifique seu e-mail</h1>
        <p className="mt-3 text-sm text-ink/60">Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.</p>
        <Link href="/admin/login" className="btn-outline mt-8">
          Voltar ao login
        </Link>
      </div>
    );
  }
  return (
    <>
      <h1 className="font-display text-4xl font-medium">Recuperar senha</h1>
      <p className="mt-2 text-sm text-ink/60">Informe seu e-mail e enviaremos um link seguro para redefinir a senha.</p>
      {invalid && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">O link é inválido ou expirou. Solicite um novo.</p>}
      <form action={action} className="mt-8 space-y-5">
        <label className="block">
          <span className="field-label">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        {state.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
        <button type="submit" className="btn-dark w-full" disabled={pending}>
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Enviar link
        </button>
        <Link href="/admin/login" className="block text-center text-sm font-semibold text-gold-deep">
          Voltar ao login
        </Link>
      </form>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
