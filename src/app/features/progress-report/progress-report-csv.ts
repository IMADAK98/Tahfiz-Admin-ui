import type { ProgressRowVm } from './dto/progress-report-filters.dto';

/** Client-side CSV from loaded progress rows (no Nest export). */
export function buildProgressReportCsv(
  rows: ProgressRowVm[],
  meta?: {
    halqaName?: string;
    periodLabel?: string;
    rangeLabel?: string;
    termName?: string;
    termStatusLabel?: string;
    termStart?: string;
    termEnd?: string;
  },
): string {
  const lines: string[] = [];
  if (
    meta?.halqaName ||
    meta?.periodLabel ||
    meta?.rangeLabel ||
    meta?.termName ||
    meta?.termStatusLabel
  ) {
    const cells = [meta.halqaName ?? '', meta.periodLabel ?? '', meta.rangeLabel ?? ''];
    if (meta.termName || meta.termStatusLabel || meta.termStart || meta.termEnd) {
      cells.push(meta.termName ?? '', meta.termStatusLabel ?? '', meta.termStart ?? '', meta.termEnd ?? '');
    }
    lines.push(csvRow(cells));
  }
  lines.push(csvRow(['الطالب', 'نسبة الحفظ', 'نسبة التثبيت', 'نسبة المراجعة', 'آخر تحديث']));
  for (const row of rows) {
    lines.push(
      csvRow([
        row.studentName,
        String(row.hifzPercent ?? '—'),
        String(row.tathPercent ?? '—'),
        String(row.murPercent ?? '—'),
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
