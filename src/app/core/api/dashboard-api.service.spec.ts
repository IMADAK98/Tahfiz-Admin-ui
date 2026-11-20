import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';
import { httpErrorToApiInterceptor } from '../http/http-error-to-api.interceptor';
import { SKIP_GLOBAL_ERROR_TOAST } from '../http/skip-global-error-toast.token';
import { ApiError } from './api-error';
import { DashboardApiService } from './dashboard-api.service';

const URL = 'https://api.test/dashboard/term/30/halqa-performance';

const liveRow = {
  halaqaId: 4,
  name: 'حلقة النور',
  teacherName: 'معلم أ، معلم ب',
  studentCount: 12,
  attendance: { present: 40, late: 2, absent: 6, leave: 1 },
  attendanceRate: 87.5,
  typeAverages: { HIFZ: 80.25, TATHBEET: null, MURAJAA: 91 },
  coverage: 85.63,
  score: 86.56,
  rank: 1,
};

describe('DashboardApiService.getHalqaPerformance', () => {
  let service: DashboardApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorToApiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.test' },
      ],
    });
    service = TestBed.inject(DashboardApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs the term endpoint without the global toast and unwraps the envelope', async () => {
    const result = firstValueFrom(service.getHalqaPerformance(30));
    const request = http.expectOne(URL);
    expect(request.request.method).toBe('GET');
    expect(request.request.context.get(SKIP_GLOBAL_ERROR_TOAST)).toBe(true);
    request.flush({ status: 200, message: 'ok', data: [liveRow] });
    expect(await result).toEqual([liveRow]);
  });

  it('keeps null rates and score as null (the live all-null row)', async () => {
    const result = firstValueFrom(service.getHalqaPerformance(30));
    http.expectOne(URL).flush({
      status: 200,
      message: 'ok',
      data: [
        {
          ...liveRow,
          studentCount: 3,
          attendance: { present: 0, late: 0, absent: 0, leave: 0 },
          attendanceRate: null,
          typeAverages: { HIFZ: null, TATHBEET: null, MURAJAA: null },
          coverage: null,
          score: null,
        },
      ],
    });
    const [row] = await result;
    expect(row.attendanceRate).toBeNull();
    expect(row.coverage).toBeNull();
    expect(row.score).toBeNull();
    expect(row.typeAverages).toEqual({ HIFZ: null, TATHBEET: null, MURAJAA: null });
  });

  it('reads missing or non-numeric rates as null, never 0', async () => {
    const result = firstValueFrom(service.getHalqaPerformance(30));
    const { attendanceRate: _rate, score: _score, ...partial } = liveRow;
    http.expectOne(URL).flush({
      status: 200,
      message: 'ok',
      data: [{ ...partial, coverage: 'NaN', typeAverages: {} }],
    });
    const [row] = await result;
    expect(row).toMatchObject({ attendanceRate: null, coverage: null, score: null });
    expect(row.typeAverages).toEqual({ HIFZ: null, TATHBEET: null, MURAJAA: null });
  });

  it('returns [] for an empty term', async () => {
    const result = firstValueFrom(service.getHalqaPerformance(30));
    http.expectOne(URL).flush({ status: 200, message: 'ok', data: [] });
    expect(await result).toEqual([]);
  });

  it('turns 404 TERM_NOT_FOUND into an ApiError with the Nest message', async () => {
    const result = firstValueFrom(service.getHalqaPerformance(30));
    http
      .expectOne(URL)
      .flush(
        { statusCode: 404, message: 'الدورة غير موجودة', code: 'TERM_NOT_FOUND' },
        { status: 404, statusText: 'Not Found' },
      );
    const error = await result.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      httpStatus: 404,
      code: 'TERM_NOT_FOUND',
      message: 'الدورة غير موجودة',
    });
  });
});
