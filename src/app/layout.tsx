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
    <html lang="en">
      <body>
        <Providers>
          <WebNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
