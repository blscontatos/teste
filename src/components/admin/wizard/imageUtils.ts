/** Redimensiona e converte a foto para WebP no navegador antes do envio (economiza banda e acelera o site). */
export async function optimizeImage(file: File, maxSide = 2400, quality = 0.84): Promise<{ blob: Blob; width: number; height: number; type: string }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`Não foi possível ler a imagem ${file.name}.`);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não suporta o processamento de imagens.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  if (blob && blob.type === "image/webp") return { blob, width, height, type: "image/webp" };
  const jpeg = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!jpeg) throw new Error("Falha ao processar a imagem.");
  return { blob: jpeg, width, height, type: "image/jpeg" };
}
