"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState, useTransition } from "react";
import { ImagePlus, LoaderCircle, Lock, Save, Trash2 } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { updateOwnName, updatePasswordAction, updateSettings } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { optimizeImage } from "./wizard/imageUtils";
import { whatsappLink } from "@/lib/format";
import { useToast } from "./Toast";

export function SettingsForm({ settings, isAdmin, profileName }: { settings: SiteSettings; isAdmin: boolean; profileName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState(settings);
  const [pending, start] = useTransition();
  const set = (k: keyof SiteSettings, v: string) => setS((cur) => ({ ...cur, [k]: v }));

  const save = (keys: (keyof SiteSettings)[]) =>
    start(async () => {
      const patch = Object.fromEntries(keys.map((k) => [k, String(s[k] ?? "")]));
      const r = await updateSettings(patch);
      if (r.ok) {
        toast("ok", r.message ?? "Salvo.");
        router.refresh();
      } else toast("error", r.error);
    });

  return (
    <div className="space-y-6">
      <Card
        title="WhatsApp e contato"
        description={isAdmin ? "Número usado no botão flutuante, no cabeçalho e no botão “Tenho interesse”." : "Somente administradores podem alterar estes dados."}
        onSave={isAdmin ? () => save(["whatsapp_number", "whatsapp_message", "contact_phone", "contact_email", "creci", "address", "instagram_url"]) : undefined}
        pending={pending}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Número do WhatsApp (DDI + DDD + número)" value={s.whatsapp_number} onChange={(v) => set("whatsapp_number", v)} disabled={!isAdmin} placeholder="5521999999999" inputMode="tel" testId="settings-whatsapp" />
          <Field label="Telefone exibido no site" value={s.contact_phone} onChange={(v) => set("contact_phone", v)} disabled={!isAdmin} placeholder="(21) 99999-9999" />
          <Field label="E-mail de contato" value={s.contact_email} onChange={(v) => set("contact_email", v)} disabled={!isAdmin} type="email" />
          <Field label="CRECI" value={s.creci} onChange={(v) => set("creci", v)} disabled={!isAdmin} />
          <Field label="Região / endereço exibido" value={s.address} onChange={(v) => set("address", v)} disabled={!isAdmin} className="sm:col-span-2" />
          <Field label="Instagram (link)" value={s.instagram_url} onChange={(v) => set("instagram_url", v)} disabled={!isAdmin} placeholder="https://instagram.com/…" className="sm:col-span-2" />
          <label className="block sm:col-span-2">
            <span className="field-label">Mensagem inicial do WhatsApp</span>
            <textarea className="field min-h-24" value={s.whatsapp_message} onChange={(e) => set("whatsapp_message", e.target.value)} disabled={!isAdmin} maxLength={500} />
          </label>
        </div>
        {s.whatsapp_number && (
          <a href={whatsappLink(s.whatsapp_number, s.whatsapp_message)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-gold-deep">
            Testar link do WhatsApp →
          </a>
        )}
      </Card>

      <Card title="Página inicial" description="Textos da seção principal. A foto e o card mudam automaticamente conforme o imóvel em destaque." onSave={() => save(["hero_title", "hero_subtitle", "hero_image_url"])} pending={pending}>
        <div className="space-y-5">
          <Field label="Título principal" value={s.hero_title} onChange={(v) => set("hero_title", v)} maxLength={160} />
          <label className="block">
            <span className="field-label">Texto complementar</span>
            <textarea className="field min-h-24" value={s.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} maxLength={400} />
          </label>
          <ImageSetting label="Foto de capa padrão (usada quando não houver imóvel em destaque)" value={s.hero_image_url} onChange={(v) => set("hero_image_url", v)} folder="hero" />
        </div>
      </Card>

      <Card title="Sobre a empresa" description="Texto institucional exibido na página inicial e na página Sobre. Separe parágrafos com uma linha em branco." onSave={() => save(["about_title", "about_text", "about_image_url"])} pending={pending}>
        <div className="space-y-5">
          <Field label="Título" value={s.about_title} onChange={(v) => set("about_title", v)} maxLength={160} />
          <label className="block">
            <span className="field-label">Texto</span>
            <textarea className="field min-h-48" value={s.about_text} onChange={(e) => set("about_text", e.target.value)} maxLength={4000} />
          </label>
          <ImageSetting label="Fotografia da seção Sobre" value={s.about_image_url} onChange={(v) => set("about_image_url", v)} folder="about" allowCutout />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCard name={profileName} />
        <PasswordCard />
      </div>
    </div>
  );
}

function Card({ title, description, children, onSave, pending }: { title: string; description?: string; children: React.ReactNode; onSave?: () => void; pending?: boolean }) {
  return (
    <section className="rounded-[24px] border border-line bg-white p-6 sm:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-display text-2xl">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm text-ink/60">{description}</p>}
        </div>
        {onSave && (
          <button type="button" className="btn-dark btn-sm shrink-0" onClick={onSave} disabled={pending}>
            {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
  testId,
  ...rest
}: { label: string; value: string; onChange: (v: string) => void; testId?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      <input {...rest} data-testid={testId} className="field disabled:bg-sand/60 disabled:text-ink/50" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function ImageSetting({
  label,
  value,
  onChange,
  folder,
  allowCutout = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  folder: string;
  allowCutout?: boolean;
}) {
  const [cutout, setCutout] = useState(value.includes("/site/retrato-"));
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    try {
      const { blob, type } = await optimizeImage(file, 2400);
      const prefix = allowCutout && cutout ? "retrato" : folder;
      const path = `site/${prefix}-${crypto.randomUUID()}.${type === "image/webp" ? "webp" : "jpg"}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from("property-media").upload(path, blob, { contentType: type, cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("property-media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast("ok", "Imagem enviada. Clique em Salvar para aplicar.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sand sm:w-48">
          {value ? <Image src={value} alt="" fill sizes="192px" className="object-cover" /> : <div className="grid h-full place-items-center text-xs text-stone">Sem imagem</div>}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Enviar imagem
          </button>
          {value && (
            <button type="button" className="btn-ghost btn-sm text-red-700" onClick={() => onChange("")}>
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </button>
          )}
        </div>
        <input ref={ref} type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      {allowCutout && (
        <label className="mt-3 flex items-start gap-2 text-sm text-ink/70">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#b8955a]" checked={cutout} onChange={(e) => setCutout(e.target.checked)} />
          <span>
            Foto recortada (sem fundo, em PNG). Marque antes de enviar: o retrato é exibido sobre um painel dourado com o nome do corretor.
          </span>
        </label>
      )}
    </div>
  );
}

function ProfileCard({ name }: { name: string }) {
  const toast = useToast();
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [pending, start] = useTransition();
  return (
    <Card
      title="Meu perfil"
      onSave={() =>
        start(async () => {
          const r = await updateOwnName(value);
          if (r.ok) {
            toast("ok", "Nome atualizado.");
            router.refresh();
          } else toast("error", r.error);
        })
      }
      pending={pending}
    >
      <Field label="Nome exibido no painel" value={value} onChange={setValue} maxLength={120} />
    </Card>
  );
}

function PasswordCard() {
  const [state, action, pending] = useActionState(updatePasswordAction, {});
  return (
    <section className="rounded-[24px] border border-line bg-white p-6 sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-2xl">
        <Lock className="h-5 w-5 text-gold-deep" /> Alterar minha senha
      </h2>
      <form action={action} className="mt-5 space-y-4">
        <input name="password" type="password" minLength={10} required placeholder="Nova senha (mín. 10 caracteres)" autoComplete="new-password" className="field" />
        <input name="confirm" type="password" minLength={10} required placeholder="Confirmar nova senha" autoComplete="new-password" className="field" />
        {state.error && <p className="text-sm text-red-700">{state.error}</p>}
        {state.ok && <p className="text-sm text-emerald-700">Senha alterada com sucesso.</p>}
        <button type="submit" className="btn-dark btn-sm" disabled={pending}>
          {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} Atualizar senha
        </button>
      </form>
    </section>
  );
}
