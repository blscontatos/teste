"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenha() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As senhas não são iguais.");
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError("Não foi possível salvar. Peça um novo link de recuperação.");
    router.replace("/admin");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-center font-title text-3xl text-navy">Nova senha</h1>
      <div>
        <label className="label" htmlFor="s1">Nova senha</label>
        <input id="s1" type="password" className="field" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="hint">Mínimo de 8 caracteres.</p>
      </div>
      <div>
        <label className="label" htmlFor="s2">Repita a nova senha</label>
        <input id="s2" type="password" className="field" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-full bg-navy py-3 font-semibold text-white shadow-pill disabled:opacity-60">
        {loading ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
