import ExcelJS from 'exceljs';
import { addDays, parseIsoDate, startOfWeekSunday, toIsoDate } from '../attendance-report/week-date.util';

/**
 * Client workbook for the center weekly report.
 * Layout follows the client's week-2 sheet with these columns removed:
 * استمارة رقم، نقاط الأسبوع، مجموع النقاط، عدد أوجه الأسبوع،
 * and the لم يحفظ / لم يسمع marks plus their KPI card.
 * Rows are the live roster only — no 15-slot or 1000-row padding.
 */

const NULL_PERCENT = '—';
const TERM_SHEET_NAME = 'للفصل الدراسي';

/** Template ordinals (tabs الأسبوع الثاني … السابع عشر). Other indexes use «الأسبوع» plus the number. */
const WEEK_ORDINALS: Record<number, string> = {
  2: 'الثاني',
  3: 'الثالث',
  4: 'الرابع',
  5: 'الخامس',
  6: 'السادس',
  7: 'السابع',
  8: 'الثامن',
  9: 'التاسع',
  10: 'العاشر',
  11: 'الحادي عشر',
  12: 'الثاني عشر',
  13: 'الثالث عشر',
  14: 'الرابع عشر',
  15: 'الخامس عشر',
  16: 'السادس عشر',
  17: 'السابع عشر',
};

/** Row-2 day headers, copied from the template (الاحد / الاربعاء have no hamza). */
const DAY_HEADERS = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس'] as const;
/** Footer day labels, copied from the template (الأحد / الأربعاء keep the hamza). */
const FOOTER_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] as const;

const COL = {
  group: 1,
  name: 2,
  mur: 3,
  tath: 4,
  hifz: 5,
  absent: 6,
  present: 7,
  spacer1: 8,
  sun: 9,
  mon: 10,
  tue: 11,
  wed: 12,
  thu: 13,
  spacer2: 14,
  winMur: 15,
  winTath: 16,
  winHifz: 17,
  spacer3: 18,
  kpi5: 19,
  kpi4: 20,
  kpi3: 21,
  kpi2: 22,
  kpi1: 23,
} as const;

const DATA_START = 3;
const HEADER_ROW = 2;

const GOLD = 'FFC9BA8F';
const KPI_HEADER = 'FF666666';
const GREEN = 'FFB7E1CD';
const YELLOW = 'FFFFE599';
const RED = 'FFEA9999';
const GREY = 'FFB7B7B7';
const PINK = 'FFF4CCCC';
const AMBER = 'FFFFF2CC';
const PEACH = 'FFFCE5CD';
const ZERO_GREY = 'FFCCCCCC';
const BLUE = 'FFA4C2F4';
const WHITE = 'FFFFFFFF';
const BEIGE = 'FFEDE4D7';
/** App excused chip. The template has no معذور colour. */
const EXCUSED = 'FFE8EEF6';

const KPI_TITLES = [
  'عدد طلاب المنقطعين',
  'عدد الطلاب الغائبين (4 أيام)',
  'عدد الطلاب الغائبين (3 أيام)',
  'عدد الطلاب الغائبين (2 أيام)',
  'عدد الطلاب الغائبين (يوم)',
] as const;

export interface WeeklyReportDay {
  date: string;
  status: string | null;
  isHoliday?: boolean;
}

export interface WeeklyReportSourceStudent {
  studentId: number;
  studentName: string;
  halqaId: number;
  halqaName: string;
  days: WeeklyReportDay[];
}

export interface WeeklyReportSourceWeek {
  weekStart: string;
  students: WeeklyReportSourceStudent[];
}

export interface WeeklyReportPercents {
  /** Null is the term window. A Sunday date is that week. */
  weekStart: string | null;
  halqaId: number;
  studentId: number;
  hifz: number | null;
  tath: number | null;
  mur: number | null;
}

export interface WeeklyReportAssembleInput {
  weeks: WeeklyReportSourceWeek[];
  progress: WeeklyReportPercents[];
  teacherByHalqaId: ReadonlyMap<number, string | null>;
  includeTermSheet: boolean;
}

interface SheetStudent {
  studentName: string;
  halqaId: number;
  halqaName: string;
  teacherName: string | null;
  mur: number | null;
  tath: number | null;
  hifz: number | null;
  windowMur: number | null;
  windowTath: number | null;
  windowHifz: number | null;
  dayLabels: string[];
  absence: number;
  attendance: number;
}

