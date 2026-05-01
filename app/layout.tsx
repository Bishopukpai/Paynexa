import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers'

export const metadata: Metadata = {
  title: "Paynexa",
  description: "Web3 subscription payment platform",
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