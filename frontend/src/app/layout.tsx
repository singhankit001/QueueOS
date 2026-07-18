import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { BackgroundScene } from "@/components/canvas/BackgroundScene";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QueueOS - Premium Queue Management",
  description: "Intelligent queue management platform for modern organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-transparent text-foreground antialiased overflow-x-hidden min-h-screen`}>
        <BackgroundScene />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
