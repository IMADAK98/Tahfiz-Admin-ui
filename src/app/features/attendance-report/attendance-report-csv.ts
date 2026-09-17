import { AttendanceDayHeaderVm, AttendanceRowVm } from './dto/attendance-report-filters.dto';

/** Client-side CSV from loaded weekly grid (no Nest export). */
export function buildAttendanceWeeklyCsv(
  headers: AttendanceDayHeaderVm[],
  rows: AttendanceRowVm[],
  meta?: { halqaName?: string; weekLabel?: string },
): string {
  const dayTitles = headers.map((h) => {
    const title = `${h.dowAr} ${h.dayOfMonth}`;
    return h.isHoliday ? `${title} عطلة` : title;
  });
  const lines: string[] = [];
  if (meta?.halqaName || meta?.weekLabel) {
    lines.push(csvRow([meta.halqaName ?? '', meta.weekLabel ?? '']));
  }
  lines.push(csvRow(['الطالب', ...dayTitles]));
  for (const row of rows) {
    lines.push(
      csvRow([
        row.studentName,
        ...row.cells.map((c) => (c.viewKind === 'blank' || c.viewKind === 'holiday' ? '' : c.label)),
      ]),
    );
  }
  return '\uFEFF' + lines.join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvRow(cells: string[]): string {
  return cells.map(escapeCsv).join(',');
}

function escapeCsv(value: string): string {
  const v = value ?? '';
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
