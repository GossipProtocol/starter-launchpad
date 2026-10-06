"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { WagmiProvider as PlainWagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SUPPORTED_EVM_CHAINS, robinhoodChain } from "@/config/chains";
import { transportFor } from "@/lib/rpc";

/**
 * Privy + wagmi on a custom chain. No paymaster, no smart wallets, no Privy gas sponsorship: the only sponsorship
 * is the server-side relay in src/lib/sponsor.ts. Embedded wallets are plain EOAs. `@privy-io/wagmi` wraps wagmi's
 * provider so Privy's wallets show up as wagmi connectors; `createConfig` here is Privy's, not wagmi's.
 *
 * Setup tip: build with webpack (`next build`, no `--turbopack`). `@privy-io/wagmi` resolves cleanly there.
 */
export const wagmiConfig = createConfig({
  chains: SUPPORTED_EVM_CHAINS,
  transports: {
    [robinhoodChain.id]: transportFor(robinhoodChain),
  },
});

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  if (!PRIVY_APP_ID) {
    // No auth configured: still mount wagmi so read-only hooks work and pages render.
    return (
      <QueryClientProvider client={queryClient}>
        <PlainWagmiProvider config={wagmiConfig}>{children}</PlainWagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["twitter", "wallet"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        supportedChains: [...SUPPORTED_EVM_CHAINS],
        defaultChain: robinhoodChain,
        appearance: {
          theme: "light",
          accentColor: "#4AA8E6",
          logo: "/moji.png",
          walletList: ["detected_wallets", "metamask", "coinbase_wallet", "wallet_connect", "rainbow"],
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
