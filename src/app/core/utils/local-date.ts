/**
 * Calendar dates in the browser's local zone.
 * `toISOString()` and `new Date('yyyy-MM-dd')` are UTC and move the day in Asia/Riyadh (UTC+3).
 */

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

/** Local calendar day from `YYYY-MM-DD` or the date prefix of an ISO timestamp. */
export function parseLocalIsoDate(isoDate: string): Date {
  const match = ISO_DATE_PREFIX.exec(isoDate);
  if (!match) {
    return new Date(NaN);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

/** Month input value `yyyy-MM` from a local Date. */
export function toLocalYearMonth(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function parseLocalYearMonth(yearMonth: string): Date {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, 1);
}
