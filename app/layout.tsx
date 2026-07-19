"use client";

import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import { evmWalletConnectors } from "@particle-network/connectkit/evm";
import { mainnet, base, arbitrum, bsc, xLayer } from "viem/chains";
import '../src/styles.css';
import Providers from './providers';

const config = createConfig({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
  clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY || process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
  appId: process.env.NEXT_PUBLIC_APP_ID || process.env.NEXT_PUBLIC_PARTICLE_APP_UUID!,
  chains: [mainnet, base, arbitrum, bsc, xLayer],
  walletConnectors: [
    authWalletConnectors(),
    evmWalletConnectors(),
  ],
});

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
        <ConnectKitProvider config={config}>
          <Providers>{children}</Providers>
        </ConnectKitProvider>
      </body>
    </html>
  );
}
