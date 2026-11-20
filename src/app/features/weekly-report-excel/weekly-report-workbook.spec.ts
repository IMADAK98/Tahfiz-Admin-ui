import ExcelJS from 'exceljs';
import { sampleWeeklyReportInput } from './weekly-report-sample';
import {
  assembleWeeklyReport,
  attendanceMarkLabel,
  buildWeeklyReportWorkbook,
  countAttendance,
  termSundayWeeks,
  weekSheetTitle,
} from './weekly-report-workbook';

const DROPPED = [
  'نقاط الأسبوع',
  'مجموع النقاط',
  'عدد أوجه الأسبوع',
  'استمارة رقم',
  'لم يحفظ',
  'لم يحفط',
  'لم يسمع',
  'عدد الطلاب لم يحفظوا',
];

describe('weekly report workbook', () => {
  it('names one sheet per term week plus the term sheet', () => {
    expect(termSundayWeeks('2026-11-01', '2026-11-12')).toEqual(['2026-11-01', '2026-11-08']);
    expect(termSundayWeeks('2026-11-12', '2026-11-01')).toEqual([]);
    expect(weekSheetTitle(1)).toBe('الأسبوع 1');
    expect(weekSheetTitle(2)).toBe('الأسبوع الثاني');
    expect(weekSheetTitle(17)).toBe('الأسبوع السابع عشر');
    const sheets = assembleWeeklyReport(sampleWeeklyReportInput());
    expect(sheets.map((sheet) => sheet.name)).toEqual(['الأسبوع 1', 'الأسبوع الثاني', 'للفصل الدراسي']);
    expect(sheets[0].students).toHaveLength(8);
    expect(sheets[2].students).toHaveLength(8);
  });

  it('maps LEAVE to معذور and keeps null percents distinct from zero', () => {
    expect(attendanceMarkLabel('LEAVE')).toBe('معذور');
    expect(attendanceMarkLabel('EXCUSED')).toBe('معذور');
    expect(attendanceMarkLabel('NOT_MARKED')).toBe('');
    expect(attendanceMarkLabel('PRESENT', true)).toBe('');
    expect(countAttendance(['حاضر', 'متأخر', 'معذور', 'غائب', ''])).toBe(2);
  });

  it('builds the week sheet from the template rules', async () => {
    const built = buildWeeklyReportWorkbook(assembleWeeklyReport(sampleWeeklyReportInput()));
    const live = built.getWorksheet('الأسبوع 1');
    expect(live).toBeTruthy();
    const formatting = (
      live as unknown as { conditionalFormattings?: Array<{ rules: Array<{ formulae?: string[] }> }> }
    ).conditionalFormattings;
    const formulae = (formatting ?? []).flatMap((entry) => entry.rules.flatMap((rule) => rule.formulae ?? []));
    expect(formulae).toContain('"حاضر"');
    expect(formulae).toContain('"معذور"');
    expect(formulae.join(' ')).not.toContain('لم يحفظ');

    const raw = await built.xlsx.writeBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(raw);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'الأسبوع 1',
      'الأسبوع الثاني',
      'للفصل الدراسي',
    ]);

    const sheet = workbook.getWorksheet('الأسبوع 1')!;
    const view = sheet.views[0];
    expect(view.rightToLeft).toBe(true);
    expect(view.state).toBe('frozen');
    expect(view.state === 'frozen' ? view.ySplit : 0).toBe(2);

    expect(sheet.getCell('B2').value).toBe('الاسم');
    expect(sheet.getCell('C2').value).toBe('نسبة المراجعة');
    expect(sheet.getCell('D2').value).toBe('نسبة التثبيت');
    expect(sheet.getCell('E2').value).toBe('نسبة الحفظ');
    expect(sheet.getCell('F2').value).toBe('الغياب');
    expect(sheet.getCell('G2').value).toBe('الحضور');
    expect(sheet.getCell('I2').value).toBe('الاحد');
    expect(sheet.getCell('L2').value).toBe('الاربعاء');
    expect(sheet.getCell('M2').value).toBe('الخميس');
    expect(sheet.getCell('C1').value).toBe('الأسبوع 1');
    expect(sheet.getCell('O1').value).toBe('معدل المراجعة');
    expect(sheet.getCell('O2').value).toBe('الأسبوع 1');
    expect(fillArgb(sheet.getCell('B2'))).toBe('FFC9BA8F');
    expect(sheet.getCell('S1').value).toBe('عدد طلاب المنقطعين');
    expect(sheet.getCell('W1').value).toBe('عدد الطلاب الغائبين (يوم)');
    expect(sheet.getCell('S5').value).toBe('طالب');

    const text = cellText(sheet);
    for (const dropped of DROPPED) {
      expect(text).not.toContain(dropped);
    }

    expect(sheet.getCell('A3').value).toBe('حلقة الفجر');
    expect(sheet.getCell('A4').master.address).toBe('A3');
    expect(sheet.getCell('A5').value).toBe('أ. خالد');
    expect(sheet.getCell('A6').value).toBe('حلقة الظهر');
    expect(sheet.getCell('A8').value).toBe('أ. منى');
    expect(sheet.getCell('A9').value).toBe('حلقة العصر');
    expect(sheet.getCell('A10').value).toBe('أ. سالم');

    expect(sheet.getCell('B3').value).toBe('سارة');
    expect(sheet.getCell('C3').value).toBeCloseTo(1.5);
    expect(sheet.getCell('C3').numFmt).toBe('0.0%');
    expect(sheet.getCell('D3').value).toBe('—');
    expect(sheet.getCell('E3').value).toBe(0);
    expect(sheet.getCell('Q9').value).toBeCloseTo(2);
    expect(sheet.getCell('Q7').value).toBe('—');
    expect(sheet.getCell('C5').value).toBe(0);

    expect(sheet.getCell('I3').value).toBe('حاضر');
    expect(sheet.getCell('J3').value).toBe('غائب');
    expect(sheet.getCell('K3').value).toBe('متأخر');
    expect(sheet.getCell('L3').value).toBe('معذور');
    expect(sheet.getCell('I7').value).toBe('');
    expect(sheet.getCell('F3').value).toBe(1);
    expect(sheet.getCell('G3').value).toBe(3);
    expect(sheet.getCell('F5').value).toBe(5);

    const lastStudentRow = 10;
    expect(sheet.rowCount).toBe(14);
    expect(sheet.getCell(`B${lastStudentRow}`).value).toBe('آدم');
    expect(sheet.getCell('B11').value ?? null).toBeNull();

    expect(sheet.getCell('I12').value).toBe('عدد الطلاب الحاضرين');
    expect(sheet.getCell('G13').value).toBe('المجموع');
    expect(sheet.getCell('I13').value).toBe('الأحد');
    expect(sheet.getCell('L13').value).toBe('الأربعاء');

    const sunday = formulaOf(sheet.getCell('I14').value);
    expect(sunday.formula).toContain('حاضر');
    expect(sunday.formula).toContain('متأخر');
    expect(sunday.formula).not.toContain('معذور');
    expect(sunday.formula).not.toContain('لم يحفظ');
    expect(sunday.result).toBe(6);
    expect(formulaOf(sheet.getCell('G14').value).result).toBe(
      [3, 5, 0, 3, 0, 3, 4, 4].reduce((sum, count) => sum + count, 0),
    );
    expect(formulaOf(sheet.getCell('S3').value).result).toBe(1);

    const term = workbook.getWorksheet('للفصل الدراسي')!;
    expect(term.getCell('C1').value).toBe('للفصل الدراسي');
    expect(term.getCell('O2').value).toBe('للفصل الدراسي');
    expect(term.getCell('C3').value).toBeCloseTo(1.8);
    expect(term.getCell('D3').value).toBe('—');
    expect(term.getCell('E3').value).toBeCloseTo(0.4);
    expect(term.getCell('Q9').value).toBeCloseTo(2.5);
    expect(term.rowCount).toBe(14);
    expect(term.getCell('I3').value).toBe('');
    expect(term.getCell('F3').value).toBe(1);
    expect(term.getCell('G3').value).toBe(8);
    expect(term.getCell('B11').value ?? null).toBeNull();
    for (const dropped of DROPPED) {
      expect(cellText(term)).not.toContain(dropped);
    }
  });
});

function fillArgb(cell: ExcelJS.Cell): string | undefined {
  const fill = cell.fill;
  if (fill && fill.type === 'pattern') {
    return fill.fgColor?.argb;
  }
  return undefined;
}

function cellText(sheet: ExcelJS.Worksheet): string {
  const parts: string[] = [];
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (typeof cell.value === 'string') {
        parts.push(cell.value);
      }
    });
  });
  return parts.join('\n');
}

function formulaOf(value: ExcelJS.CellValue): { formula: string; result: number | null } {
  if (value && typeof value === 'object' && 'formula' in value) {
    const formula = String(value.formula ?? '');
    const result = 'result' in value && typeof value.result === 'number' ? value.result : null;
    return { formula, result };
  }
  return { formula: '', result: typeof value === 'number' ? value : null };
}
