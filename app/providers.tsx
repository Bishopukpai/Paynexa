"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { http, WagmiProvider } from "wagmi";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia } from 'wagmi/chains' // 🎯 Base only!
import { useState } from "react";
import { SessionProvider } from "next-auth/react";

const baseSepoliaRpc = process.env.NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_URL;
const baseMainnetRpc = process.env.NEXT_PUBLIC_ALCHEMY_BASE_MAINNET_URL;

export const config = getDefaultConfig({
  appName: "Paynexa",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [base, baseSepolia], // ⛓️ Seamless toggle between L2 Testnet & L2 Mainnet
  ssr: true,
  transports: {
    [baseSepolia.id]: http(baseSepoliaRpc),
    [base.id]: http(baseMainnetRpc),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <SessionProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}