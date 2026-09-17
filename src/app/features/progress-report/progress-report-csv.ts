import { ProgressRowVm } from './dto/progress-report-filters.dto';

/** Client-side CSV from loaded progress rows (no Nest export). */
export function buildProgressReportCsv(
  rows: ProgressRowVm[],
  meta?: { halqaName?: string; periodLabel?: string; rangeLabel?: string },
): string {
  const lines: string[] = [];
  if (meta?.halqaName || meta?.periodLabel || meta?.rangeLabel) {
    lines.push(csvRow([meta.halqaName ?? '', meta.periodLabel ?? '', meta.rangeLabel ?? '']));
  }
  lines.push(csvRow(['الطالب', 'نسبة الحفظ', 'نسبة التثبيت', 'نسبة المراجعة', 'آخر تحديث']));
  for (const row of rows) {
    lines.push(
      csvRow([
        row.studentName,
        String(row.hifzPercent),
        String(row.tathPercent),
        String(row.murPercent),
        row.lastUpdatedLabel === '—' ? '' : row.lastUpdatedLabel,
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
