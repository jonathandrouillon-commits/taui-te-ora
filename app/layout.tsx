import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import "./globals.css";
import BottomNavigation from "./components/ui/BottomNavigation";

export const metadata: Metadata = {
  title: "TAUI TE ORA",
  description: "On ne changera pas le monde, mais on peut changer le leur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-[#f8f4ec]">
        {children}

        <BottomNavigation />
      </body>
    </html>
  );
}