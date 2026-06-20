// Compact monochrome icon set approximating Calibre-Web caliBlur glyphs.
// stroke = currentColor. Swap for Font Awesome later for exact parity if needed.
import type { SVGProps } from "react";

const P: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  back: "M15 6l-6 6 6 6",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-3.5-3.5",
  devices: "M4 6h10v8H4zM16 9h4v8h-4zM7 18h4",
  activity: "M3 12h4l2 6 4-14 2 8h6",
  sync: "M4 9a8 8 0 0114-4l2 2M20 15a8 8 0 01-14 4l-2-2M18 3v4h-4M6 21v-4h4",
  wrench: "M14 6a4 4 0 00-5 5l-6 6 2 2 6-6a4 4 0 005-5l-2 2-2-2 2-2z",
  columns: "M4 4h7v16H4zM13 4h7v16h-7z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  caret: "M6 9l6 6 6-6",
  book: "M5 4h11a2 2 0 012 2v14H7a2 2 0 01-2-2zM18 20H7a2 2 0 00-2 2",
  fire: "M12 3c1 4-3 5-3 9a3 3 0 006 0c0-2-1-3-1-3 2 1 3 3 3 5a5 5 0 11-10 0c0-5 5-6 5-11z",
  download: "M12 3v12M7 11l5 5 5-5M5 20h14",
  star: "M12 3l2.6 5.6 6 .6-4.5 4 1.3 6-5.4-3-5.4 3 1.3-6-4.5-4 6-.6z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeSlash: "M2 12s4-7 10-7c2 0 3.6.6 5 1.4M22 12s-4 7-10 7c-2 0-3.6-.6-5-1.4M4 4l16 16",
  shuffle: "M3 6h4l10 12h4M3 18h4l3-3.5M17 6h4M14 9.5L17 6M17 18l4-4-4-4",
  tag: "M3 12l8-8h7v7l-8 8zM15.5 8.5h.01",
  bookmark: "M6 4h12v16l-6-4-6 4z",
  text: "M5 6h14M9 6v12M15 6v12",
  flag: "M5 21V4h12l-2 4 2 4H5",
  file: "M7 3h7l4 4v14H7zM14 3v4h4",
  archive: "M4 7h16v3H4zM6 10v10h12V10M9 13h6",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  plus: "M12 5v14M5 12h14",
  folder: "M3 6h6l2 2h10v12H3z",
  trash: "M5 7h14M9 7V4h6v3M6 7l1 14h10l1-14",
  pencil: "M4 20h4L20 8l-4-4L4 16z",
  gear: "M12 9a3 3 0 100 6 3 3 0 000-6zM12 2l1.5 3 3.3-.6.7 3.3 3 1.5-1.8 2.8L21 18l-3 .8-1 3.2-3-1-3 1-1-3.2L7 18l.6-3.7L6 11.5 9 10l.7-3.3L13 7.3z",
};

export function Icon({ name, size = 18, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d={P[name] ?? P.book} />
    </svg>
  );
}
