import Image from "next/image";
import type { DynamicBlock } from "@/lib/dynamic-blocks";

type DynamicBlocksProps = {
  blocks: DynamicBlock[];
  label: string;
};

export function DynamicBlocks({ blocks, label }: DynamicBlocksProps) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {blocks.map((block) => {
        const listItems = (block.lineItems ?? "")
          .split(/\r?\n/)
          .map((item: string) => item.trim())
          .filter(Boolean);

        return (
          <article key={block.id} className="card border-cyan-500/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{label}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">{block.title}</h3>

            {block.blockType === "IMAGE" && block.imageUrl ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/70 bg-slate-900/80">
                <Image
                  src={block.imageUrl}
                  alt={block.title}
                  width={960}
                  height={320}
                  className="h-44 w-full object-cover"
                />
              </div>
            ) : null}

            {block.blockType === "LIST" ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {listItems.map((item: string) => (
                  <li key={item} className="rounded-md border border-slate-700/70 bg-slate-900/60 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{block.content}</p>
            )}
          </article>
        );
      })}
    </section>
  );
}
