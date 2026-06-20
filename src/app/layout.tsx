import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AppChrome } from "@/components/cwa/AppChrome";

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
          <AppChrome>{children}</AppChrome>
        </Suspense>
      </body>
    </html>
  );
}
