"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("erro") === "link-invalido" ? "O link expirou. Peça um novo." : params.get("erro") === "sem-acesso" ? "Este e-mail não tem acesso ao painel." : "");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return setError("E-mail ou senha incorretos.");
    router.replace("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-center font-title text-3xl text-navy">Entrar no painel</h1>
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" type="email" className="field" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="senha">Senha</label>
        <input id="senha" type="password" className="field" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-full bg-navy py-3 font-semibold text-white shadow-pill transition hover:bg-navy-700 active:scale-[0.98] disabled:opacity-60">
        {loading ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm">
        <Link href="/admin/recuperar-senha" className="font-semibold text-navy underline">Esqueci minha senha</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
