/**
 * MOCKED contract tests. HttpTestingController never leaves the process.
 * Tahfiz PR 43 (`bb490be`) is unmerged; these are not live endpoint evidence.
 */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AttendanceApiService } from '../../core/api/attendance-api.service';
import { ProgressApiService } from '../../core/api/progress-api.service';
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

  it('resolves the default active term from GET /term and does not need the active-term route', () => {
    let termId = 0;
    terms.loadForQuery({ kind: 'absent' }).subscribe((catalog) => {
      const active = catalog.terms?.find((term) => term.status === 'ACTIVE');
      termId = active?.id ?? 0;
    });
    const list = http.expectOne(requestUrl('/term'));
    list.flush({
      status: 200,
      data: [
        { id: 29, name: 'الدورة ٢٩', status: 'COMPLETED', startDate: '2026-11-03', endDate: '2026-11-07' },
        { id: 40, name: 'الدورة الحالية', status: 'ACTIVE', startDate: '2026-11-08', endDate: '2026-12-31' },
      ],
    });
    http.expectNone(`${api}/center/1/active-term`);
    expect(termId).toBe(40);
  });

  it('does not call the active term when the URL names a completed term', () => {
    let resolved = 0;
    terms.loadForQuery({ kind: 'explicit', termId: 29 }).subscribe((catalog) => {
      resolved = catalog.terms?.find((term) => term.id === 29)?.id ?? 0;
    });
    http.expectOne(requestUrl('/term')).flush({
      status: 200,
      data: [
        { id: 29, name: 'الدورة ٢٩', status: 'COMPLETED', startDate: '2026-11-03', endDate: '2026-11-07' },
        { id: 40, name: 'الدورة الحالية', status: 'ACTIVE', startDate: '2026-11-08', endDate: '2026-12-31' },
      ],
    });
    http.expectNone(`${api}/center/1/active-term`);
    http.expectNone(`${api}/term/29`);
    expect(resolved).toBe(29);
  });
});

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
