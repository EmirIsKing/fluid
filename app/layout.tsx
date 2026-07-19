"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { mainnet, base, arbitrum, bsc, xLayer } from "viem/chains";
import '../src/styles.css';
import Providers from './providers';

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PrivyProvider
          appId={privyAppId}
          config={{
            appearance: {
              theme: 'dark',
              accentColor: '#676FFF',
            },
            embeddedWallets: {
              ethereum: {
                createOnLogin: 'users-without-wallets',
              },
            },
            supportedChains: [mainnet, base, arbitrum, bsc, xLayer],
          }}
        >
          <Providers>{children}</Providers>
        </PrivyProvider>
      </body>
    </html>
  );
}
