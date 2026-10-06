# starter-launchpad

A Doppler multicurve launcher on Robinhood Chain. Pick a 1 to 3 emoji combo, pair it to a tokenized stock, and one Airlock transaction creates the token and its locked Uniswap v4 pool with the creator as a fee beneficiary. The server verifies every launch from the tx hash, keeps a claims registry so a combo is owned once per pair, pays gas for launchers who sign an intent, and publishes a `SKILL.md` so an agent can do all of it with no browser and no account. This is the Launch Lab module's starter, cut down from a launcher that ran with real launches.

It runs in two modes:

- **Demo mode** (no env at all): the pages render, the emoji picker and the pair list work, the claim check runs against an empty registry, the login button explains what is missing, and `GET /api/launch/params` still assembles real Airlock calldata against the public RPC. Nothing can be recorded and nothing is signed.
- **Live mode**: a Supabase registry, Privy login with embedded wallets on a custom wagmi chain, real launches through the Doppler SDK, server-side verification, and a sponsor wallet that pays gas for signed intents within a budget.

## The fee, stated plainly

Every token this app launches names the course wallet in the Airlock `create` call twice: as the **Doppler integrator**, and as a **fee beneficiary with 9.5% of the pool's swap fees**. The Doppler protocol owner keeps the 5% the SDK enforces and the creator keeps the remaining 85.5%. The course share is 10% of what would otherwise be the creator's 95%. 100% of supply stays on the curve; the fee is a share of swap fees, never a slice of the token. The rate (`COURSE_FEE_BPS`) and the recipient (`COURSE_FEE_RECIPIENT`) live in one file, `src/config/course-fee.ts`, and the launch builder, the params endpoint, the sponsor and the verifier all refuse to run while the recipient is the zero address.

The fee is a default, not a license condition. This code is MIT licensed, so you can change it, but the fee is how the course pays for itself and the rate is small enough that most forks leave it. If you change the recipient or the rate, say so in your README.

## What is in the box

| Area | Where | What it teaches |
|------|-------|-----------------|
| Launch params | `src/lib/doppler.ts`, `src/config/curve.ts` | The multicurve builder: 1B supply, 100% on three curves plus a max tail, noOp governance and migration, a dynamic fee through the Rehype hook initializer, beneficiaries that sum to WAD, the integrator field. |
| Course fee | `src/config/course-fee.ts`, `src/config/fees.ts` | The split in one place with exact bigint shares, and the anti-snipe schedule (75% to 1% over 16 seconds). |
| Custom chain | `src/config/chains.ts`, `src/lib/rpc.ts`, `src/components/providers.tsx` | `defineChain` for Robinhood Chain, a fallback transport with a User-Agent on every request, Privy wrapping wagmi so embedded wallets are plain connectors. |
| Verified launches | `src/lib/launch-verify.ts` | The tx hash is the only thing the client is trusted with. Decode the Airlock or Bundler calldata and the Create event; check sender, token, numeraire, hook, beneficiaries and integrator. |
| Claims registry | `src/lib/emoji.ts`, `src/lib/record-launch.ts`, `supabase/schema.sql` | Grapheme normalization, a claim per (combo, chain, pair, network), and a unique index as the permanence guarantee. |
| Sponsored gas | `src/lib/sponsor.ts`, `src/lib/sponsor-message.ts`, `app/api/launch/sponsored` | A relay, not a faucet: a canonical signed intent, a budget and a daily cap, a reservation row before the send, and the same verifier afterwards. |
| Agent surface | `SKILL.md`, `app/skill.md`, `app/api/launch/params`, `app/api/pairs`, `app/api/claims/*` | One document an agent reads to onboard itself, a params endpoint that returns exactly the calldata the app signs, and `{ error, code }` on every failure. |
| Launch page | `src/components/launch/*` | The human path: picker, availability, gas check, the sponsored branch, the self-sent branch, and recording. |
| Fees | `src/lib/fees.ts`, `src/components/FeesCard.tsx` | Pending fees from the pool and the hook, and the two collect calls. |
| Trading | `src/lib/swap-client.ts`, `app/api/trade` | Quotes through the v4 quoter and Universal Router calldata, with Permit2 approvals listed for the caller. |
| Back of house | `app/admin`, `app/api/cron/*` | Every pool, pending fees per beneficiary, the snapshot refresh. |

## Run it in demo mode

```bash
npm install
npm run dev            # http://localhost:3000
```

Open `/launch`, build a combo, pick a stock. Then `curl "http://localhost:3000/api/launch/params?combo=%F0%9F%8D%8F&pair=AAPL&creator=0x000000000000000000000000000000000000dEaD"` to see the calldata an agent would send. It returns `SERVER_MISCONFIGURED` until the course fee wallet is set, which is the first thing to do.

## Install the Doppler skills

The Doppler skills are already in `.claude/skills/` and this starter was written with them open. If you fork without that directory, or want the latest versions, install them before touching any Doppler code:

```bash
npx skills add whetstoneresearch/doppler-skills -a claude-code
```

`pda-multicurve`, `fee-architecture`, `rehypothecation-hook` and `verification` are the ones this starter leans on.

## Go live on Robinhood Chain

