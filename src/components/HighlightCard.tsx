import Link from "next/link";
import type { Highlight, HighlightColor } from "@/lib/types";

const COLOR: Record<HighlightColor, string> = {
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  pink: "#ec4899",
  orange: "#f97316",
};

export function HighlightCard({ h, bookHref }: { h: Highlight; bookHref?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-elev p-4">
      <div className="flex gap-3">
        <span
          className="mt-1 h-full w-1 shrink-0 rounded-full"
          style={{ backgroundColor: COLOR[h.color] }}
        />
        <div className="min-w-0">
          <p className="text-sm leading-relaxed">«{h.text}»</p>
          {h.note && (
            <p className="mt-2 rounded-md bg-bg-elev2 px-3 py-2 text-sm text-text-dim">
              📝 {h.note}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-text-dim">
            <span>{new Date(h.createdAt).toLocaleDateString("ru")}</span>
            {bookHref && (
              <Link href={bookHref} className="text-accent hover:underline">
                к книге →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