interface SheetModel {
  name: string;
  weekTitle: string;
  windowLabel: string;
  students: SheetStudent[];
}

/** Real percent. Null/empty stays null (never 0). No cap above 100. Negative becomes 0, matching the report screen. */
export function percentOrNull(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (numeric < 0) {
    return 0;
  }
  return numeric;
}

/** Sunday weeks whose Sun–Thu span overlaps the term. Empty when the dates are unusable. */
export function termSundayWeeks(termStart: string, termEnd: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(termStart) || !/^\d{4}-\d{2}-\d{2}$/.test(termEnd)) {
    return [];
  }
  if (termStart > termEnd) {
    return [];
  }
  const weeks: string[] = [];
  let sunday = toIsoDate(startOfWeekSunday(parseIsoDate(termStart)));
  while (weeks.length < 60 && sunday <= termEnd) {
    const thursday = addDays(sunday, 4);
    if (thursday >= termStart) {
      weeks.push(sunday);
    }
    sunday = addDays(sunday, 7);
  }
  return weeks;
}

export function weekSheetTitle(weekIndex: number): string {
  const ordinal = WEEK_ORDINALS[weekIndex];
  return ordinal ? `الأسبوع ${ordinal}` : `الأسبوع ${weekIndex}`;
}

export function attendanceMarkLabel(status: string | null | undefined, isHoliday = false): string {
  if (isHoliday || status === 'HOLIDAY' || status == null || status === '' || status === 'NOT_MARKED') {
    return '';
  }
  switch (status) {
    case 'PRESENT':
      return 'حاضر';
    case 'ABSENT':
      return 'غائب';
    case 'LATE':
      return 'متأخر';
    case 'LEAVE':
    case 'EXCUSED':
      return 'معذور';
    default:
      return '';
  }
}

export function countAbsence(labels: readonly string[]): number {
  return labels.filter((label) => label === 'غائب').length;
}

/** حاضر + متأخر. معذور and غائب are not attendance. */
export function countAttendance(labels: readonly string[]): number {
  return labels.filter((label) => label === 'حاضر' || label === 'متأخر').length;
}

export function assembleWeeklyReport(input: WeeklyReportAssembleInput): SheetModel[] {
  const progressByKey = new Map<string, WeeklyReportPercents>();
  for (const row of input.progress) {
    progressByKey.set(progressKey(row.weekStart, row.halqaId, row.studentId), row);
  }
  const sheets = input.weeks.map((week, index) =>
    weekSheet(week, index + 1, progressByKey, input.teacherByHalqaId),
  );
  if (input.includeTermSheet && input.weeks.length) {
    sheets.push(termSheet(input.weeks, progressByKey, input.teacherByHalqaId));
  }
  return sheets;
}

