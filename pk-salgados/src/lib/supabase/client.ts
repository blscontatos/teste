"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Cliente do navegador (painel e envio da foto de inspiração). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
