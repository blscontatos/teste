"use client";
// Envio de imagem com recorte. A foto é otimizada no navegador (WebP) antes de subir
// para o Supabase Storage. PNG com fundo transparente continua PNG (ex.: foto das donas, logo).
import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { AnimatePresence } from "framer-motion";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Btn, Modal, useToast } from "./ui";

async function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

async function cropToBlob(src: string, area: Area | null, keepPng: boolean, maxSide = 1600): Promise<Blob> {
  const img = await loadImage(src);
  const a = area ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
  const scale = Math.min(1, maxSide / Math.max(a.width, a.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(a.width * scale);
  canvas.height = Math.round(a.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, a.x, a.y, a.width, a.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao processar a imagem"))), keepPng ? "image/png" : "image/webp", 0.85),
  );
}

export function ImageUpload({
  value,
  onChange,
  folder,
  aspect = 4 / 3,
  label,
  allowFree = true,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  aspect?: number;
  label?: string;
  allowFree?: boolean;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState("");
  const [isPng, setIsPng] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState<number | undefined>(aspect);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const pick = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Escolha um arquivo de imagem.", "erro");
    if (file.size > 15 * 1024 * 1024) return toast("Imagem muito grande (máx. 15 MB).", "erro");
    setIsPng(file.type === "image/png");
    setSrc(URL.createObjectURL(file));
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setRatio(aspect);
  };

  const upload = async (useCrop: boolean) => {
    setBusy(true);
    try {
      const blob = await cropToBlob(src, useCrop ? area : null, isPng);
      const ext = isPng ? "png" : "webp";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const sb = createClient();
      const { error } = await sb.storage.from("site-images").upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
      if (error) throw error;
      onChange(sb.storage.from("site-images").getPublicUrl(path).data.publicUrl);
      setSrc("");
      toast("Imagem enviada");
    } catch {
      toast("Não foi possível enviar a imagem.", "erro");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      {label && <p className="label">{label}</p>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => input.current?.click()} className="group relative grid h-24 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-navy/20 bg-cream-50 hover:border-gold">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- miniatura no painel
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-7 w-7 text-gold" />
          )}
          <span className="absolute inset-x-0 bottom-0 bg-navy/70 py-0.5 text-center text-[0.65rem] font-semibold text-white opacity-0 transition group-hover:opacity-100">Trocar</span>
        </button>
        <div className="flex flex-col gap-1">
          <Btn variant="outline" onClick={() => input.current?.click()}>{value ? "Trocar imagem" : "Enviar imagem"}</Btn>
          {value && (
            <Btn variant="danger" onClick={() => onChange("")}><Trash2 className="h-4 w-4" /> Remover</Btn>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} aria-label={label ?? "Enviar imagem"} />

      <AnimatePresence>
        {src && (
          <Modal title="Recortar imagem" onClose={() => setSrc("")} wide>
            <div className="relative h-[52vh] overflow-hidden rounded-2xl bg-navy">
              <Cropper image={src} crop={crop} zoom={zoom} aspect={ratio} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} objectFit="contain" />
            </div>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-navy">
                Zoom
                <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[#F6A623]" />
              </label>
              {allowFree && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {[["Padrão", aspect], ["Quadrado", 1], ["Livre", undefined]].map(([l, r]) => (
                    <button key={String(l)} type="button" onClick={() => setRatio(r as number | undefined)} className={`rounded-full px-3 py-1.5 font-semibold ${ratio === r ? "bg-navy text-white" : "bg-white text-navy"}`}>{l as string}</button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Btn variant="ghost" onClick={() => upload(false)} disabled={busy}>Usar sem recortar</Btn>
                <Btn onClick={() => upload(true)} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Recortar e enviar
                </Btn>
              </div>
              {isPng && <p className="hint">PNG com fundo transparente é mantido sem fundo.</p>}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
