import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';
import { PostHogProvider } from '@/components/PostHogProvider'; // Adjust this import path if your provider file is located elsewhere

export const metadata: Metadata = {
  title: "Paynexa | Seamless Crypto Payment Gateway for Businesses",
  description: "Accept USDT and USDC payments with ease. The ultimate Web3 payment solution for modern SaaS.",
  icons: {
    icon: [
      {
        url: "/logo.png", // Path to your file in /public
        href: "/logo.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {/* 🦔 PostHog Analytics sits at the absolute root to capture all pageviews and web traffic */}
        <PostHogProvider>
          <Providers>
            {children}
          </Providers>
        </PostHogProvider>
      </body>
    </html>
  );
}