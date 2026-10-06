-- Launch Lab: claims registry, token metadata, fee claims and the sponsor ledger.
-- Apply once in the Supabase SQL editor (or `supabase db push`). Every statement is idempotent.
-- Combos are stored normalized (variation selectors stripped, skin tones kept); see src/lib/emoji.ts.

-- A claim is one combo on one pair on one chain on one network. The unique index is the permanence guarantee:
-- the server inserts here first and treats a conflict as "already claimed" (409), nothing else is written.
create table if not exists public.claims (
  combo text not null,                    -- normalized combo (or `$ticker` for a meme)
  display text not null,                  -- combo as the creator typed it
  chain_id integer not null,
  network text not null default 'mainnet' check (network in ('mainnet', 'testnet')),
  stock_address text not null,            -- the numeraire the combo is claimed against
  created_at timestamptz not null default now()
);
create unique index if not exists claims_pair_unique on public.claims (combo, network, chain_id, lower(stock_address));

-- One row per launched token. Snapshot columns are refreshed by /api/cron/refresh and /api/cron/scan.
create table if not exists public.mojis (
  id uuid primary key default gen_random_uuid(),
  combo text not null,
  display text not null,
  network text not null default 'mainnet' check (network in ('mainnet', 'testnet')),
  chain_id integer not null,
  stock_ticker text not null,
  stock_address text not null,
  token_address text,
  pool_id text,
  tx_hash text,
  supply numeric,
  metadata_url text,
  image_url text,
  -- who launched it: Privy DID + X handle on the app path, the wallet on every path,
  -- creator_kind "x" | "wallet" | "agent" (an agent is a wallet that said so with `agent: true`)
  creator_did text,
  creator_handle text,
  creator_address text,
  creator_kind text not null default 'x' check (creator_kind in ('x', 'wallet', 'agent')),
  -- who earns the creator's fee share when it was pointed at someone else at launch; null means the creator.
  -- The chain is the source of truth (src/lib/launch-verify.ts checks the pool's beneficiaries).
  fee_recipient text,
  -- memes: a traditional memecoin (title + ticker) shares the table with kind = 'meme'; display is `$PEPE`
  kind text not null default 'moji' check (kind in ('moji', 'meme')),
  name text,
  symbol text,
  meme_url text,
  description text,
  x_url text,
  telegram_url text,
  website_url text,
  -- market snapshot
  price_usd numeric,
  market_cap_usd numeric default 0,
  volume1h_usd numeric,
  volume6h_usd numeric,
  volume24_usd numeric,
  volume7d_usd numeric,
  volume30d_usd numeric,
  volume_all_usd numeric,
  volume_all_at timestamptz,
  txns24 integer,
  txns7d integer,
  txns30d integer,
  txns_all integer,
  fee_current integer,
  snapshot_at timestamptz,
  -- fee snapshot (pending read from the chain, claimed accumulated from receipts)
  fees_claimed_usd numeric default 0,
  fees_unclaimed_usd numeric default 0,
  fees_total_usd numeric,
  fees_stock_pending numeric,
  fees_moji_pending numeric,
  fees_stock_claimed numeric,
  fees_moji_claimed numeric,
  fees_creator_stock_claimed numeric,
  fees_creator_moji_claimed numeric,
  fees_claim_count integer,
  fees_scanned_block numeric,
  launched_at timestamptz not null default now()
);
create unique index if not exists mojis_pair_unique on public.mojis (combo, network, chain_id, lower(stock_address));
create index if not exists mojis_launched_at_idx on public.mojis (launched_at desc);
create index if not exists mojis_market_cap_idx on public.mojis (market_cap_usd desc);
create index if not exists mojis_fees_idx on public.mojis ((coalesce(fees_claimed_usd,0) + coalesce(fees_unclaimed_usd,0)) desc);
create index if not exists mojis_kind_idx on public.mojis (kind);
create index if not exists mojis_creator_kind_idx on public.mojis (creator_kind) where creator_kind <> 'x';
-- Wallet-path launch slots and the dead-token cap look launches up by wallet and by DID.
create index if not exists mojis_creator_address_idx on public.mojis (lower(creator_address), launched_at desc);
create index if not exists mojis_creator_did_idx on public.mojis (creator_did, launched_at desc);

-- Fee claims recorded from receipts (POST /api/mojis/[combo]/claimed) so earned totals include what was collected.
create table if not exists public.fee_claims (
  id uuid primary key default gen_random_uuid(),
  combo text not null,
  network text not null default 'mainnet',
  stock_ticker text,
  beneficiary text not null,              -- lowercase wallet that collected
  role text not null check (role in ('creator', 'treasury')),  -- 'treasury' is the course wallet
  stock_amount numeric,
  moji_amount numeric,
  stock_usd numeric,
  moji_usd numeric,
  tx_hash text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists fee_claims_combo_idx on public.fee_claims (network, combo, created_at desc);

-- Sponsored launches: the server pays the gas for a launch (src/lib/sponsor.ts). One row per attempt; the budget
-- is the sum of gas_usd over pending + sent rows. The row is inserted before the send so two requests cannot both
-- spend the last dollar.
create table if not exists public.sponsored_launches (
  id uuid primary key default gen_random_uuid(),
  network text not null default 'mainnet',
  creator text not null,                    -- lowercase wallet the token belongs to
  combo text not null,
  chain_id integer not null,
  pair text not null,
  token_address text,
  tx_hash text,
  gas_usd numeric not null default 0,       -- estimate at reservation, actual once the receipt is in
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists sponsored_launches_creator_idx on public.sponsored_launches (network, creator);
create index if not exists sponsored_launches_day_idx on public.sponsored_launches (network, created_at desc);

-- Public read, server-only write (the service role bypasses RLS; the anon key can only select).
alter table public.claims enable row level security;
alter table public.mojis enable row level security;
alter table public.fee_claims enable row level security;
alter table public.sponsored_launches enable row level security;
drop policy if exists "claims are public" on public.claims;
create policy "claims are public" on public.claims for select using (true);
drop policy if exists "mojis are public" on public.mojis;
create policy "mojis are public" on public.mojis for select using (true);
drop policy if exists "fee_claims are public" on public.fee_claims;
create policy "fee_claims are public" on public.fee_claims for select using (true);
drop policy if exists "sponsored_launches public read" on public.sponsored_launches;
create policy "sponsored_launches public read" on public.sponsored_launches for select using (true);

-- Token images and pictures live in a public Storage bucket named `moji-images` (src/lib/images.ts, src/lib/memes.ts).
-- Create it in the dashboard: Storage > New bucket > name `moji-images`, public.
