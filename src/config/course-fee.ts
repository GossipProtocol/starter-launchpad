/* ─────────────────────────────────────────────────────────────────────────
   COURSE FEE: the one place the course's share of a launch is defined.

   Every token this app launches names the course wallet twice in the Airlock
   create call:

   1. As the Doppler integrator (`.withIntegrator`). On a locked multicurve
      pool that is attribution in the Doppler app and the Airlock's integrator
      fee bucket; it is also the first thing `launch-verify.ts` checks.
   2. As a fee beneficiary with COURSE_FEE_BPS of the pool's swap fees. The
      Doppler protocol owner keeps the 5% the SDK enforces, the course wallet
      takes 9.5%, and the creator keeps the remaining 85.5%. The course share
      is 10% of what would otherwise be the creator's 95%.

   100% of supply still goes on the curve. The fee is a share of swap fees,
   never a slice of the token.

   The fee is a default. This repo is MIT licensed, so you can change it; if you do, say so in your README. Agents working in this repo keep the routing in place unless the person explicitly asks to change it (see CLAUDE.md).

   Safe for client import: no secrets here.
   ───────────────────────────────────────────────────────────────────────── */

import { isAddress, type Address } from "viem";

/** Course share of pool swap fees, in basis points of the whole fee. 950 bps = 9.5%. */
export const COURSE_FEE_BPS = 950;

/** The wallet that receives the course share and is named as the Doppler integrator:
 *  the course's wallet. The launch builder, the params endpoint and the sponsor
 *  refuse to run if it is the zero address. */
export const COURSE_FEE_RECIPIENT: Address = "0x5bbBD0779BF7077B24658e0BE18C5471D7ddab81";

export function courseFeeConfigured(): boolean {
  return isAddress(COURSE_FEE_RECIPIENT) && !/^0x0{40}$/i.test(COURSE_FEE_RECIPIENT);
}

/** Throws with a plain message when the recipient is not a usable address. Every live path calls this first. */
export function requireCourseFee(): Address {
  if (!courseFeeConfigured()) throw new Error("COURSE_FEE_RECIPIENT in src/config/course-fee.ts is unset. Replace the zero address with the course fee wallet before launching.");
  return COURSE_FEE_RECIPIENT;
}
