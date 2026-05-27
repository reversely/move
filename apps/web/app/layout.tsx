import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Dance Generator",
  description: "Generate AI-choreographed stick figure dance previews from uploaded songs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
