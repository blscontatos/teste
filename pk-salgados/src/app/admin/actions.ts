"use server";
// Ações do painel que precisam rodar no servidor.
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";

/** Atualiza o site público na hora, depois de salvar algo no painel. */
export async function revalidateSite() {
  await assertAdmin();
  revalidatePath("/", "layout");
}
