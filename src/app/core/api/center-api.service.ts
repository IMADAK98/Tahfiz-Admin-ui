import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { ApiError } from './api-error';
import { unwrapEnvelope, unwrapEnvelopeOrNull } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { ActiveTerm } from './models/term.model';
import {
  ActiveStudent,
  ActiveStudentsQuery,
  RegistrationLinkResult,
  unwrapActiveStudentsPayload,
} from './models/student.model';
import { ActiveTeacher, ActiveTeachersQuery } from './models/teacher.model';

@Injectable({ providedIn: 'root' })
export class CenterApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getActiveTerm(centerId: number): Observable<ActiveTerm | null> {
    return this.http
      .get<ApiEnvelope<ActiveTerm | null>>(`${this.apiBaseUrl}/center/${centerId}/active-term`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelopeOrNull(res.body, res.status)));
  }

  getActiveTeachers(centerId: number, query: ActiveTeachersQuery = {}): Observable<ActiveTeacher[]> {
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
      .get<ApiEnvelope<ActiveTeacher[]>>(
        `${this.apiBaseUrl}/center/${centerId}/active-teachers`,
        withSkipGlobalErrorToast({ observe: 'response', params }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  getAvailableTeachers(centerId: number, query: ActiveTeachersQuery = {}): Observable<ActiveTeacher[]> {
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

  getActiveStudents(centerId: number, query: ActiveStudentsQuery = {}): Observable<ActiveStudent[]> {
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

  generateRegistrationLink(centerId: number): Observable<RegistrationLinkResult> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/center/${centerId}/generate-registration-link`,
        {},
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => mapRegistrationLink(unwrapEnvelopeOrNull(res.body, res.status))));
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
      .get<ApiEnvelope<ActiveTeacher[]>>(url, withSkipGlobalErrorToast({ observe: 'response', params }))
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }
}

function mapRegistrationLink(data: unknown): RegistrationLinkResult {
  if (typeof data === 'string' && data.trim()) {
    return { registrationLink: data.trim() };
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const link = [record['registrationLink'], record['url'], record['link']].find(
      (value) => typeof value === 'string' && value.trim(),
    ) as string | undefined;
    if (link) {
      const expiresAt = typeof record['expiresAt'] === 'string' ? record['expiresAt'] : null;
      return { registrationLink: link.trim(), expiresAt };
    }
  }
  throw new ApiError('تعذّر قراءة رابط التسجيل', 200);
}
