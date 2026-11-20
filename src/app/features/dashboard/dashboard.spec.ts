import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
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
      'جارٍ تحميل الحلقات…',
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
    expect(alert?.querySelector('strong')?.textContent).toBe('تعذّر تحميل الحلقات');
    expect(alert?.textContent).toContain('الدورة غير موجودة');
    expect(alert?.querySelector('button')?.textContent?.trim()).toBe('إعادة المحاولة');

    alert?.querySelector('button')?.click();
    fixture.detectChanges();
    http.expectOne(PERFORMANCE_URL).flush({ status: 200, message: 'ok', data: [nullRow] });
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(1);
  });

  it('shows only the error title when the failure has no Nest body', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).error(new ProgressEvent('error'));
    fixture.detectChanges();
    const alert = card(fixture)?.querySelector<HTMLElement>('[role="alert"]');
    expect(alert?.querySelector('strong')?.textContent).toBe('تعذّر تحميل الحلقات');
    expect(alert?.querySelector('span')).toBeNull();
  });

  it('reads null values as «بلا بيانات بعد» in the row aria-label', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).flush({
      status: 200,
      message: 'ok',
      data: [{ ...nullRow, name: 'حلقة أبي بكر', attendanceRate: 92 }],
    });
    fixture.detectChanges();
    expect(rows(fixture)[0].getAttribute('aria-label')).toBe(
      'حلقة أبي بكر: الدرجة بلا بيانات بعد، الحضور 92%، التغطية بلا بيانات بعد. فتح تفاصيل الحلقة',
    );
  });

  it('reads a scored row with a bare score and percent attendance and coverage', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).flush({
      status: 200,
      message: 'ok',
      data: [{ ...nullRow, attendanceRate: 87.5, coverage: 74.26, score: 80.88 }],
    });
    fixture.detectChanges();
    expect(rows(fixture)[0].getAttribute('aria-label')).toBe(
      'حلقة الإنتاج: الدرجة 81، الحضور 88%، التغطية 74%. فتح تفاصيل الحلقة',
    );
  });

  it('shows the empty state for a term with no rows', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).flush({ status: 200, message: 'ok', data: [] });
    fixture.detectChanges();
    expect(card(fixture)?.querySelector('.empty-chart')?.textContent).toContain(
      'لا توجد حلقات نشطة في هذه الدورة.',
    );
    expect(rows(fixture)).toHaveLength(0);
  });

  it('renders an all-null live row as dashes, never 0%', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).flush({ status: 200, message: 'ok', data: [nullRow] });
    fixture.detectChanges();
    const [row] = rows(fixture);
    expect(row.querySelector('.ov-score b')?.textContent?.trim()).toBe('—');
    expect(
      Array.from(row.querySelectorAll('.ov-num')).map((cell) => cell.textContent?.trim()),
    ).toEqual(['—', '—']);
    expect(row.textContent).not.toContain('0%');
    expect(row.getAttribute('aria-label')).toContain('حلقة الإنتاج');
  });

  it('shows the real active-term fields in the term bar and only real-data blocks', async () => {
    const fixture = await render('/');
    http.expectOne(PERFORMANCE_URL).flush({ status: 200, message: 'ok', data: [nullRow] });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const banner = element.querySelector<HTMLElement>('.term-banner');
    expect(banner?.querySelector('.term-name strong')?.textContent).toBe('الدورة 30');
    expect(banner?.querySelector('.term-meta')?.textContent?.trim()).toBe(
      '13 سبتمبر – 24 ديسمبر 2026',
    );
    expect(banner?.textContent).toContain('نشطة');
    expect(element.querySelectorAll('section[aria-labelledby]')).toHaveLength(1);
    expect(element.querySelector('.kpi-grid, .tag-sample')).toBeNull();
  });

  it('shows the page error and makes no performance call when the active term fails', async () => {
    getActiveTerm.mockReturnValue(throwError(() => new ApiError('تعذّر الاتصال', 500)));
    await TestBed.inject(Router).navigateByUrl('/');
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    http.expectNone(PERFORMANCE_URL);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.load-error')?.textContent).toContain('تعذّر الاتصال');
    expect(element.querySelector('.term-banner, .empty-block')).toBeNull();
  });

  it('keeps the no-term state and skips the call when there is no active term', async () => {
    const fixture = await render('/', null);
    http.expectNone(PERFORMANCE_URL);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.empty-block h2')?.textContent).toContain('لا توجد دورة نشطة');
    expect(element.querySelector('.empty-block p')?.textContent).toBe(
      'أنشئ دورة، وسيظهر أداء الحلقات هنا بعد أن يبدأ المعلمون بتسجيل الحضور والتقدّم في تطبيق المعلم.',
    );
    expect(card(fixture)).toBeNull();
  });
});
