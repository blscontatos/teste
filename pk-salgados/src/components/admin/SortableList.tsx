"use client";
// Lista que pode ser reordenada arrastando pela "alça" (funciona no celular sem atrapalhar a rolagem).
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  onDrop,
  render,
  className = "space-y-2",
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  onDrop?: () => void; // chamado ao soltar (para salvar a nova ordem)
  render: (item: T) => React.ReactNode;
  className?: string;
}) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className={className}>
      {items.map((item) => (
        <SortableRow key={item.id} item={item} onDrop={onDrop}>
          {render(item)}
        </SortableRow>
      ))}
    </Reorder.Group>
  );
}

function SortableRow<T>({ item, children, onDrop }: { item: T; children: React.ReactNode; onDrop?: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} onDragEnd={onDrop} className="relative flex items-center gap-2 rounded-2xl bg-white p-2.5 shadow-card" whileDrag={{ scale: 1.02, boxShadow: "0 18px 30px -12px rgba(11,35,65,.4)", zIndex: 10 }}>
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="grid h-10 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-navy/40 hover:bg-cream active:cursor-grabbing"
        aria-label="Arraste para mudar a ordem"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </Reorder.Item>
  );
}

/** Salva a nova ordem (sort_order = posição) de uma tabela. */
export async function saveOrder(
  sb: { from: (t: string) => { update: (v: object) => { eq: (c: string, v: string) => PromiseLike<{ error: unknown }> } } },
  table: string,
  ids: string[],
) {
  const results = await Promise.all(ids.map((id, i) => sb.from(table).update({ sort_order: i }).eq("id", id)));
  return !results.some((r) => r.error);
}
