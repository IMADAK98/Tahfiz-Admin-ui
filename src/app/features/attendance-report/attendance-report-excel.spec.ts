import { HttpErrorResponse } from '@angular/common/http';
import { computed, EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { providePrimeNG } from 'primeng/config';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { ReportTermService } from '../report-term/report-term.service';
import { WeeklyReportExcelService } from '../weekly-report-excel/weekly-report-excel.service';
import { AttendanceReportComponent } from './attendance-report';
import { AttendanceReportService } from './attendance-report.service';

class TranslateStub {
  onLangChange = new EventEmitter<unknown>();
  onTranslationChange = new EventEmitter<unknown>();
  onDefaultLangChange = new EventEmitter<unknown>();
  currentLang = 'ar';
  instant(key: string, params?: Record<string, string>): string {
    if (key === 'toast.error.requestFailed') {
      return `فشل الطلب: ${params?.['message'] ?? ''}`;
    }
    if (key === 'attendanceReport.exportExcelFail') {
      return 'تعذّر تصدير تقرير الحضور';
    }
    return key;
  }
  get(key: string) {
    return of(key);
  }
  translate(key: unknown) {
    const resolved = typeof key === 'function' ? (key as () => string)() : String(key ?? '');
    return computed(() => this.instant(resolved));
  }
}

const term = {
  id: 40,
  name: 'الدورة الحالية',
  status: 'ACTIVE' as const,
  startDate: '2026-11-08',
  endDate: '2026-12-31',
};

describe('AttendanceReportComponent Excel export errors', () => {
  async function render(exportWorkbook: () => Observable<unknown>): Promise<{
    component: AttendanceReportComponent;
    notifyErrorBody: ReturnType<typeof vi.fn>;
  }> {
    TestBed.resetTestingModule();
    const notifyErrorBody = vi.fn();
    await TestBed.configureTestingModule({
      imports: [AttendanceReportComponent],
      providers: [
        provideNoopAnimations(),
        providePrimeNG(),
        { provide: TranslateService, useClass: TranslateStub },
        {
          provide: ToastMessageService,
          useValue: { show: vi.fn(), notifyWarnBody: vi.fn(), notifyErrorBody },
        },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({ termId: '40' })),
            snapshot: { queryParamMap: convertToParamMap({ termId: '40' }) },
          },
        },
        {
          provide: ReportTermService,
          useValue: {
            changes: () => of({ terms: [term], listErrorMessage: null }),
            retryList: vi.fn(),
          },
        },
        {
          provide: AttendanceReportService,
          useValue: {
            loadHalqaFilterOptions: () => of([{ value: 'all', name: 'كل الحلقات النشطة' }]),
            loadCenterWeeklyTable: () =>
              of({
                halqa: null,
                weekStartDate: '2026-11-08',
                weekEndDate: '2026-11-12',
                columns: [{ dayOfWeek: 'SUNDAY', date: '2026-11-08' }],
                students: [
                  {
                    student: { id: 1, name: 'أحمد' },
                    days: [{ date: '2026-11-08', status: 'PRESENT' }],
                    halqa: { id: 7, name: 'حلقة الفجر' },
                  },
                ],
              }),
          },
        },
        { provide: WeeklyReportExcelService, useValue: { exportWorkbook } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AttendanceReportComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { component: fixture.componentInstance, notifyErrorBody };
  }

  it('shows فشل الطلب with the envelope message when Excel export fails', async () => {
    const { component, notifyErrorBody } = await render(() =>
      throwError(
        () =>
          new ApiError('الأسبوع خارج الدورة', 400, 400, {}, undefined, {
            message: 'الأسبوع خارج الدورة',
          }),
      ),
    );
    component.exportExcel();
    expect(notifyErrorBody).toHaveBeenCalledWith('فشل الطلب: الأسبوع خارج الدورة');
  });

  it('shows تعذّر تصدير تقرير الحضور when Excel export fails without a server message', async () => {
    const { component, notifyErrorBody } = await render(() =>
      throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' })),
    );
    component.exportExcel();
    expect(notifyErrorBody).toHaveBeenCalledWith('تعذّر تصدير تقرير الحضور');
  });
});
