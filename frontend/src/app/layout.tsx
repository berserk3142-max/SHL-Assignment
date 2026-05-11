import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "SHL Assessment Advisor — Intelligence, Architected",
  description:
    "AI-powered conversational assistant to help hiring managers find the perfect SHL Individual Test Solutions from the official catalog.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-screen bg-[#0a0a0a] text-white overflow-hidden selection:bg-white/15 selection:text-white">
        {children}
      </body>
    </html>
  );
}
