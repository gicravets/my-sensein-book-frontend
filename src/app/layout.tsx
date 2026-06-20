import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { TopBar } from "@/components/cwa/TopBar";
import { SideNav } from "@/components/cwa/SideNav";

export const metadata: Metadata = {
  title: "My.Sensein.Book",
  description: "Веб-библиотека и читалка My.Sensein.Book (PWA)",
  applicationName: "My.Sensein.Book",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "book" },
};

export const viewport: Viewport = {
  themeColor: "#1c2024",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen">
        <Suspense fallback={<div className="h-[52px] bg-cb-topbar" />}>
          <TopBar />
        </Suspense>
        <div className="flex">
          <Suspense fallback={<div className="hidden w-64 sm:block" />}>
            <SideNav />
          </Suspense>
          <main className="min-h-[calc(100vh-52px)] min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
