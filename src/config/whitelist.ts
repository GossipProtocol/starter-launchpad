/**
 * Wallets that may launch from the app without a linked X account (for example the team's own wallet while
 * testing). Compared case-insensitively. Empty by default: add addresses here, never in the database.
 */
export const X_EXEMPT_ADDRESSES: string[] = [].map((a: string) => a.toLowerCase());

export function isXExempt(address?: string | null): boolean {
  return Boolean(address) && X_EXEMPT_ADDRESSES.includes((address as string).toLowerCase());
}
