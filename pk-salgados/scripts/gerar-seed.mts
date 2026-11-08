// Gera supabase/seed.sql a partir de src/lib/defaults.ts.
// Uso: npm run seed:gerar   (Node 22.18+ executa TypeScript direto)
import { writeFileSync } from "node:fs";
import {
  defaultCategories, defaultContent, defaultProducts, defaultPromotions,
  defaultSettings, defaultTestimonials,
} from "../src/lib/defaults.ts";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return `array[${v.map(q).join(", ")}]::text[]`;
  if (typeof v === "object") return `${q(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const insert = (table: string, rows: any[]) => {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const values = rows.map((r) => `  (${cols.map((c) => q(r[c])).join(", ")})`).join(",\n");
  return `insert into public.${table} (${cols.join(", ")}) values\n${values}\non conflict do nothing;\n\n`;
};
// arrays vazios precisam de tipo explícito
const arr = (a: string[]) => (a.length ? a : null);

let sql = `-- Gerado automaticamente por scripts/gerar-seed.mts — não edite à mão.\n-- Conteúdo inicial do site (folder da PK Salgados).\n\n`;
sql += insert("settings", [{ id: 1, ...defaultSettings }]);
sql += insert("site_content", Object.entries(defaultContent).map(([key, data]) => ({ key, data })));
sql += insert("categories", defaultCategories);
sql += insert("products", defaultProducts.map(({ portions: _p, flavors: _f, ...p }) => ({ ...p, images: arr(p.images) ?? [] })));
sql += insert("product_portions", defaultProducts.flatMap((p) => p.portions));
sql += insert("product_flavors", defaultProducts.flatMap((p) => p.flavors));
sql += insert("promotions", defaultPromotions.map(({ items: _i, ...p }) => p));
sql += insert("promotion_items", defaultPromotions.flatMap((p) => p.items));
sql += insert("testimonials", defaultTestimonials);
sql = sql.replace(/array\[\]::text\[\]/g, "'{}'::text[]");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log("supabase/seed.sql gerado.");
