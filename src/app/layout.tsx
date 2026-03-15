import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import WalletProvider from "@/components/layout/WalletProvider";
import { ToastProvider } from "@/components/ui/Toast";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GuidedTour from "@/components/tour/GuidedTour";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FundFlow AI — Autonomous On-Chain Grant Allocator",
  description:
    "AI agent that evaluates funding proposals, verifies humanity, researches viability, and disburses USDC on Solana with full on-chain audit trails.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <WalletProvider>
          <ToastProvider>
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <GuidedTour />
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
