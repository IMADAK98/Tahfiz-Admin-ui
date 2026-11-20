import { writeFileSync } from 'node:fs';
import { sampleWeeklyReportInput } from '../src/app/features/weekly-report-excel/weekly-report-sample.ts';
import {
  assembleWeeklyReport,
  buildWeeklyReportWorkbook,
} from '../src/app/features/weekly-report-excel/weekly-report-workbook.ts';

const out = process.argv[2] ?? '/opt/cursor/artifacts/sample-export.xlsx';
const workbook = buildWeeklyReportWorkbook(assembleWeeklyReport(sampleWeeklyReportInput()));
for (const sheet of workbook.worksheets) {
  sheet.pageSetup.orientation = 'landscape';
  sheet.pageSetup.paperSize = 8;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 1;
  sheet.pageSetup.horizontalCentered = true;
}
const buffer = await workbook.xlsx.writeBuffer();
writeFileSync(out, Buffer.from(buffer));
console.log(`wrote ${out} sheets=${workbook.worksheets.map((sheet) => sheet.name).join(' | ')}`);
