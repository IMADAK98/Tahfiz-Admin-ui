import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { unwrapEnvelope, unwrapEnvelopeOrNull } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { ActiveTerm } from './models/term.model';
import { ActiveStudent, ActiveStudentsQuery } from './models/student.model';
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
      .get<ApiEnvelope<ActiveTeacher[]>>(`${this.apiBaseUrl}/center/${centerId}/active-teachers`, {
        observe: 'response',
        params,
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  getAvailableTeachers(centerId: number, query: ActiveTeachersQuery = {}): Observable<ActiveTeacher[]> {
    return this.getTeachers(`${this.apiBaseUrl}/center/${centerId}/available-teachers`, query);
  }

  getAvailableStudents(centerId: number): Observable<ActiveStudent[]> {
    return this.http
      .get<ApiEnvelope<ActiveStudent[]>>(`${this.apiBaseUrl}/center/${centerId}/available-students`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
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
      .get<ApiEnvelope<ActiveStudent[]>>(`${this.apiBaseUrl}/center/${centerId}/active-students`, {
        observe: 'response',
        params,
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
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
      .get<ApiEnvelope<ActiveTeacher[]>>(url, { observe: 'response', params })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }
}
