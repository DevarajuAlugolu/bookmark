import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthListener from "@/components/AuthListener";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Bookmark - Save & Organize Your Links",
  description:
    "A simple, real-time bookmark manager. Save, organize, and access your favorite links from anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
