
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nellux Property Search Engine",
  description: "Sistem pencarian dan manajemen properti Nellux Property",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