export function buildWeeklyReportWorkbook(sheets: SheetModel[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tahfiz';
  workbook.calcProperties.fullCalcOnLoad = true;
  for (const sheet of sheets) {
    writeSheet(workbook.addWorksheet(uniqueSheetName(workbook, sheet.name), {
      views: [
        {
          state: 'frozen',
          xSplit: 0,
          ySplit: 2,
          topLeftCell: 'A3',
          activeCell: 'A3',
          rightToLeft: true,
          showRuler: true,
          showRowColHeaders: true,
          showGridLines: true,
          zoomScale: 100,
          zoomScaleNormal: 100,
        },
      ],
    }), sheet);
  }
  return workbook;
}

export async function downloadWeeklyReportWorkbook(
  workbook: ExcelJS.Workbook,
  filename: string,
): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function progressKey(weekStart: string | null, halqaId: number, studentId: number): string {
  return `${weekStart ?? 'term'}:${halqaId}:${studentId}`;
}

function weekSheet(
  week: WeeklyReportSourceWeek,
  weekIndex: number,
  progressByKey: Map<string, WeeklyReportPercents>,
  teachers: ReadonlyMap<number, string | null>,
): SheetModel {
  const title = weekSheetTitle(weekIndex);
  return {
    name: title,
    weekTitle: title,
    windowLabel: title,
    students: grouped(week.students).flatMap((group) =>
      group.map((student) => {
        const labels = dayLabels(student.days);
        const rates = ratesOf(progressByKey.get(progressKey(week.weekStart, student.halqaId, student.studentId)));
        return studentRow(student, teachers, rates, rates, labels, countAbsence(labels), countAttendance(labels));
      }),
    ),
  };
}

function termSheet(
  weeks: WeeklyReportSourceWeek[],
  progressByKey: Map<string, WeeklyReportPercents>,
  teachers: ReadonlyMap<number, string | null>,
): SheetModel {
  const seen = new Map<string, WeeklyReportSourceStudent>();
  const totals = new Map<string, { absence: number; attendance: number }>();
  for (const week of weeks) {
    for (const student of week.students) {
      const key = `${student.halqaId}:${student.studentId}`;
      if (!seen.has(key)) {
        seen.set(key, student);
        totals.set(key, { absence: 0, attendance: 0 });
      }
      const labels = dayLabels(student.days);
      const total = totals.get(key)!;
      total.absence += countAbsence(labels);
      total.attendance += countAttendance(labels);
    }
  }
  const students = grouped([...seen.values()]).flatMap((group) =>
    group.map((student) => {
      const key = `${student.halqaId}:${student.studentId}`;
      const total = totals.get(key)!;
      const rates = ratesOf(progressByKey.get(progressKey(null, student.halqaId, student.studentId)));
      return studentRow(student, teachers, rates, rates, ['', '', '', '', ''], total.absence, total.attendance);
    }),
  );
  return {
    name: TERM_SHEET_NAME,
    weekTitle: TERM_SHEET_NAME,
    windowLabel: TERM_SHEET_NAME,
    students,
  };
}

function studentRow(
  student: WeeklyReportSourceStudent,
  teachers: ReadonlyMap<number, string | null>,
  weekRates: { mur: number | null; tath: number | null; hifz: number | null },
  windowRates: { mur: number | null; tath: number | null; hifz: number | null },
  labels: string[],
  absence: number,
  attendance: number,
): SheetStudent {
  const teacher = teachers.get(student.halqaId);
  return {
    studentName: student.studentName,
    halqaId: student.halqaId,
    halqaName: student.halqaName.trim() || NULL_PERCENT,
    teacherName: teacher?.trim() ? teacher.trim() : null,
    mur: weekRates.mur,
    tath: weekRates.tath,
    hifz: weekRates.hifz,
    windowMur: windowRates.mur,
    windowTath: windowRates.tath,
    windowHifz: windowRates.hifz,
    dayLabels: labels,
    absence,
    attendance,
  };
}

function ratesOf(row: WeeklyReportPercents | undefined): { mur: number | null; tath: number | null; hifz: number | null } {
  return {
    mur: row?.mur ?? null,
    tath: row?.tath ?? null,
    hifz: row?.hifz ?? null,
  };
}

function dayLabels(days: WeeklyReportDay[]): string[] {
  const labels = ['', '', '', '', ''];
  for (const day of days) {
    const index = parseIsoDate(day.date).getDay();
    if (index >= 0 && index <= 4) {
      labels[index] = attendanceMarkLabel(day.status, !!day.isHoliday);
    }
  }
  return labels;
}

function grouped(students: WeeklyReportSourceStudent[]): WeeklyReportSourceStudent[][] {
  const order: number[] = [];
  const buckets = new Map<number, WeeklyReportSourceStudent[]>();
  const seenStudent = new Set<string>();
  for (const student of students) {
    const key = `${student.halqaId}:${student.studentId}`;
    if (seenStudent.has(key)) {
      continue;
    }
    seenStudent.add(key);
    if (!buckets.has(student.halqaId)) {
      order.push(student.halqaId);
      buckets.set(student.halqaId, []);
    }
    buckets.get(student.halqaId)!.push(student);
  }
  return order.map((id) => buckets.get(id)!);
}

function uniqueSheetName(workbook: ExcelJS.Workbook, name: string): string {
  const cleaned = name.replace(/[\\/*?:[\]]/g, ' ').trim().slice(0, 31) || 'week';
  if (!workbook.getWorksheet(cleaned)) {
    return cleaned;
  }
  const suffix = ` ${workbook.worksheets.length + 1}`;
  return `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
}

function writeSheet(sheet: ExcelJS.Worksheet, model: SheetModel): void {
  sheet.properties.defaultRowHeight = 15.75;
  const widths: Array<[number, number]> = [
    [COL.group, 20],
    [COL.name, 16.63],
    [COL.mur, 12],
    [COL.tath, 12],
    [COL.hifz, 12],
    [COL.absent, 8],
    [COL.present, 8],
    [COL.spacer1, 2],
    [COL.sun, 11],
    [COL.mon, 11],
    [COL.tue, 11],
    [COL.wed, 11],
    [COL.thu, 11],
    [COL.spacer2, 4],
    [COL.winMur, 14.63],
    [COL.winTath, 12],
    [COL.winHifz, 12],
    [COL.spacer3, 3],
    [COL.kpi5, 18],
    [COL.kpi4, 18],
    [COL.kpi3, 18],
    [COL.kpi2, 18],
    [COL.kpi1, 16],
  ];
  for (const [index, width] of widths) {
    sheet.getColumn(index).width = width;
  }
  sheet.getRow(1).height = 30;
  sheet.getRow(2).height = 22;

  writeHeaders(sheet, model);
  writeGroups(sheet, model.students);
  const lastDataRow = model.students.length ? DATA_START + model.students.length - 1 : DATA_START - 1;
  model.students.forEach((student, index) => writeStudent(sheet, DATA_START + index, student, index));
  writeFooter(sheet, lastDataRow, model.students);
  writeKpi(sheet, model.students, lastDataRow);
  if (model.students.length) {
    addConditionalFormatting(sheet, lastDataRow);
  }
}

function writeHeaders(sheet: ExcelJS.Worksheet, model: SheetModel): void {
  sheet.mergeCells(1, COL.mur, 1, COL.hifz);
  const title = sheet.getCell(1, COL.mur);
  title.value = model.weekTitle;
  title.font = { name: 'Arial', size: 12, bold: true };
  title.alignment = center('middle');

  const headers: Array<[number, string]> = [
    [COL.name, 'الاسم'],
    [COL.mur, 'نسبة المراجعة'],
    [COL.tath, 'نسبة التثبيت'],
    [COL.hifz, 'نسبة الحفظ'],
    [COL.absent, 'الغياب'],
    [COL.present, 'الحضور'],
  ];
  DAY_HEADERS.forEach((label, index) => headers.push([COL.sun + index, label]));
  for (const [column, label] of headers) {
    const cell = sheet.getCell(HEADER_ROW, column);
    cell.value = label;
    cell.font = { name: 'Arial', size: 10, bold: true };
    cell.alignment = center('bottom');
    cell.fill = solid(GOLD);
    cell.border = thickBorder();
  }
  sheet.getCell(HEADER_ROW, COL.spacer1).fill = solid(GOLD);

  const windowTitles: Array<[number, string]> = [
    [COL.winMur, 'معدل المراجعة'],
    [COL.winTath, 'معدل التثبيت'],
    [COL.winHifz, 'معدل الحفظ'],
  ];
  for (const [column, label] of windowTitles) {
    const cell = sheet.getCell(1, column);
    cell.value = label;
    cell.font = { name: 'Arial', size: 12, bold: true };
    cell.alignment = center('middle');
    cell.border = thickBorder();
  }
  sheet.mergeCells(HEADER_ROW, COL.winMur, HEADER_ROW, COL.winHifz);
  const window = sheet.getCell(HEADER_ROW, COL.winMur);
  window.value = model.windowLabel;
  window.font = { name: 'Arial', size: 12, bold: true };
  window.alignment = center('middle');
  window.border = thickBorder();
}

function writeGroups(sheet: ExcelJS.Worksheet, students: SheetStudent[]): void {
  let row = DATA_START;
  let index = 0;
  while (index < students.length) {
    const halqaId = students[index].halqaId;
    let end = index;
    while (end < students.length && students[end].halqaId === halqaId) {
      end += 1;
    }
    const count = end - index;
    const name = students[index].halqaName;
    const teacher = students[index].teacherName ?? NULL_PERCENT;
    if (count === 1) {
      const cell = sheet.getCell(row, COL.group);
      cell.value = teacher === NULL_PERCENT ? name : `${name}\n${teacher}`;
      styleGroupCell(cell);
    } else {
      const top = Math.ceil(count / 2);
      sheet.mergeCells(row, COL.group, row + top - 1, COL.group);
      const nameCell = sheet.getCell(row, COL.group);
      nameCell.value = name;
      styleGroupCell(nameCell);
      const teacherRow = row + top;
      sheet.mergeCells(teacherRow, COL.group, row + count - 1, COL.group);
      const teacherCell = sheet.getCell(teacherRow, COL.group);
      teacherCell.value = teacher;
      styleGroupCell(teacherCell);
    }
    row += count;
    index = end;
  }
}

function writeStudent(sheet: ExcelJS.Worksheet, rowNumber: number, student: SheetStudent, indexInSheet: number): void {
  const row = sheet.getRow(rowNumber);
  row.height = 22;
  const band = indexInSheet % 2 === 0 ? WHITE : BEIGE;
  const name = sheet.getCell(rowNumber, COL.name);
  name.value = student.studentName;
  name.font = { name: 'Arial', size: 11 };
  name.alignment = center('bottom');
  name.fill = solid(band);
  name.border = thinBorder();

  writePercent(sheet.getCell(rowNumber, COL.mur), student.mur, band, false);
  writePercent(sheet.getCell(rowNumber, COL.tath), student.tath, band, false);
  writePercent(sheet.getCell(rowNumber, COL.hifz), student.hifz, band, false);
  writeCount(sheet.getCell(rowNumber, COL.absent), student.absence);
  writeCount(sheet.getCell(rowNumber, COL.present), student.attendance);
  student.dayLabels.forEach((label, index) => {
    const cell = sheet.getCell(rowNumber, COL.sun + index);
    cell.value = label;
    cell.font = { name: 'Arial', size: 10 };
    cell.alignment = center('middle');
    cell.border = thinBorder();
  });
  writePercent(sheet.getCell(rowNumber, COL.winMur), student.windowMur, null, true);
  writePercent(sheet.getCell(rowNumber, COL.winTath), student.windowTath, null, true);
  writePercent(sheet.getCell(rowNumber, COL.winHifz), student.windowHifz, null, true);
}

function writeFooter(sheet: ExcelJS.Worksheet, lastDataRow: number, students: SheetStudent[]): number {
  const titleRow = lastDataRow + 2;
  const labelRow = titleRow + 1;
  const valueRow = labelRow + 1;
  sheet.mergeCells(titleRow, COL.sun, titleRow, COL.thu);
  const title = sheet.getCell(titleRow, COL.sun);
  title.value = 'عدد الطلاب الحاضرين';
  title.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0000FF' } };
  title.alignment = center('middle');
  title.border = thickBorder();

  const sumLabel = sheet.getCell(labelRow, COL.present);
  sumLabel.value = 'المجموع';
  sumLabel.font = { name: 'Arial', size: 10, bold: true };
  sumLabel.alignment = center('middle');

  FOOTER_DAYS.forEach((label, index) => {
    const cell = sheet.getCell(labelRow, COL.sun + index);
    cell.value = label;
    cell.font = { name: 'Arial', size: 14, bold: true };
    cell.alignment = center('middle');
  });

  const dataRange = (column: number) => `${columnLetter(column)}${DATA_START}:${columnLetter(column)}${lastDataRow}`;
  const presentTotal = students.reduce((sum, student) => sum + student.attendance, 0);
  const total = sheet.getCell(valueRow, COL.present);
  total.value = {
    formula: `SUM(${dataRange(COL.present)})`,
    result: presentTotal,
  };
  total.font = { name: 'Arial', size: 10, bold: true };
  total.alignment = center('middle');

  DAY_HEADERS.forEach((_, index) => {
    const column = COL.sun + index;
    const range = dataRange(column);
    const result = students.filter(
      (student) => student.dayLabels[index] === 'حاضر' || student.dayLabels[index] === 'متأخر',
    ).length;
    const cell = sheet.getCell(valueRow, column);
    cell.value = {
      formula: `COUNTIF(${range},"حاضر")+COUNTIF(${range},"متأخر")`,
      result,
    };
    cell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF38761D' } };
    cell.alignment = center('middle');
    cell.border = thickBorder();
  });
  return valueRow;
}

function writeKpi(sheet: ExcelJS.Worksheet, students: SheetStudent[], lastDataRow: number): void {
  const thresholds = [5, 4, 3, 2, 1];
  KPI_TITLES.forEach((label, index) => {
    const column = COL.kpi5 + index;
    sheet.mergeCells(1, column, 2, column);
    const title = sheet.getCell(1, column);
    title.value = label;
    title.font = { name: 'Amiri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    title.fill = solid(KPI_HEADER);
    title.alignment = { ...center('middle'), wrapText: true };
    title.border = thickBorder();
    sheet.getCell(2, column).border = thickBorder();
    sheet.getCell(2, column).fill = solid(KPI_HEADER);

    const threshold = thresholds[index];
    const result = students.filter((student) => student.absence === threshold).length;
    sheet.mergeCells(3, column, 4, column);
    const value = sheet.getCell(3, column);
    const range = `${columnLetter(COL.absent)}${DATA_START}:${columnLetter(COL.absent)}${Math.max(lastDataRow, DATA_START)}`;
    value.value = students.length
      ? { formula: `COUNTIF(${range},${threshold})`, result }
      : result;
    value.font = { name: 'Amiri', size: 16, bold: true };
    value.alignment = center('middle');
    value.border = thickBorder();
    sheet.getCell(4, column).border = thickBorder();

    const unit = sheet.getCell(5, column);
    unit.value = 'طالب';
    unit.font = { name: 'Verdana', size: 15, bold: true, color: { argb: 'FF999999' } };
    unit.alignment = center('bottom');
    unit.border = thickBorder();
  });
}

function addConditionalFormatting(sheet: ExcelJS.Worksheet, lastDataRow: number): void {
  const days = `${columnLetter(COL.sun)}${DATA_START}:${columnLetter(COL.thu)}${lastDataRow}`;
  const absence = `${columnLetter(COL.absent)}${DATA_START}:${columnLetter(COL.absent)}${lastDataRow}`;
  const rates = [
    `${columnLetter(COL.mur)}${DATA_START}:${columnLetter(COL.hifz)}${lastDataRow}`,
    `${columnLetter(COL.winMur)}${DATA_START}:${columnLetter(COL.winHifz)}${lastDataRow}`,
  ].join(' ');
  let priority = 1;
  const rule = (
    ref: string,
    operator: 'equal' | 'greaterThan' | 'between',
    formulae: string[],
    argb: string,
  ): void => {
    sheet.addConditionalFormatting({
      ref,
      rules: [
        {
          type: 'cellIs',
          operator,
          formulae,
          priority: priority++,
          style: { fill: solid(argb) },
        },
      ],
    });
  };
  rule(days, 'equal', ['"حاضر"'], GREEN);
  rule(days, 'equal', ['"متأخر"'], WHITE);
  rule(days, 'equal', ['"غائب"'], RED);
  rule(days, 'equal', ['"معذور"'], EXCUSED);
  rule(absence, 'equal', ['0'], GREEN);
  rule(absence, 'equal', ['1'], WHITE);
  rule(absence, 'equal', ['2'], YELLOW);
  rule(absence, 'equal', ['3'], RED);
  rule(absence, 'greaterThan', ['3'], GREY);
  rule(rates, 'between', ['0.9', '2.99'], GREEN);
  rule(rates, 'between', ['0.8', '0.899'], AMBER);
  rule(rates, 'between', ['0.7', '0.7999'], PEACH);
  rule(rates, 'between', ['0.1', '0.6999'], PINK);
  rule(rates, 'equal', ['0'], ZERO_GREY);
  rule(rates, 'greaterThan', ['3'], BLUE);
}

function writePercent(
  cell: ExcelJS.Cell,
  value: number | null,
  band: string | null,
  bold: boolean,
): void {
  cell.font = { name: 'Arial', size: bold ? 12 : 11, bold };
  cell.alignment = center('bottom');
  cell.border = thinBorder();
  if (value == null) {
    cell.value = NULL_PERCENT;
    return;
  }
  cell.value = value / 100;
  cell.numFmt = '0.0%';
  if (band) {
    cell.fill = solid(band);
  }
}

function writeCount(cell: ExcelJS.Cell, value: number): void {
  cell.value = value;
  cell.font = { name: 'Arial', size: 11, bold: true };
  cell.alignment = center('middle');
  cell.fill = solid(GREEN);
  cell.border = thinBorder();
}

function styleGroupCell(cell: ExcelJS.Cell): void {
  cell.font = { name: 'Google Sans Mono', size: 14, bold: true };
  cell.alignment = { ...center('middle'), wrapText: true };
  cell.fill = solid(WHITE);
  cell.border = thickBorder();
}

function solid(argb: string): ExcelJS.FillPattern {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function thickBorder(): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'thick', color: { argb: 'FF000000' } };
  return { top: side, left: side, bottom: side, right: side };
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'thin', color: { argb: 'FFB7B7B7' } };
  return { top: side, left: side, bottom: side, right: side };
}

function center(vertical: 'middle' | 'bottom'): Partial<ExcelJS.Alignment> {
  return { horizontal: 'center', vertical, wrapText: false, readingOrder: 'rtl' };
}

function columnLetter(index: number): string {
  let n = index;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
