import { LoginForm } from "./LoginForm";

const ERRORS: Record<string, string> = {
  "sem-permissao": "Sua conta não possui permissão de acesso ao painel.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string; erro?: string; senha?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="font-display text-4xl font-medium">Entrar no painel</h1>
      <p className="mt-2 text-sm text-ink/60">Use o e-mail e a senha cadastrados pela administração.</p>
      {sp.erro && ERRORS[sp.erro] && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{ERRORS[sp.erro]}</p>}
      {sp.senha === "atualizada" && (
        <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Senha atualizada. Entre com a nova senha.</p>
      )}
      <LoginForm redirect={sp.redirect ?? "/admin"} />
    </>
  );
}
