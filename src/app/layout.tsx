// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";
import WebNavbar from "@src/components/navigation/WebNavbar";

export const metadata: Metadata = {
  title: "Admit55",
  description: "MBA profile tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-full">
      <body className="min-h-screen w-full overflow-x-hidden">
        <Providers>
          <WebNavbar />
          <main className="w-full">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
