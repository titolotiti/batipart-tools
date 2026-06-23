import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Immo Suite",
  description: "Plateforme d'analyse immobilière — PLU, DVF, Logement neuf",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
