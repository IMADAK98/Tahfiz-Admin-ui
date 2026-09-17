/** Sunday-start week helpers (Saudi Sun–Thu). Calendar-local. */

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function startOfWeekSunday(ref: Date = new Date()): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(isoOrDate: string | Date, days: number): string {
  const d = typeof isoOrDate === 'string' ? parseIsoDate(isoOrDate) : new Date(isoOrDate);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

const DOW_AR: Record<number, string> = {
  0: 'الأحد', 1: 'الإثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
  4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
};

const MONTH_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function formatWeekLabelAr(weekStartSundayIso: string): string {
  const sun = parseIsoDate(weekStartSundayIso);
  const thu = parseIsoDate(addDays(weekStartSundayIso, 4));
  const sameMonth = sun.getMonth() === thu.getMonth() && sun.getFullYear() === thu.getFullYear();
  if (sameMonth) {
    return `الأحد ${sun.getDate()} – الخميس ${thu.getDate()} ${MONTH_AR[thu.getMonth()]} ${thu.getFullYear()}`;
  }
  return `الأحد ${sun.getDate()} ${MONTH_AR[sun.getMonth()]} – الخميس ${thu.getDate()} ${MONTH_AR[thu.getMonth()]} ${thu.getFullYear()}`;
}

export function dowArFromIso(iso: string): string {
  return DOW_AR[parseIsoDate(iso).getDay()] ?? iso;
}

export function dayOfMonthFromIso(iso: string): string {
  return String(parseIsoDate(iso).getDate());
}
