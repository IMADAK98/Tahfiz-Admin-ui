import { computed, EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { providePrimeNG } from 'primeng/config';
import { of } from 'rxjs';
import { ProgressReportResponse } from '../../core/api/models/progress.model';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { ReportTermService } from '../report-term/report-term.service';
import { buildProgressReportCsv } from './progress-report-csv';
import { ProgressReportComponent } from './progress-report';
import { ProgressReportService } from './progress-report.service';

class TranslateStub {
  onLangChange = new EventEmitter<unknown>();
  onTranslationChange = new EventEmitter<unknown>();
  onDefaultLangChange = new EventEmitter<unknown>();
  currentLang = 'ar';
  instant(key: string): string {
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

const report: ProgressReportResponse = {
  halqa: { id: 7, name: 'حلقة الفجر' },
  students: [
    {
      studentId: 1,
      studentName: 'أحمد',
      progress: [
        { planItemType: 'HIFZ', totalPercentage: 115 },
        { planItemType: 'TATHBEET', totalPercentage: 200 },
        { planItemType: 'MURAJAA', totalPercentage: null },
      ],
    },
    {
      studentId: 2,
      studentName: 'خالد',
      progress: [
        { planItemType: 'HIFZ', totalPercentage: 0 },
        { planItemType: 'TATHBEET', totalPercentage: 40 },
      ],
    },
  ],
};

describe('ProgressReportComponent percent cells', () => {
  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [ProgressReportComponent],
      providers: [
        provideNoopAnimations(),
        providePrimeNG(),
        { provide: TranslateService, useClass: TranslateStub },
        {
          provide: ToastMessageService,
          useValue: { show: vi.fn(), notifyWarnBody: vi.fn(), notifyErrorBody: vi.fn() },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
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
          provide: ProgressReportService,
          useValue: {
            loadHalqaOptions: () => of([{ id: 7, name: 'حلقة الفجر' }]),
            loadProgress: () => of(report),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProgressReportComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function cells(root: HTMLElement): string[][] {
    return Array.from(root.querySelectorAll('tbody tr')).map((tr) =>
      Array.from(tr.querySelectorAll('.pct')).map((el) => el.textContent!.trim()),
    );
  }

  function barWidths(root: HTMLElement): string[][] {
    return Array.from(root.querySelectorAll('tbody tr')).map((tr) =>
      Array.from(tr.querySelectorAll<HTMLElement>('.pct-bar > span')).map((el) => el.style.width),
    );
  }

  it("shows real values above 100, '—' for null/missing types, and 0% for a real 0", async () => {
    const root = await render();
    expect(cells(root)).toEqual([
      ['115%', '200%', '—'],
      ['0%', '40%', '—'],
    ]);
    expect(barWidths(root)).toEqual([
      ['100%', '100%', '0%'],
      ['0%', '40%', '0%'],
    ]);
  });
});

describe('buildProgressReportCsv percents', () => {
  it("writes the real value and '—' for null", () => {
    const csv = buildProgressReportCsv([
      {
        studentId: 1,
        studentName: 'S1',
        hifzPercent: 115,
        tathPercent: 0,
        murPercent: null,
        lastUpdatedLabel: '—',
        lastUpdatedRaw: null,
      },
    ]);
    expect(csv.split('\n').at(-1)).toBe('S1,115,0,—,');
  });
});
