import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../core/api/api-error';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { excelExportFailureToast, type ExcelExportTranslator } from './excel-export-error';

const ATTENDANCE_FAIL = 'تعذّر تصدير تقرير الحضور';
const PROGRESS_FAIL = 'تعذّر تصدير تقرير التقدّم';

function translator(): ExcelExportTranslator & { calls: Array<{ key: string; params?: Record<string, string> }> } {
  const calls: Array<{ key: string; params?: Record<string, string> }> = [];
  return {
    calls,
    instant(key: string, params?: Record<string, string>): string {
      calls.push({ key, params });
      if (key === TOAST_I18N.errors.requestFailedWithMessage) {
        return `فشل الطلب: ${params?.['message'] ?? ''}`;
      }
      if (key === 'attendanceReport.exportExcelFail') {
        return ATTENDANCE_FAIL;
      }
      if (key === 'progressReport.exportExcelFail') {
        return PROGRESS_FAIL;
      }
      return key;
    },
  };
}

describe('excel export failure toast', () => {
  it('uses toast.error.requestFailed when the envelope has a message', () => {
    const translate = translator();
    const error = new ApiError('لا طلاب في هذه الحلقة', 400, 400, {}, 'NO_STUDENTS', {
      statusCode: 400,
      message: 'لا طلاب في هذه الحلقة',
    });

    expect(excelExportFailureToast(error, translate, 'attendanceReport.exportExcelFail')).toBe(
      'فشل الطلب: لا طلاب في هذه الحلقة',
    );
    expect(translate.calls).toEqual([
      { key: 'toast.error.requestFailed', params: { message: 'لا طلاب في هذه الحلقة' } },
    ]);
  });

  it('uses the feature تعذّر string when there is no server message', () => {
    const buildError = translator();
    expect(excelExportFailureToast(new Error('workbook'), buildError, 'attendanceReport.exportExcelFail')).toBe(
      ATTENDANCE_FAIL,
    );
    expect(buildError.calls).toEqual([{ key: 'attendanceReport.exportExcelFail', params: undefined }]);

    const network = translator();
    const offline = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error', url: '/attendance/weekly-table' });
    expect(excelExportFailureToast(offline, network, 'progressReport.exportExcelFail')).toBe(PROGRESS_FAIL);
    expect(network.calls).toEqual([{ key: 'progressReport.exportExcelFail', params: undefined }]);
  });
});