1. **Course fee wallet.** `src/config/course-fee.ts` already carries the course fee recipient. Leave it as it is.
2. **Supabase.** Create a project, run `supabase/schema.sql` in the SQL editor, create a public Storage bucket named `moji-images`, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
3. **Privy.** Create an app, enable Twitter and Wallets as login methods, leave smart wallets and Privy gas sponsorship off, add `http://localhost:3000` to allowed origins, set `NEXT_PUBLIC_PRIVY_APP_ID` and the server-side `PRIVY_APP_SECRET`.
4. **Site URL.** Set `NEXT_PUBLIC_SITE_URL` to the public origin. It is baked into every token's on-chain `tokenURI`, so set it before the first real launch.
5. **Sponsor.** Generate a fresh key, fund it with the ETH you are willing to spend, set `SPONSOR_PRIVATE_KEY`, `SPONSOR_BUDGET_USD` and `SPONSOR_DAILY_MAX`. Unset, launchers pay their own gas.
6. **Jobs.** Set `CRON_SECRET` and `ADMIN_PASSWORD`. On Vercel `vercel.json` schedules the snapshot refresh; elsewhere call `/api/cron/refresh` with the bearer token every couple of minutes.

Copy `.env.example` to `.env.local` and fill the groups as you go. Each group switches on independently, so a half-configured app still runs in demo mode rather than crashing. Doppler is deployed on Robinhood Chain mainnet only, so a test launch costs real ETH gas; `npm run check:launch` dry-runs the whole param assembly and the Airlock create with eth_call before you spend any.

### Setup tips

- **Robinhood Chain's public RPC wants a User-Agent.** Requests without one are rejected. `src/lib/rpc.ts` sets `NEXT_PUBLIC_RPC_USER_AGENT` on every viem transport, the server-side price fetches carry it too, and the viem sketch in `SKILL.md` shows agents how to do the same.
- **Build with webpack.** `npm run build` runs `next build` without `--turbopack`; `@privy-io/wagmi` resolves through the webpack hook in `next.config.ts`, which also externalises WalletConnect's optional node-only modules. Keep the dev server on webpack as well.
- **The decaying fee comes from the Rehype hook on this chain.** The SDK's `withDecay()` helper looks up a decay initializer that is in the address map for Base; on Robinhood the same schedule goes on `withRehypeDopplerHookInitializer`, which makes the pool dynamic-fee and charges it itself. `src/config/fees.ts` explains the units.
- **The pool's dynamic fee flag is `8388608`.** When you read a pool key back and the fee is that number, you are looking at a dynamic-fee pool and the live rate comes from `getFeeSchedule(poolId)` on the hook.

## How a live launch works

```
client / agent                 server                                  chain
  params {combo,pair,creator} -> validate combo, pair on allowlist
                                 claim free? slots left?
                                 buildParams: curves, beneficiaries,
                                   integrator = course wallet
                                 simulate create -> gas
  <- tx {to,data,value,gas}, predicted {token,pool}, record body
  sign and send -------------------------------------------------------> Airlock.create
  launch {txHash, ...}        -> verifyLaunchTx: receipt, sender,
                                   token, numeraire, hook, beneficiaries,
                                   integrator
                                 insert claim (unique index)
                                 insert row, render image, snapshot
  <- {moji, href, url}

sponsored:
  sign intent {chainId,combo,creator,pair,ts}
  sponsored {..., signature}  -> verify signature and window
                                 budget + daily cap, reserve a row
                                 buildParams with creator as beneficiary
                                 send from the sponsor wallet ------------> Airlock.create
                                 verifyLaunchTx with sender = sponsor
                                 record (same path as above)
  <- {txHash, gasUsd, moji, href, url}
```

Three things this starter enforces, and they are the reason it exists:

- **100% of supply goes on the curve.** With noOp governance the Airlock burns anything not put on the curve. The first launch of the original product lost 10% of supply that way. `src/config/curve.ts` pins `sellFraction` to 1 and the comment says why.
- **The server builds the params and the chain proves the launch.** An agent gets calldata from `/api/launch/params` and can change any byte of it, so `/api/launch` never trusts the body. It decodes what was actually sent and checks the beneficiaries, which is the part that cannot be spoofed.
- **Sponsored gas is reserved before it is spent.** A `sponsored_launches` row with the estimated cost is inserted before the send, so two requests cannot both spend the last dollar, and a reverted or unverified launch is marked failed with its reason.

## What is left for you

The launch builder, the verifier, the registry and the sponsor are complete and `/api/launch/params` returns the exact calldata the app signs. The first milestone of the module is adding a second numeraire to the allowlist (a liquid token on Robinhood Chain with a Dexscreener price, through `src/config/stocks.ts` or a token list in `src/lib/numeraire.ts`) and launching against it on mainnet, with the tx hash and the verifier's output in the commit message. The capstone is a launcher of your own: a different claim rule than emoji (a word, a handle, a date), your own curve shape with a written rationale, a second chain from the Doppler address map, and a `SKILL.md` that another agent can follow end to end without you in the room.

## Legal note

A token launcher is a money-adjacent product. Tokenized stocks are securities in most places and a token paired to one inherits questions about what it represents; say plainly in the metadata and on the page that the token is not the stock and confers nothing. Gate by geography where you must, keep the sponsor wallet small, and talk to counsel before you promote it. The course covers this in the Launch Lab module.

## Course

Consumer Layer, the course this starter is taught in, covers it in the Launch Lab module, with the Doppler skills installed from Module 0 onward. The course plugin's `launchpad` skill coaches each milestone and the `review` skill checks your fork against the module checklist.
