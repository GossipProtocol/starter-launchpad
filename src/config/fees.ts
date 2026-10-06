import { parseEther, isAddress, type Address } from "viem";
import { COURSE_FEE_BPS, COURSE_FEE_RECIPIENT, requireCourseFee } from "./course-fee";

/**
 * Fee structure for every pool this app launches.
 *
 * Units: Uniswap V4 fee pips, 1_000_000 = 100%. So 750_000 = 75% and 10_000 = 1%.
 * Verified against the SDK: V4_MAX_FEE = 100_000 (10%) for static tiers, DECAY_MAX_START_FEE = 800_000 (80%)
 * for hook fee schedules, TICK_SPACINGS[10000] = 200.
 *
 * Setup tip for Robinhood Chain (4663): the SDK's `withDecay()` needs a `v4DecayMulticurveInitializer`, which is
 * only in the SDK address map for Base and Base Sepolia. On Robinhood the same decay comes from the
 * RehypeDopplerHookInitializer: `withRehypeDopplerHookInitializer({ startFee, endFee, durationSeconds })` makes
 * the pool dynamic-fee and the hook charges startFee → endFee itself (same units).
 */
/**
 * Anti-snipe schedule: 75% at launch decaying to 1% over the first 16 seconds, then 1% forever.
 * Bots that buy in the first blocks pay most of their trade in fees to the beneficiaries.
 * 750_000 is under both the Rehype contract cap (0.8e6) and the SDK's DECAY_MAX_START_FEE (800_000).
 */
export const FEE_START = 750_000; // 75%
export const FEE_END = 10_000; // 1%, terminal
export const FEE_DECAY_SECONDS = 16;
/** Tick spacing for the terminal 1% tier (standard HIGH tier). */
export const FEE_TICK_SPACING = 200;

export const WAD = 10n ** 18n;

/** The protocol owner's 5% is the minimum the SDK enforces for initializer-side positions. */
export const SHARE_PROTOCOL = parseEther("0.05");
/** The course share, derived from COURSE_FEE_BPS so the two files cannot drift. 950 bps = 0.095e18. */
export const SHARE_COURSE = (WAD * BigInt(COURSE_FEE_BPS)) / 10_000n;
/** Whatever is left is the creator's. 85.5% with the defaults. */
export const SHARE_CREATOR = WAD - SHARE_PROTOCOL - SHARE_COURSE;

/** The course wallet is also the Doppler integrator on every launch (`.withIntegrator`). */
export const INTEGRATOR: Address = COURSE_FEE_RECIPIENT;

export type Beneficiary = { beneficiary: Address; shares: bigint };

/**
 * Lockable beneficiaries: creator 85.5%, course wallet 9.5%, Doppler protocol owner 5%.
 * Throws if the course wallet is unset, the protocol share is not exactly 5%, or the shares do not sum to WAD.
 */
export function buildBeneficiaries(creator: Address, protocolOwner: Address, course: Address = requireCourseFee()): Beneficiary[] {
  if (!isAddress(course) || /^0x0{40}$/i.test(course)) throw new Error("COURSE_FEE_RECIPIENT is not set to a valid address");
  if (!isAddress(creator) || !isAddress(protocolOwner)) throw new Error("Bad creator or protocol owner address");
  // Doppler requires unique, strictly ascending beneficiary addresses. When two roles share a wallet
  // (the course wallet launching its own token), merge them into one entry with the combined shares.
  const merged = new Map<string, Beneficiary>();
  for (const b of [
    { beneficiary: creator, shares: SHARE_CREATOR },
    { beneficiary: course, shares: SHARE_COURSE },
    { beneficiary: protocolOwner, shares: SHARE_PROTOCOL },
  ]) {
    const k = b.beneficiary.toLowerCase();
    const prev = merged.get(k);
    merged.set(k, prev ? { beneficiary: prev.beneficiary, shares: prev.shares + b.shares } : b);
  }
  const list = [...merged.values()];
  assertSharesSumToWad(list, protocolOwner);
  return list;
}

export function assertSharesSumToWad(list: Beneficiary[], protocolOwner?: Address): void {
  const total = list.reduce((s, b) => s + b.shares, 0n);
  if (total !== WAD) throw new Error(`Beneficiary shares must sum to exactly 1e18, got ${total}`);
  if (protocolOwner) {
    const p = list.find((b) => b.beneficiary.toLowerCase() === protocolOwner.toLowerCase());
    if (!p || p.shares < SHARE_PROTOCOL) throw new Error("Protocol owner must hold at least 5% (0.05e18) of shares");
  }
}

/** Linear decay: current fee in pips given the on-chain schedule. */
export function currentFee(s: { startingTime: number; startFee: number; endFee: number; durationSeconds: number }, now = Date.now() / 1000): number {
  if (s.durationSeconds <= 0 || now >= s.startingTime + s.durationSeconds) return s.endFee;
  if (now <= s.startingTime) return s.startFee;
  const t = (now - s.startingTime) / s.durationSeconds;
  return Math.round(s.startFee - (s.startFee - s.endFee) * t);
}

export function feePct(pips: number, digits = 1): string {
  const pct = pips / 10_000;
  return `${pct >= 10 ? Math.round(pct) : pct.toFixed(digits)}%`;
}
