import { defineChain, type Chain } from "viem";

/**
 * Robinhood Chain (chainId 4663), defined by hand because viem does not ship it.
 * RPC + explorer per docs.robinhood.com/chain/connecting (also listed in docs.doppler.lol contract addresses).
 * Gas token is ETH: "Robinhood Chain uses ETH as its native gas token" (Arbitrum Orbit L2 settling to Ethereum).
 * The UI reads the symbol from `nativeCurrency.symbol`, never a hardcoded string.
 * Testnet: chainId 46630, https://rpc.testnet.chain.robinhood.com (no Doppler deployment in the SDK, so every
 * launch here costs real ETH gas).
 *
 * Setup tip: the public RPC rejects requests without a User-Agent header. `src/lib/rpc.ts` sets one on every
 * viem transport, and the viem sketch in SKILL.md tells agents to do the same.
 */
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com",
        "https://robinhood-rpc.publicnode.com",
      ],
    },
  },
  blockExplorers: {
    default: { name: "Robinhood Chain Explorer", url: "https://robinhoodchain.blockscout.com" },
  },
  // Canonical Multicall3 (verified deployed on 4663). The Doppler SDK batches pending-fee reads through it.
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
  testnet: false,
});

export type ChainKey = "robinhood";

export type LaunchChain = {
  key: ChainKey;
  chainId: number;
  name: string;
  short: string;
  emoji: string;
  /** viem chain, only for EVM chains we can launch on */
  viem?: Chain;
  /** Native gas token symbol. Driven from viem nativeCurrency when available. */
  gasSymbol: string;
  /** Minimum native balance we require before enabling LAUNCH (fallback when simulation is unavailable). */
  minGasNative: string;
  /**
   * Chain staging. Only live chains with stock inventory are claimable; the rest render as disabled "soon" pills.
   * Flip this one flag to switch a chain on. Nothing else needs to change.
   */
  live: boolean;
  /**
   * What tokens pair against here. "stock": a tokenized stock from `src/config/stocks.ts`.
   * "weth": the chain's WETH from Doppler's address map, as in every Doppler docs launch example.
   */
  numeraire: "stock" | "weth";
  /** Dexscreener chain slug */
  dexscreenerSlug?: string;
  /** Matcha chain slug */
  matchaSlug?: string;
};

/** Backwards-compatible alias; the code base used this name before the chain list was cut down. */
export type MojiChain = LaunchChain;

/**
 * One chain. Adding a second one is the shape of the capstone: a viem chain definition, a `stocks.ts` entry or a
 * WETH numeraire, the Doppler address map entry (the SDK ships it), and a transport in `providers.tsx`.
 */
export const CHAINS: LaunchChain[] = [
  {
    key: "robinhood",
    chainId: 4663,
    name: "Robinhood Chain",
    short: "Robinhood",
    emoji: "🪶",
    viem: robinhoodChain,
    gasSymbol: robinhoodChain.nativeCurrency.symbol,
    minGasNative: "0.0005",
    live: true,
    numeraire: "stock",
    dexscreenerSlug: "robinhood",
    matchaSlug: "robinhood",
  },
];

export const DEFAULT_CHAIN = CHAINS[0];

export function chainById(chainId: number): LaunchChain | undefined {
  return CHAINS.find((c) => c.chainId === chainId);
}
export function chainByKey(key: ChainKey): LaunchChain {
  return CHAINS.find((c) => c.key === key) ?? DEFAULT_CHAIN;
}

/** EVM chains Privy/wagmi should know about. Robinhood is default. */
export const SUPPORTED_EVM_CHAINS = [robinhoodChain] as const;

/** Chains a launch can actually happen on: live flag AND a viem definition. Stock inventory is checked separately. */
export const LAUNCHABLE_CHAIN_IDS = CHAINS.filter((c) => c.live && c.viem).map((c) => c.chainId);
