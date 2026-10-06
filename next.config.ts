import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // /skill.md serves SKILL.md byte for byte at request time, so it has to be traced into the server bundle.
  outputFileTracingIncludes: { "/skill.md": ["./SKILL.md"] },
  // Stock logos (Robinhood), X avatars, and token logos from Dexscreener.
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.robinhood.com" }, { protocol: "https", hostname: "pbs.twimg.com" }, { protocol: "https", hostname: "dd.dexscreener.com" }] },
  // Setup tip: build with webpack (`next build` without `--turbopack`). This webpack hook is where the
  // WalletConnect optional node-only deps are externalised; `@privy-io/wagmi` resolves cleanly on this path.
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
