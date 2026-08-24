import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

import PwaRegister from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "Taui Te Ora",

  description:
    "Plateforme d'adoption animale en Polynésie française.",

  applicationName: "Taui Te Ora",

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    title: "Taui Te Ora",
    statusBarStyle: "default",
  },

  icons: {
    icon: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/icon-192.png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ef8196",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}