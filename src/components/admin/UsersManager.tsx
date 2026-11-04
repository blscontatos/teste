"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";
import type { Profile } from "@/lib/types";
import { createTeamUser, updateTeamUser } from "@/app/admin/actions";
import { useToast } from "./Toast";

export function UsersManager({ users, meId, serviceConfigured }: { users: Profile[]; meId: string; serviceConfigured: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ full_name: "", email: "", role: "corretor" as "admin" | "corretor", password: "" });

  const genPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const arr = crypto.getRandomValues(new Uint32Array(14));
    setForm((f) => ({ ...f, password: Array.from(arr, (n) => chars[n % chars.length]).join("") + "7" }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="overflow-hidden rounded-[24px] border border-line bg-white">
        <ul className="divide-y divide-line">
          {users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-gold-light">{(u.full_name || u.email || "?").charAt(0).toUpperCase()}</span>
                <div>
                  <p className="font-semibold">
                    {u.full_name || "—"} {u.id === meId && <span className="text-xs text-stone">(você)</span>}
                  </p>
                  <p className="text-xs text-stone">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="field min-h-10 w-40 py-2 text-sm"
                  value={u.role ?? ""}
                  disabled={u.id === meId || pending}
                  onChange={(e) =>
                    start(async () => {
                      const r = await updateTeamUser(u.id, { role: e.target.value as "admin" | "corretor" });
                      if (r.ok) toast("ok", "Permissão atualizada.");
                      else toast("error", r.error);
                      router.refresh();
                    })
                  }
                >
                  {!u.role && <option value="">Sem acesso</option>}
                  <option value="admin">Administrador</option>
                  <option value="corretor">Corretor</option>
                </select>
                <button
                  type="button"
                  disabled={u.id === meId || pending}
                  className={`btn-sm btn ${u.active ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"}`}
                  onClick={() =>
                    start(async () => {
                      const r = await updateTeamUser(u.id, { active: !u.active });
                      if (r.ok) toast("ok", u.active ? "Acesso desativado." : "Acesso reativado.");
                      else toast("error", r.error);
                      router.refresh();
                    })
                  }
                >
                  {u.active ? "Ativo" : "Inativo"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form
        className="h-fit space-y-4 rounded-[24px] border border-line bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await createTeamUser(form);
            if (r.ok) {
              toast("ok", r.message ?? "Usuário criado.");
              setForm({ full_name: "", email: "", role: "corretor", password: "" });
              router.refresh();
            } else toast("error", r.error);
          });
        }}
      >
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <UserPlus className="h-5 w-5 text-gold-deep" /> Novo usuário
        </h2>
        {!serviceConfigured && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Configure a variável SUPABASE_SERVICE_ROLE_KEY no servidor para habilitar o cadastro de usuários.</p>
        )}
        <label className="block">
          <span className="field-label">Nome</span>
          <input className="field" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </label>
        <label className="block">
          <span className="field-label">E-mail</span>
          <input className="field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="field-label">Nível de acesso</span>
          <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "corretor" })}>
            <option value="corretor">Corretor / dono do site</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <label className="block">
          <span className="field-label flex justify-between">
            Senha provisória
            <button type="button" className="font-semibold text-gold-deep" onClick={genPassword}>
              Gerar
            </button>
          </span>
          <input className="field font-mono" required minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button type="submit" className="btn-dark w-full" disabled={pending || !serviceConfigured}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Criar acesso
        </button>
      </form>
    </div>
  );
}
