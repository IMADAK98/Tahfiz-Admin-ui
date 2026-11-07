/**
 * MOCKED contract tests. HttpTestingController never leaves the process.
 * GET /term bare-array shape is from the 2026-11-07 live capture.
 * Nest ACTIVE roster filtering is still pending and is not asserted as live behavior.
 */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AttendanceApiService } from '../../core/api/attendance-api.service';
import { ProgressApiService } from '../../core/api/progress-api.service';
import { TermApiService } from '../../core/api/term-api.service';
import { API_BASE_URL } from '../../core/config/api-config';
import { AuthService } from '../../core/auth/auth.service';
import { normalizePercent } from '../progress-report/enums/progress-plan-item-type.enum';
import { ReportTermPickerComponent } from './report-term-picker';
import { ReportTermService } from './report-term.service';

const api = 'http://api.test';

function requestUrl(path: string): (req: { url: string }) => boolean {
  return (req) => req.url === `${api}${path}`;
}

describe('mocked report term HTTP contract', () => {
  let http: HttpTestingController;
  let progress: ProgressApiService;
  let attendance: AttendanceApiService;
  let terms: ReportTermService;
  let termApi: TermApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: api },
        { provide: AuthService, useValue: { getClaims: () => ({ centerId: 1 }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    progress = TestBed.inject(ProgressApiService);
    attendance = TestBed.inject(AttendanceApiService);
    terms = TestBed.inject(ReportTermService);
    termApi = TestBed.inject(TermApiService);
  });

  afterEach(() => http.verify());

  it('sends the active termId and keeps dates beside period', () => {
    progress
      .getProgressReport({
        halqaId: 27,
        period: 'day',
        startingDate: '2026-11-05',
        endingDate: '2026-11-05',
        termId: 40,
      })
      .subscribe();
    const request = http.expectOne(requestUrl('/reports/progress'));
    expect(request.request.params.get('halqaId')).toBe('27');
    expect(request.request.params.get('period')).toBe('day');
    expect(request.request.params.get('startingDate')).toBe('2026-11-05');
    expect(request.request.params.get('endingDate')).toBe('2026-11-05');
    expect(request.request.params.get('termId')).toBe('40');
    request.flush({ status: 200, data: { halqa: { id: 27, name: 'H1' }, students: [] } });
  });

  it('omits termId for a legacy progress caller', () => {
    progress
      .getProgressReport({
        halqaId: 27,
        period: 'week',
        startingDate: '2026-11-08',
        endingDate: '2026-11-12',
      })
      .subscribe();
    const request = http.expectOne(requestUrl('/reports/progress'));
    expect(request.request.params.has('termId')).toBe(false);
    request.flush({ status: 200, data: { halqa: { id: 27, name: 'H1' }, students: [] } });
  });

  it('sends termId and omits halqaId for every active ḥalaqa in the selected term', () => {
    attendance.getCenterWeeklyTable('2026-11-08', null, 40).subscribe();
    const request = http.expectOne(requestUrl('/attendance/weekly-table'));
    expect(request.request.params.get('weekStartDate')).toBe('2026-11-08');
    expect(request.request.params.get('termId')).toBe('40');
    expect(request.request.params.has('halqaId')).toBe(false);
    request.flush({ status: 200, data: { halqa: null, students: [], columns: [] } });
  });

  it('keeps the legacy center grid when termId is omitted', () => {
    attendance.getCenterWeeklyTable('2026-11-08', null).subscribe();
    const request = http.expectOne(requestUrl('/attendance/weekly-table'));
    expect(request.request.params.has('termId')).toBe(false);
    expect(request.request.params.has('halqaId')).toBe(false);
    request.flush({ status: 200, data: { students: [], columns: [] } });
  });

  it('sends termId on one ḥalaqa and on the per-ḥalaqa route', () => {
    attendance.getCenterWeeklyTable('2026-11-03', 27, 29).subscribe();
    attendance.getWeeklyTable(27, '2026-11-03', undefined, 29).subscribe();
    const center = http.expectOne(requestUrl('/attendance/weekly-table'));
    const halqa = http.expectOne(requestUrl('/attendance/halqa/27/weekly-table'));
    expect(center.request.params.get('halqaId')).toBe('27');
    expect(center.request.params.get('termId')).toBe('29');
    expect(halqa.request.params.get('termId')).toBe('29');
    expect(halqa.request.params.has('studentId')).toBe(false);
    center.flush({ status: 200, data: { students: [], columns: [] } });
    halqa.flush({ status: 200, data: { halqa: { id: 27, name: 'H1' }, students: [], columns: [] } });
  });

  it('sends includeInactive=true only for the historical ḥalaqa list', () => {
    attendance.getHalqasByTerm(29, true).subscribe();
    attendance.getHalqasByTerm(40, false).subscribe();
    const historical = http.expectOne(requestUrl('/halqa/by-term/29'));
    const current = http.expectOne(requestUrl('/halqa/by-term/40'));
    expect(historical.request.params.get('includeInactive')).toBe('true');
    expect(current.request.params.has('includeInactive')).toBe(false);
    historical.flush({ status: 200, data: [{ id: 27, name: 'H1' }] });
    current.flush({ status: 200, data: [{ id: 27, name: 'H1' }] });
  });

  it('reads GET /term as a bare array and rejects an envelope', () => {
    const seen: { id: number; status: string; startDate: string }[] = [];
    termApi.listTerms().subscribe((rows) => seen.push(...rows));
    http.expectOne(requestUrl('/term')).flush([termListRow()]);
    expect(seen).toEqual([
      expect.objectContaining({
        id: 29,
        status: 'COMPLETED',
        startDate: '2026-11-03T00:00:00.000Z',
        endDate: '2026-11-07T00:00:00.000Z',
        name: 'SMOKE E2E دورة نوفمبر',
      }),
    ]);

    let rejected = false;
    termApi.listTerms().subscribe({
      next: () => {
        throw new Error('envelope was treated as a term list');
      },
      error: () => {
        rejected = true;
      },
    });
    http.expectOne(requestUrl('/term')).flush({ status: 200, data: [termListRow()] });
    expect(rejected).toBe(true);
  });

  it('derives the default ACTIVE term from the bare list and does not call active-term', () => {
    let termId = 0;
    let startDate = '';
    terms.loadForQuery({ kind: 'absent' }).subscribe((catalog) => {
      const active = catalog.terms?.find((term) => term.status === 'ACTIVE');
      termId = active?.id ?? 0;
      startDate = active?.startDate ?? '';
    });
    http.expectOne(requestUrl('/term')).flush([
      termListRow(),
      termListRow({
        id: 40,
        name: 'الدورة الحالية',
        status: 'ACTIVE',
        startDate: '2026-11-08T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
      }),
    ]);
    http.expectNone(`${api}/center/1/active-term`);
    expect(termId).toBe(40);
    expect(startDate).toBe('2026-11-08');
  });

  it('keeps a completed term selectable when the list has no ACTIVE term', () => {
    let ids: number[] = [];
    let statuses: string[] = [];
    terms.loadForQuery({ kind: 'absent' }).subscribe((catalog) => {
      ids = catalog.terms?.map((term) => term.id) ?? [];
      statuses = catalog.terms?.map((term) => term.status) ?? [];
      expect(catalog.activeFromBootstrap).toBeNull();
    });
    http.expectOne(requestUrl('/term')).flush([termListRow()]);
    http.expectNone(`${api}/center/1/active-term`);
    expect(ids).toEqual([29]);
    expect(statuses).toEqual(['COMPLETED']);
  });

  it('does not call the active term when the URL names a completed term', () => {
    let resolved = 0;
    let startDate = '';
    terms.loadForQuery({ kind: 'explicit', termId: 29 }).subscribe((catalog) => {
      const term = catalog.terms?.find((item) => item.id === 29);
      resolved = term?.id ?? 0;
      startDate = term?.startDate ?? '';
    });
    http.expectOne(requestUrl('/term')).flush([
      termListRow(),
      termListRow({ id: 40, name: 'الدورة الحالية', status: 'ACTIVE' }),
    ]);
    http.expectNone(`${api}/center/1/active-term`);
    http.expectNone(`${api}/term/29`);
    expect(resolved).toBe(29);
    expect(startDate).toBe('2026-11-03');
  });
});

