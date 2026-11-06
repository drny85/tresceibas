export const DEFAULT_USD_TO_DOP = 60;
export const MIN_DONATION_USD = 1;
export const MAX_DONATION_USD = 50_000;

/**
 * Standard US processing fees. Stripe: 2.9% + $0.30 per card payment.
 * PayPal: 3.49% + $0.49 per checkout. Admins can change these in Settings.
 * International cards can cost Stripe more (+1.5%); raise the percent if most donors use them.
 */
export const DEFAULT_FEES = {
  stripe: { percent: 2.9, fixedUsd: 0.3 },
  paypal: { percent: 3.49, fixedUsd: 0.49 },
} as const;

export type Fee = { percent: number; fixedUsd: number };

export function roundDop(n: number) {
  return Math.round(n);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * The total to charge so that, after the processor takes its fee,
 * the project receives exactly `netUsd`.
 */
export function coverFee(netUsd: number, fee: Fee) {
  const charged = Math.ceil(((netUsd + fee.fixedUsd) / (1 - fee.percent / 100)) * 100) / 100;
  return { netUsd: round2(netUsd), feeUsd: round2(charged - netUsd), chargedUsd: charged };
}
