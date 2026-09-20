/** Backend list endpoints allow at most 50 (reports: 25). Keep FE in sync. */
export const MAX_PAGE_SIZE = 50;
export const REPORT_MAX_PAGE_SIZE = 25;
export const DEFAULT_PAGE_SIZE = 10;

export function clampPageSize(
  pageSize: number | undefined,
  max: number = MAX_PAGE_SIZE,
  fallback: number = DEFAULT_PAGE_SIZE,
): number {
  const raw = pageSize ?? fallback;
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  return Math.min(Math.max(Math.trunc(raw), 1), max);
}
