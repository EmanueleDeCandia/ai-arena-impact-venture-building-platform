import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Impact Forge — Piattaforma di Impact Venture Building",
  description:
    "System of Creation & Orchestration: dal bisogno territoriale alla venture finanziabile. Blended finance, underwriting d'impatto, MRV e moltiplicatore economico locale.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
