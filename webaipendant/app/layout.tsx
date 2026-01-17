import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Using Outfit for headings, Inter for body
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Pendant | Raspberry Pi Wearable Manager",
  description:
    "A premium mobile interface for your Raspberry Pi Zero wearable pendant.",
};

// ... unchanged imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-[#FAFAFA] text-neutral-900 overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
