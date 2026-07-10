import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import "./globals.css";
import BottomNavigation from "./components/BottomNavigation";

export const metadata: Metadata = {
  title: "TAUI TE ORA",
  description: "On ne changera pas le monde, mais on peut changer le leur.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#f8f4ec] pb-28">
        <main>{children}</main>

        <BottomNavigation />
      </body>
    </html>
  );
}