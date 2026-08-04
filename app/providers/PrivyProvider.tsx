// app/providers/PrivyProvider.tsx
'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['google', 'email', 'apple', 'twitter'],
        appearance: {
          theme: 'light',
          accentColor: '#2563eb',
          logo: 'https://your-domain.com/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}