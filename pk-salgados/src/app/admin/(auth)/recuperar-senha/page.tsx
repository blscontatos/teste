"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/redefinir-senha`,
    });
    setLoading(false);
    setSent(true); // não revelamos se o e-mail existe
  };

  return sent ? (
    <div className="space-y-4 text-center">
      <h1 className="font-title text-3xl text-navy">Confira seu e-mail</h1>
      <p className="text-sm text-muted">Se este e-mail tiver acesso, você vai receber um link para criar uma nova senha.</p>
      <Link href="/admin/login" className="inline-block font-semibold text-navy underline">Voltar ao login</Link>
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-center font-title text-3xl text-navy">Recuperar senha</h1>
      <p className="text-center text-sm text-muted">Digite seu e-mail e enviaremos um link para criar uma nova senha.</p>
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" type="email" className="field" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-full bg-navy py-3 font-semibold text-white shadow-pill disabled:opacity-60">
        {loading ? "Enviando…" : "Enviar link"}
      </button>
      <p className="text-center text-sm"><Link href="/admin/login" className="font-semibold text-navy underline">Voltar ao login</Link></p>
    </form>
  );
}
