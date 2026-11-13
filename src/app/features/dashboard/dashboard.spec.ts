import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { of } from 'rxjs';
import { ActiveTerm } from '../../core/api/models/term.model';
import { AuthService } from '../../core/auth/auth.service';
import { API_BASE_URL } from '../../core/config/api-config';
import { httpErrorToApiInterceptor } from '../../core/http/http-error-to-api.interceptor';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { CreateTermModalComponent } from '../terms/create-term-modal/create-term-modal';
import { EditTermModalComponent } from '../terms/edit-term-modal/edit-term-modal';
import { TermsService } from '../terms/terms.service';
import { DashboardComponent } from './dashboard';

const PERFORMANCE_URL = 'https://api.test/dashboard/term/30/halqa-performance';

const activeTerm = {
  id: 30,
  name: 'الدورة 30',
  startDate: '2026-09-13',
  endDate: '2026-12-24',
  status: 'ACTIVE',
} as ActiveTerm;

const nullRow = {
  halaqaId: 9,
  name: 'حلقة الإنتاج',
  teacherName: 'معلم واحد',
  studentCount: 3,
  attendance: { present: 0, late: 0, absent: 0, leave: 0 },
  attendanceRate: null,
  typeAverages: { HIFZ: null, TATHBEET: null, MURAJAA: null },
  coverage: null,
  score: null,
  rank: 1,
};

describe('DashboardComponent «أداء الحلقات»', () => {
  let http: HttpTestingController;
  let getActiveTerm: ReturnType<typeof vi.fn>;

  async function render(url: string, term: ActiveTerm | null = activeTerm) {
    getActiveTerm.mockReturnValue(of(term));
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  const card = (fixture: ComponentFixture<DashboardComponent>) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[aria-labelledby="ov-h"]');
  const rows = (fixture: ComponentFixture<DashboardComponent>) =>
    Array.from(card(fixture)?.querySelectorAll<HTMLElement>('tr.ov-row') ?? []);

  beforeEach(() => {
    getActiveTerm = vi.fn();
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([httpErrorToApiInterceptor])),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        providePrimeNG(),
        { provide: API_BASE_URL, useValue: 'https://api.test' },
        { provide: AuthService, useValue: { getClaims: () => ({ centerId: 1 }) } },
        { provide: TermsService, useValue: { getActiveTerm } },
        { provide: ToastMessageService, useValue: {} },
      ],
    });
    TestBed.overrideComponent(DashboardComponent, {
      remove: { imports: [CreateTermModalComponent, EditTermModalComponent] },
      add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the loading state while the live request is pending', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL);
    expect(card(fixture)?.querySelector('[role="status"]')?.textContent).toContain(
      'جاري تحميل الحلقات…',
    );
    expect(rows(fixture)).toHaveLength(0);
  });

  it('shows the Nest error with a retry that calls the endpoint again', async () => {
    const fixture = await render('/');
    http
      .expectOne(PERFORMANCE_URL)
      .flush(
        { statusCode: 404, message: 'الدورة غير موجودة', code: 'TERM_NOT_FOUND' },
        { status: 404, statusText: 'Not Found' },
      );
    fixture.detectChanges();
    const alert = card(fixture)?.querySelector<HTMLElement>('[role="alert"]');
    expect(alert?.textContent).toContain('الدورة غير موجودة');

    alert?.querySelector('button')?.click();
    fixture.detectChanges();
    http.expectOne(PERFORMANCE_URL).flush({ status: 200, message: 'ok', data: [nullRow] });
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(1);
  });

  it('falls back to the app error string when the failure has no Nest body', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(card(fixture)?.querySelector('[role="alert"]')?.textContent).toContain(
      'تعذّر تحميل الحلقات',
    );
  });

  it('shows the empty state for a term with no rows', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).flush({ status: 200, message: 'ok', data: [] });
    fixture.detectChanges();
    expect(card(fixture)?.querySelector('.empty-chart')?.textContent).toContain(
      'لا توجد حلقات نشطة في الدورة المحددة.',
    );
    expect(rows(fixture)).toHaveLength(0);
  });

  it('renders an all-null live row as dashes, never 0%, with no sample tag or marking hint', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).flush({ status: 200, message: 'ok', data: [nullRow] });
    fixture.detectChanges();
    const [row] = rows(fixture);
    expect(row.querySelector('.ov-score b')?.textContent?.trim()).toBe('—');
    expect(
      Array.from(row.querySelectorAll('.ov-num')).map((cell) => cell.textContent?.trim()),
    ).toEqual(['—', '—']);
    expect(row.textContent).not.toContain('0%');
    expect(row.classList).not.toContain('is-inc');
    expect(row.querySelector('p-tag')).toBeNull();
    expect(card(fixture)?.querySelector('.tag-sample')).toBeNull();
    expect(row.getAttribute('aria-label')).toContain('حلقة الإنتاج');
  });

  it('uses mock rows under ?mock= and makes no performance call', async () => {
    const fixture = await render('/?mock=populated');
    http.expectNone(PERFORMANCE_URL);
    expect(rows(fixture)).toHaveLength(8);
    expect(rows(fixture)[0].textContent).toContain('حلقة الناشئين');
    expect(card(fixture)?.querySelector('.tag-sample')).not.toBeNull();
  });

  it('keeps the no-term state and skips the call when there is no active term', async () => {
    const fixture = await render('/', null);
    http.expectNone(PERFORMANCE_URL);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.empty-block h2')?.textContent).toContain('لا توجد دورة نشطة');
    expect(card(fixture)).toBeNull();
  });
});
