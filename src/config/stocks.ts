// Tokenized stocks a token can pair against, per chain. This is the allowlist the launcher, the params endpoint
// and the verifier all read, so a pair that is not here cannot be launched or recorded.
//
// The seed below is a handful of Robinhood Stock Tokens on Robinhood Chain (4663). Every entry is the canonical
// BeaconProxy from Robinhood's registry (GET https://api.robinhood.com/rhj/assets, chainId 4663 deployments) with
// its Chainlink USD feed on the same chain. Whetstone's public indexer config (doppler-indexer,
// src/config/chains/robinhood.ts) lists the same tokens with the same feeds. Verify any token you add with
// `symbol()`, `name()` and `decimals()` on chain before trusting it: lookalike tokens exist.
//
// Logos live at public/stocks/<TICKER>.png. An empty logo falls back to a colored initials circle in the UI.
// Every Robinhood Stock Token is an 18-decimal ERC-20; on-chain name() is "<Company> • Robinhood Token".

import type { Stock } from "./stocks-types"
export type { Stock, Issuer } from "./stocks-types"

export type ChainStocks = {
  chainId: number
  key: 'robinhood'
  name: string
  stocks: Stock[]
}

export const ROBINHOOD_STOCKS: Stock[] = [
  { ticker: 'AAPL', name: "Apple", address: '0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9', logo: '/stocks/AAPL.png', decimals: 18, issuer: 'robinhood', kind: 'stock', chainlinkFeed: '0x6B22A786bAa607d76728168703a39Ea9C99f2cD0' },
  { ticker: 'AMZN', name: "Amazon", address: '0x12f190a9F9d7D37a250758b26824B97CE941bF54', logo: '/stocks/AMZN.png', decimals: 18, issuer: 'robinhood', kind: 'stock', chainlinkFeed: '0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C' },
  { ticker: 'GOOGL', name: "Alphabet", address: '0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3', logo: '/stocks/GOOGL.png', decimals: 18, issuer: 'robinhood', kind: 'stock', chainlinkFeed: '0xF6f373a037c30F0e5010d854385cA89185AE638b' },
  { ticker: 'META', name: "Meta", address: '0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35', logo: '/stocks/META.png', decimals: 18, issuer: 'robinhood', kind: 'stock', chainlinkFeed: '0x7C38C00C30BEe9378381E7B6135d7283356D71b1' },
  { ticker: 'MSFT', name: "Microsoft", address: '0xe93237C50D904957Cf27E7B1133b510C669c2e74', logo: '/stocks/MSFT.png', decimals: 18, issuer: 'robinhood', kind: 'stock', chainlinkFeed: '0x45C3C877C15E6BA2EBB19eA114Ea508d14C1Af2E' },
  { ticker: 'NVDA', name: "NVIDIA", address: '0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC', logo: '/stocks/NVDA.png', decimals: 18, issuer: 'robinhood', kind: 'stock', chainlinkFeed: '0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15' },
  { ticker: 'TSLA', name: "Tesla", address: '0x322F0929c4625eD5bAd873c95208D54E1c003b2d', logo: '/stocks/TSLA.png', decimals: 18, issuer: 'robinhood', kind: 'stock', chainlinkFeed: '0x4A1166a659A55625345e9515b32adECea5547C38' },
  { ticker: 'SPY', name: "SPDR S&P 500 ETF", address: '0x117cc2133c37B721F49dE2A7a74833232B3B4C0C', logo: '/stocks/SPY.png', decimals: 18, issuer: 'robinhood', kind: 'etf', chainlinkFeed: '0x319724394D3A0e3669269846abE664Cd621f9f6A' },
]

export const STOCKS: ChainStocks[] = [
  { chainId: 4663, key: 'robinhood', name: 'Robinhood Chain', stocks: ROBINHOOD_STOCKS },
]

export default STOCKS

/** Stocks launchable on a chain (`available: false` entries excluded). */
export function stocksFor(chainId: number): Stock[] {
  return (STOCKS.find((c) => c.chainId === chainId)?.stocks ?? []).filter((s) => s.available !== false)
}

/** Look a stock up by address or ticker. Returns undefined for anything not on the allowlist. */
export function findStock(chainId: number, addressOrTicker: string): Stock | undefined {
  const a = (addressOrTicker ?? '').toLowerCase()
  return stocksFor(chainId).find((s) => s.address.toLowerCase() === a || s.ticker.toLowerCase() === a)
}
