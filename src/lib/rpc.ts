import { createPublicClient, fallback, http, type Chain, type PublicClient } from "viem";
import { robinhoodChain } from "@/config/chains";

/**
 * One resilient public client per chain. Robinhood's public RPC rate-limits bursts and rejects
 * requests without a User-Agent, so reads go through a fallback list with retries and every request
 * carries a User-Agent. Set NEXT_PUBLIC_RPC_USER_AGENT to your own app name.
 */
const ROBINHOOD_RPCS = [
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL,
  "https://rpc.mainnet.chain.robinhood.com",
  "https://robinhood-rpc.publicnode.com",
  "https://robinhood.api.pocket.network",
].filter((u): u is string => Boolean(u));

export const RPC_USER_AGENT = process.env.NEXT_PUBLIC_RPC_USER_AGENT || "launch-lab-starter";
const UA = { headers: { "user-agent": RPC_USER_AGENT } };

export function transportFor(chain: Chain) {
  const opts = { fetchOptions: UA, retryCount: 2, retryDelay: 250, timeout: 12_000 } as const;
  if (chain.id === robinhoodChain.id) {
    return fallback(ROBINHOOD_RPCS.map((u) => http(u, opts)), { retryCount: 1 });
  }
  const urls = [...chain.rpcUrls.default.http];
  return fallback([...new Set(urls)].map((u) => http(u, opts)), { retryCount: 1 });
}

const cache = new Map<number, PublicClient>();
export function publicClientFor(chain: Chain): PublicClient {
  let pc = cache.get(chain.id);
  if (!pc) {
    pc = createPublicClient({ chain, transport: transportFor(chain), batch: { multicall: true } }) as PublicClient;
    cache.set(chain.id, pc);
  }
  return pc;
}
