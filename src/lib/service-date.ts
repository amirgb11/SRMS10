import { addDaysIso } from "./jalali";

export const LEGAL_SERVICE_DAYS = 630;

export interface AdjustmentLike {
  effectDirection: string; // increase | decrease
  days: number;
}

/**
 * Compute final service end date.
 * base = dispatchDate + 630 days.
 * decrease adjustments subtract days, increase adjustments add days.
 */
export function computeServiceEndDate(
  dispatchDate: string | null | undefined,
  adjustments: AdjustmentLike[] = [],
): string | null {
  if (!dispatchDate) return null;
  const base = addDaysIso(dispatchDate, LEGAL_SERVICE_DAYS);
  let netDays = 0;
  for (const a of adjustments) {
    const d = Number(a.days) || 0;
    netDays += a.effectDirection === "decrease" ? -d : d;
  }
  return addDaysIso(base, netDays);
}

export function netAdjustmentDays(adjustments: AdjustmentLike[] = []): number {
  return adjustments.reduce((acc, a) => {
    const d = Number(a.days) || 0;
    return acc + (a.effectDirection === "decrease" ? -d : d);
  }, 0);
}
