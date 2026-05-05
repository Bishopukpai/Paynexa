import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers'

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
         <Providers>{children}</Providers>
      </body>
    </html>
  );
}