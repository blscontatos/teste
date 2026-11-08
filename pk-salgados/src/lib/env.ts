// Variáveis de ambiente usadas no site.
export const env = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

/** true quando o Supabase está configurado. Sem ele o site mostra o conteúdo inicial (modo demonstração). */
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey);
