"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";

// caliBlur app chrome (top bar + sidebar) around the page, EXCEPT the full-screen
// reader. Sidebar is fixed on desktop and an off-canvas drawer on mobile/tablet.
export function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  if (path.endsWith("/read")) return <>{children}</>;

  return (
    <>
      <TopBar onMenu={() => setNavOpen((v) => !v)} />
      <div className="flex">
        <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="min-h-[calc(100vh-52px)] min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
