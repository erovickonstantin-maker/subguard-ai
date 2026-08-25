import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Berghaus – offene Arbeiten",
  description:
    "To-do-Liste für die Arbeiten am Serbien Berghaus – Außenbereich, Haus und Technik & Infrastruktur.",
  manifest: "/berghaus.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Berghaus",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function BerghausLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
