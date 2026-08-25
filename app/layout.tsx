import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Échéo — N’oubliez plus ce qui compte",
  description: "Rappels personnels, échéances de groupe et suivi des paiements avec Échéo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className="min-h-full">{children}</body></html>;
}