/** Live term 29 identity. Other keys are present; their values were not in the capture excerpt. */
function termListRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 29,
    createdAt: '2026-11-07T10:12:59.056Z',
    updatedAt: '2026-11-07T10:12:59.056Z',
    deletedAt: null,
    name: 'SMOKE E2E دورة نوفمبر',
    startDate: '2026-11-03T00:00:00.000Z',
    endDate: '2026-11-07T00:00:00.000Z',
    registerationStartDate: '2026-11-01T00:00:00.000Z',
    registerationEndDate: '2026-11-02T00:00:00.000Z',
    status: 'COMPLETED',
    holidayDates: [],
    center: null,
    termDays: [],
    ...overrides,
  };
}

describe('saved-row display clamp', () => {
  it('clamps the existing UI contract and leaves 25 untouched', () => {
    expect(normalizePercent(150)).toBe(100);
    expect(normalizePercent(25)).toBe(25);
    expect(normalizePercent(0)).toBe(0);
  });
});

describe('report term picker', () => {
  it('shows the completed term as read-only', async () => {
    await TestBed.configureTestingModule({
      imports: [ReportTermPickerComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ReportTermPickerComponent);
    fixture.componentRef.setInput('terms', [
      { id: 29, name: 'الدورة ٢٩', status: 'COMPLETED', startDate: '2026-11-03', endDate: '2026-11-07' },
    ]);
    fixture.componentRef.setInput('selectedTermId', 29);
    fixture.componentRef.setInput('heading', 'الدورة ٢٩ · مكتملة');
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('الدورة ٢٩ · مكتملة');
    expect(text).toContain('دورة مكتملة — للعرض فقط');
    expect(text).toContain('3 نوفمبر 2026');
  });
});
