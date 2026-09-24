import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { readAppOrigin } from '../config/public-links';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope, unwrapEnvelopeOrNull } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { ActiveTerm } from './models/term.model';
import {
  ActiveStudent,
  ActiveStudentsQuery,
  mapRegistrationLinkResult,
  RegistrationLinkResult,
  unwrapActiveStudentsPayload,
} from './models/student.model';
import { CenterApiRecord } from './models/center.model';
import { DashboardCards } from './models/dashboard-cards.model';
import { ActiveHalqaOption, unwrapActiveHalqasPayload } from './models/halqa.model';
import { ActiveTeacher, ActiveTeachersQuery, mapActiveTeacher } from './models/teacher.model';

@Injectable({ providedIn: 'root' })
export class CenterApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** GET /center/{id} — view-only center profile. */
  getById(centerId: number): Observable<CenterApiRecord> {
    return this.http
      .get<ApiEnvelope<CenterApiRecord>>(`${this.apiBaseUrl}/center/${centerId}`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  getActiveTerm(centerId: number): Observable<ActiveTerm | null> {
    return this.http
      .get<ApiEnvelope<ActiveTerm | null>>(`${this.apiBaseUrl}/center/${centerId}/active-term`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelopeOrNull(res.body, res.status)));
  }

  getDashboardCards(centerId: number): Observable<DashboardCards> {
    return this.http
      .get<ApiEnvelope<DashboardCards>>(`${this.apiBaseUrl}/center/${centerId}/dashboard-cards`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  getActiveTeachers(
    centerId: number,
    query: ActiveTeachersQuery = {},
  ): Observable<ActiveTeacher[]> {
    return this.getTeachers(`${this.apiBaseUrl}/center/${centerId}/active-teachers`, query);
  }

  getAvailableTeachers(
    centerId: number,
    query: ActiveTeachersQuery = {},
  ): Observable<ActiveTeacher[]> {
    return this.getTeachers(`${this.apiBaseUrl}/center/${centerId}/available-teachers`, query);
  }

  getAvailableStudents(centerId: number): Observable<ActiveStudent[]> {
    return this.http
      .get<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/center/${centerId}/available-students`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapActiveStudentsPayload(unwrapEnvelope(res.body, res.status))));
  }

  getActiveStudents(
    centerId: number,
    query: ActiveStudentsQuery = {},
  ): Observable<ActiveStudent[]> {
    let params = new HttpParams();
    if (query.page !== undefined) {
      params = params.set('page', String(query.page));
    }
    if (query.limit !== undefined) {
      params = params.set('limit', String(query.limit));
    }
    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.http
      .get<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/center/${centerId}/active-students`,
        withSkipGlobalErrorToast({ observe: 'response', params }),
      )
      .pipe(map((res) => unwrapActiveStudentsPayload(unwrapEnvelope(res.body, res.status))));
  }

  /**
   * GET /center/:centerId/active-halqas (active date-valid term; assigned teacher).
   * Nest availability routes are JWT-only without @Roles / center ownership — flag for later.
   */
  getActiveHalqas(centerId: number): Observable<ActiveHalqaOption[]> {
    return this.http
      .get<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/center/${centerId}/active-halqas`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapActiveHalqasPayload(unwrapEnvelopeOrNull(res.body, res.status))));
  }

  generateRegistrationLink(centerId: number): Observable<RegistrationLinkResult> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/center/${centerId}/generate-registration-link`,
        {},
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => mapRegistrationLinkResult(unwrapEnvelope(res.body, res.status), readAppOrigin())),
      );
  }

  private getTeachers(url: string, query: ActiveTeachersQuery): Observable<ActiveTeacher[]> {
    let params = new HttpParams();
    if (query.page !== undefined) {
      params = params.set('page', String(query.page));
    }
    if (query.limit !== undefined) {
      params = params.set('limit', String(query.limit));
    }
    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.http
      .get<ApiEnvelope<unknown>>(url, withSkipGlobalErrorToast({ observe: 'response', params }))
      .pipe(
        map((res) => {
          const data = unwrapEnvelope(res.body, res.status);
          return Array.isArray(data) ? data.map(mapActiveTeacher) : [];
        }),
      );
  }
}
