"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";
import { ServerStatus } from "./ServerStatus";

// caliBlur app chrome (top bar + sidebar) around the page, EXCEPT the full-screen
// reader and the standalone setup wizard.
export function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  if (path.endsWith("/read") || path.startsWith("/setup")) return <>{children}</>;

  return (
    <>
      <TopBar onMenu={() => setNavOpen((v) => !v)} />
      <div className="flex">
        <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="min-h-[calc(100vh-52px)] min-w-0 flex-1">
          <ServerStatus />
          {children}
        </main>
      </div>
    </>
  );
}
