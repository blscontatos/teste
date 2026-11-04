"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Lock } from "lucide-react";
import { loginAction } from "../../actions";

export function LoginForm({ redirect }: { redirect: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="redirect" value={redirect} />
      <label className="block">
        <span className="field-label">E-mail</span>
        <input name="email" type="email" required autoComplete="username" className="field" placeholder="voce@email.com" />
      </label>
      <label className="block">
        <span className="field-label">Senha</span>
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="field pr-12" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-stone" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </span>
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-dark w-full" disabled={pending}>
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Entrar
      </button>
      <div className="flex justify-between text-sm">
        <Link href="/admin/recuperar-senha" className="font-semibold text-gold-deep hover:text-ink">
          Esqueci minha senha
        </Link>
        <Link href="/" className="text-ink/50 hover:text-ink">
          Voltar ao site
        </Link>
      </div>
    </form>
  );
}
