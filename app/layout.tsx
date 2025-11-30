'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from 'next-auth/react';
import { AuthButton } from '@/components/AuthButton';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <header className="flex justify-between items-center px-4 py-3 border-b">
            <a href="/" className="font-bold">🇳🇱 Fiscaal.ai</a>
            <AuthButton />
          </header>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
