import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

// Drop Inter — Geist covers sans-serif needs.
// Keep JetBrains Mono for the --font-mono variable used in code/terminal UIs.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Pulse-Ops — Autonomous Career Intelligence",
  description:
    "Pulse-Ops ingests your engineering activity, calculates a verified impact score, and deploys AI agents to scout, tailor, and submit applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geistSans.variable)}>
      <body className={`${geistMono.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster theme="dark" position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
