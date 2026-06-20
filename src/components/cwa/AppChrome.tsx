"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";

// Renders the caliBlur app chrome (top bar + sidebar) around the page, EXCEPT on
// the full-screen reader route, which owns the whole viewport (like CWA's reader).
export function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isReader = path.endsWith("/read");

  if (isReader) return <>{children}</>;

  return (
    <>
      <TopBar />
      <div className="flex">
        <SideNav />
        <main className="min-h-[calc(100vh-52px)] min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
