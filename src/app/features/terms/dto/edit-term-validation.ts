/** Edit-term rules from EDIT-DAWRA.md. Create submit rules stay in create-term-validation. */

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export const WEEKEND_HOLIDAY_ERROR = 'لا يمكن إضافة إجازة يوم الجمعة أو السبت';

export interface EditTermFormFields {
  name: string;
  startDate: string;
  endDate: string;
  registerationStartDate: string;
  registerationEndDate: string;
  holidayDates: string[];
}

export interface EditTermFormValue extends EditTermFormFields {
  pendingHolidayDate: string;
}

export interface TermDateSource {
  name: string;
  startDate: string;
  endDate: string;
  registerationStartDate: string;
  registerationEndDate: string;
  holidayDates?: string[] | null;
}

export interface EditTermContext {
  today: string;
  startLocked: boolean;
}

export interface EditTermInspection {
  errors: Record<string, string>;
  outsideHolidays: string[];
  endValid: boolean;
}

/** PUT body. `startDate` is omitted while the saved term has already started. */
export interface EditTermUpdateBody {
  name: string;
  startDate?: string;
  endDate: string;
  registerationStartDate: string;
  registerationEndDate: string;
  holidayDates: string[];
}

export function sliceIsoDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const sliced = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(sliced) ? sliced : '';
}

export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Friday/Saturday in UTC so the calendar day does not depend on the browser zone. */
export function isWeekendHoliday(isoDate: string): boolean {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day === 5 || day === 6;
}

export function formatArabicDate(isoDate: string): string {
  const sliced = sliceIsoDate(isoDate);
  if (!sliced) {
    return isoDate;
  }
  const [year, month, day] = sliced.split('-');
  const monthName = ARABIC_MONTHS[Number(month) - 1];
  if (!monthName) {
    return sliced;
  }
  return `${Number(day)} ${monthName} ${year}`;
}

export function isTermStartLocked(startDate: string, today: string): boolean {
  const start = sliceIsoDate(startDate);
  return !!start && start <= today;
}

export function uniqueIsoDates(dates: readonly string[] | null | undefined): string[] {
  const unique = new Set<string>();
  for (const date of dates ?? []) {
    const sliced = sliceIsoDate(date);
    if (sliced) {
      unique.add(sliced);
    }
  }
  return [...unique].sort();
}

export function editTermFormFromTerm(term: TermDateSource): EditTermFormValue {
  return {
    name: term.name ?? '',
    startDate: sliceIsoDate(term.startDate),
    endDate: sliceIsoDate(term.endDate),
    registerationStartDate: sliceIsoDate(term.registerationStartDate),
    registerationEndDate: sliceIsoDate(term.registerationEndDate),
    holidayDates: uniqueIsoDates(term.holidayDates),
    pendingHolidayDate: '',
  };
}

export function isFrozenHoliday(
  date: string,
  originalHolidayDates: readonly string[],
  today: string,
): boolean {
  return date < today && originalHolidayDates.includes(date);
}

export function inspectEditTermForm(
  form: EditTermFormFields,
  context: EditTermContext,
): EditTermInspection {
  const errors: Record<string, string> = {};
  const today = context.today;
  const start = form.startDate;
  const end = form.endDate;
  const regStart = form.registerationStartDate;
  const regEnd = form.registerationEndDate;

  if (!form.name.trim()) {
    errors['name'] = 'اسم الدورة مطلوب';
  }

  if (!context.startLocked && start && start < today) {
    errors['startDate'] = 'تاريخ البداية لا يمكن أن يكون في الماضي';
  } else if (!start) {
    errors['startDate'] = 'تاريخ البداية مطلوب';
  }

  let endMessage = '';
  if (!end) {
    endMessage = 'تاريخ النهاية مطلوب';
  } else if (start && end < start) {
    endMessage = 'تاريخ النهاية يجب ألا يسبق تاريخ البداية';
  } else if (end < today) {
    endMessage = 'تاريخ النهاية لا يمكن أن يكون قبل اليوم';
  }
  if (endMessage) {
    errors['endDate'] = endMessage;
  }
  const endValid = !endMessage;

  if (!regStart) {
    errors['registerationStartDate'] = 'بداية التسجيل مطلوبة';
  } else if (regEnd && regStart > regEnd) {
    errors['registerationStartDate'] = 'بداية التسجيل يجب ألا تتجاوز نهايتها';
  }

  if (!regEnd) {
    errors['registerationEndDate'] = 'نهاية التسجيل مطلوبة';
  } else if (endValid && regEnd > end) {
    errors['registerationEndDate'] = 'نهاية التسجيل يجب ألا تتجاوز نهاية الدورة';
  }

  const outsideHolidays = form.holidayDates.filter(
    (holiday) => (start && holiday < start) || (endValid && end && holiday > end),
  );
  if (outsideHolidays.length) {
    const labels = outsideHolidays.map((holiday) => formatArabicDate(holiday)).join('، ');
    errors['holidayDates'] = `الإجازة يجب أن تكون ضمن مدة الدورة: ${labels}`;
  }

  return { errors, outsideHolidays, endValid };
}

/** Inline «+ إضافة» message. Empty string means the date can be added. Does not block حفظ. */
export function holidayAddError(date: string, form: EditTermFormFields, endValid: boolean): string {
  if (!date) {
    return 'اختر تاريخًا أولاً';
  }
  if (isWeekendHoliday(date)) {
    return WEEKEND_HOLIDAY_ERROR;
  }
  const afterEnd = endValid && !!form.endDate && date > form.endDate;
  if (!form.startDate || date < form.startDate || afterEnd) {
    return 'الإجازة يجب أن تكون ضمن مدة الدورة';
  }
  if (form.holidayDates.includes(date)) {
    return 'هذا التاريخ مضاف مسبقًا';
  }
  return '';
}

export function buildUpdateTermPayload(
  form: EditTermFormFields,
  startLocked: boolean,
): EditTermUpdateBody {
  const payload: EditTermUpdateBody = {
    name: form.name.trim(),
    endDate: form.endDate,
    registerationStartDate: form.registerationStartDate,
    registerationEndDate: form.registerationEndDate,
    holidayDates: [...form.holidayDates],
  };
  if (!startLocked) {
    payload.startDate = form.startDate;
  }
  return payload;
}

export function changedTermRows(previous: TermDateSource, next: EditTermUpdateBody): string[] {
  const rows: string[] = [];
  if (next.name.trim() !== (previous.name ?? '').trim()) {
    rows.push('name');
  }
  if (
    next.startDate !== undefined &&
    sliceIsoDate(next.startDate) !== sliceIsoDate(previous.startDate)
  ) {
    rows.push('start');
  }
  if (sliceIsoDate(next.endDate) !== sliceIsoDate(previous.endDate)) {
    rows.push('end');
  }
  if (
    sliceIsoDate(next.registerationStartDate) !== sliceIsoDate(previous.registerationStartDate) ||
    sliceIsoDate(next.registerationEndDate) !== sliceIsoDate(previous.registerationEndDate)
  ) {
    rows.push('reg');
  }
  const previousHolidays = uniqueIsoDates(previous.holidayDates).join();
  const nextHolidays = uniqueIsoDates(next.holidayDates).join();
  if (previousHolidays !== nextHolidays) {
    rows.push('holidays');
  }
  return rows;
}
