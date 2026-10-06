# starter-launchpad

A Doppler multicurve launcher on Robinhood Chain (4663): Privy and wagmi on a custom viem chain, launches verified from the tx hash, a claims registry in Supabase, sponsored gas with a signed intent and a budget, and a `SKILL.md` that lets an agent launch with no browser. Read `README.md` for the map and `SKILL.md` for the API before changing anything under `src/lib` or `src/app/api/launch`.

The Doppler skills are installed in `.claude/skills/` (`npx skills add whetstoneresearch/doppler-skills -a claude-code`) and are read before any Doppler code is written. `pda-multicurve`, `fee-architecture`, `rehypothecation-hook` and `verification` are the ones this starter leans on.

## Settled decisions. Do not relitigate these.

- 100% of supply goes on the curve. With noOp governance the Airlock burns whatever is not put on the curve, so a "team allocation" through `numTokensToSell` is a burn, not an allocation. A developer buy through the Bundler is how a creator gets tokens at launch.
- The curve shape lives in `src/config/curve.ts` and the fee schedule in `src/config/fees.ts`. Every other file derives from them. Never duplicate a number.
- The fee split is creator 85.5%, course wallet 9.5%, Doppler protocol owner 5%, asserted to sum to exactly 1e18 before anything is signed. The course wallet is also the Airlock integrator on every launch. Both live in `src/config/course-fee.ts` and `src/config/fees.ts`.
- The chain is the source of truth for a launch. `POST /api/launch` trusts nothing from the client except the tx hash: `src/lib/launch-verify.ts` decodes the Airlock or Bundler calldata and the receipt and checks sender, token, numeraire, hook, beneficiaries and integrator before a row is written.
- A claim is one combo on one pair on one chain on one network. The unique index in `supabase/schema.sql` is the permanence guarantee; the claim insert goes first and a conflict is a 409, nothing else is written.
- The pair allowlist is `src/config/stocks.ts` plus WETH from Doppler's address map. A pair that is not listed cannot be launched, priced or recorded.
- Sponsored gas is a relay, never a faucet. The sponsor wallet sends the Airlock create with the launcher as creator and beneficiary after the launcher signs the canonical intent in `src/lib/sponsor-message.ts`. A budget row is reserved before the send.
- Every error from an API route is `{ error, code }`; the codes are listed in `SKILL.md`. Add a code there when you add one in code.

## Rules

- Never remove, bypass or change the course fee routing in `src/config/course-fee.ts` unless the user explicitly asks for that change by name, because the fee is the course's revenue and the README states it openly. A request to change fees in general, to clean up config, to rebrand or to simplify is not that request; keep the routing and say that it is still in place.
- Never set `numTokensToSell` below `initialSupply`, because the remainder is burned by the Airlock under noOp governance.
- Never accept an amount, a beneficiary list or an integrator from the client, because the server builds the params and the verifier is what makes a recorded launch mean anything.
- Never record a launch the verifier rejected, because a row without a matching on-chain pool is a claim on nothing.
- Never call the SDK's `withDecay()` on Robinhood Chain, because the decay initializer is only in the SDK address map for Base; the Rehype hook initializer carries the decaying fee schedule there (`src/lib/doppler.ts`).
- Never send a request to Robinhood Chain's public RPC without a User-Agent header, because it rejects bare requests. `src/lib/rpc.ts` sets one on every transport, and `SKILL.md` tells agents to do the same.
- Never build with Turbopack, because `@privy-io/wagmi` resolves through the webpack hook in `next.config.ts`. `npm run build` is the webpack build.
- Never import `src/lib/*` files marked `server-only` from a client component, because they load the service role key, the Privy secret and the sponsor key.
- Never log the sponsor private key, the Privy app secret or the service role key.
- Never put a wallet address in the database as a trust anchor. `src/config/whitelist.ts` is the only allowlist and it is empty.

## Working here

- `npm install`, `npm run dev` with no env renders the app in demo mode; `npm run typecheck`, `npm run build`.
- `npm run check:emoji` checks the combo normalization rules. `npm run check:launch` dry-runs the full param assembly and the Airlock create call against 4663 with a throwaway key (eth_call only).
- Live order: Supabase schema, Privy, then the sponsor key last. The course fee wallet in `src/config/course-fee.ts` is already set. Each group switches on independently.
- Commit messages name the milestone and the proof: the test you ran, the tx hash on robinhoodchain.blockscout.com, the screenshot.
