import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CiteCheck · RealDoor",
  description:
    "Renter-side application readiness helper: read documents, explain rules, prepare a packet. Never decides eligibility.",
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
