"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GripVertical, ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import type { PropertyImage } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { deleteImage, registerImages, reorderImages, setCoverImage } from "@/app/admin/actions";
import { optimizeImage } from "./imageUtils";
import { useToast } from "../Toast";

const MAX_FILE_MB = 25;

export function PhotosStep({
  propertyId,
  images,
  setImages,
}: {
  propertyId: string;
  images: PropertyImage[];
  setImages: (fn: (prev: PropertyImage[]) => PropertyImage[]) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const sorted = [...images].sort((a, b) => a.position - b.position);

  async function upload(files: FileList | File[]) {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const tooBig = list.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) return toast("error", `A foto ${tooBig.name} passa de ${MAX_FILE_MB} MB.`);
    const supabase = createClient();
    setUploading({ done: 0, total: list.length });
    const uploaded: { storage_path: string; url: string; width: number; height: number }[] = [];
    try {
      for (const file of list) {
        const { blob, width, height, type } = await optimizeImage(file);
        const ext = type === "image/webp" ? "webp" : "jpg";
        const path = `properties/${propertyId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-media").upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: false });
        if (error) throw new Error(`Falha ao enviar ${file.name}: ${error.message}`);
        uploaded.push({ storage_path: path, url: "", width, height });
        setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
      }
      const r = await registerImages(propertyId, uploaded);
      if (!r.ok) throw new Error(r.error);
      setImages((prev) => [...prev, ...(r.data ?? [])]);
      toast("ok", `${uploaded.length} ${uploaded.length === 1 ? "foto enviada" : "fotos enviadas"}.`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro no envio.");
      if (uploaded.length) {
        // fotos enviadas antes do erro também são registradas
        const r = await registerImages(propertyId, uploaded);
        if (r.ok) setImages((prev) => [...prev, ...(r.data ?? [])]);
      }
    } finally {
      setUploading(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function persistOrder(next: PropertyImage[]) {
    const withPos = next.map((img, i) => ({ ...img, position: i }));
    setImages(() => withPos);
    const r = await reorderImages(propertyId, withPos.map((i) => i.id));
    if (!r.ok) toast("error", r.error);
  }

  function move(id: string, delta: number) {
    const idx = sorted.findIndex((i) => i.id === id);
    const to = idx + delta;
    if (to < 0 || to >= sorted.length) return;
    const next = [...sorted];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    persistOrder(next);
  }

  async function makeCover(id: string) {
    setImages((prev) => prev.map((i) => ({ ...i, is_cover: i.id === id })));
    const r = await setCoverImage(propertyId, id);
    if (r.ok) toast("ok", "Foto principal definida.");
    else toast("error", r.error);
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta foto?")) return;
    const removed = images.find((i) => i.id === id);
    setImages((prev) => {
      const rest = prev.filter((i) => i.id !== id);
      if (removed?.is_cover && rest.length) {
        const first = [...rest].sort((a, b) => a.position - b.position)[0];
        return rest.map((i) => ({ ...i, is_cover: i.id === first.id }));
      }
      return rest;
    });
    const r = await deleteImage(propertyId, id);
    if (!r.ok) toast("error", r.error);
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDropActive(true);
          }
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDropActive(false);
          upload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed p-10 text-center transition ${
          dropActive ? "border-gold bg-gold-pale/40" : "border-line bg-sand/50"
        }`}
      >
        {uploading ? (
          <>
            <LoaderCircle className="h-10 w-10 animate-spin text-gold-deep" />
            <p className="mt-4 font-semibold">
              Otimizando e enviando {uploading.done} de {uploading.total}…
            </p>
            <div className="mt-3 h-1.5 w-64 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-gold transition-all" style={{ width: `${(uploading.done / uploading.total) * 100}%` }} />
            </div>
          </>
        ) : (
          <>
            <ImagePlus className="h-10 w-10 text-gold-deep" strokeWidth={1.3} />
            <p className="mt-4 font-semibold">Arraste as fotografias aqui</p>
            <p className="mt-1 text-sm text-ink/60">JPG, PNG ou WebP — até {MAX_FILE_MB} MB cada. As imagens são otimizadas automaticamente.</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="btn-dark mt-5">
              Selecionar fotos
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
          multiple
          className="sr-only"
          data-testid="photo-input"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {sorted.length > 0 && (
        <>
          <p className="text-sm text-ink/60">
            Arraste para reordenar (ou use as setas). A foto marcada com <Star className="inline h-3.5 w-3.5 fill-gold text-gold" /> é a principal.
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-testid="photo-grid">
            {sorted.map((img, i) => (
              <li
                key={img.id}
                draggable
                onDragStart={() => setDragId(img.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === img.id) return;
                  const next = sorted.filter((x) => x.id !== dragId);
                  const target = next.findIndex((x) => x.id === img.id);
                  next.splice(target, 0, sorted.find((x) => x.id === dragId)!);
                  setDragId(null);
                  persistOrder(next);
                }}
                className={`group relative overflow-hidden rounded-2xl border bg-white transition ${img.is_cover ? "border-gold ring-2 ring-gold/40" : "border-line"} ${dragId === img.id ? "opacity-40" : ""}`}
              >
                <div className="relative aspect-[4/3] bg-sand">
                  <Image src={img.url} alt="" fill sizes="300px" className="object-cover" />
                  <span className="absolute top-2 left-2 grid h-7 w-7 cursor-grab place-items-center rounded-full bg-white/90 text-ink/60">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  {img.is_cover && (
                    <span className="chip absolute top-2 right-2 bg-gold text-ink">
                      <Star className="h-3 w-3 fill-ink" /> Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  <div className="flex">
                    <IconBtn label="Mover para trás" onClick={() => move(img.id, -1)} disabled={i === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Mover para frente" onClick={() => move(img.id, 1)} disabled={i === sorted.length - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </IconBtn>
                  </div>
                  <div className="flex">
                    {!img.is_cover && (
                      <IconBtn label="Definir como principal" onClick={() => makeCover(img.id)}>
                        <Star className="h-4 w-4" />
                      </IconBtn>
                    )}
                    <IconBtn label="Excluir foto" onClick={() => remove(img.id)} danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-lg transition disabled:opacity-30 ${danger ? "text-red-700 hover:bg-red-50" : "text-ink/70 hover:bg-sand"}`}
    >
      {children}
    </button>
  );
}
