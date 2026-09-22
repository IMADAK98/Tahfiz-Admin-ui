import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { isNoHalqasForTermError } from './error-message.helpers';
import { unwrapEnvelope, unwrapEnvelopeOrNull } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { CreateHalqaPayload, HalqaApiRecord } from './models/halqa.model';
import {
  EnrollStudentsPayload,
  HalqaStudentApiRecord,
  StudyPlanSummaryApiRecord,
} from './models/study-plan.model';

export interface UpdateHalqaPayload {
  name: string;
  category: CreateHalqaPayload['category'];
  periods: CreateHalqaPayload['periods'];
  studentLimit: number;
  teacherId?: number;
}

/** Center-admin halqa HTTP — list by term/center; create/update. No by-teacher-id (TEACHER/mobile). */
@Injectable({ providedIn: 'root' })
export class HalqaApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getByTerm(termId: number): Observable<HalqaApiRecord[]> {
    return this.http
      .get<ApiEnvelope<HalqaApiRecord[]>>(`${this.apiBaseUrl}/halqa/by-term/${termId}`, {
        observe: 'response',
      })
      .pipe(
        map((res) => unwrapEnvelope(res.body, res.status)),
        catchError((error: unknown) =>
          isNoHalqasForTermError(error) ? of([]) : throwError(() => error),
        ),
      );
  }

  getByCenterId(centerId: number): Observable<HalqaApiRecord[]> {
    const params = new HttpParams().set('centerId', String(centerId));
    return this.http
      .get<ApiEnvelope<HalqaApiRecord[]>>(`${this.apiBaseUrl}/halqa`, {
        observe: 'response',
        params,
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  createHalqa(payload: CreateHalqaPayload): Observable<HalqaApiRecord> {
    return this.http
      .post<ApiEnvelope<HalqaApiRecord>>(
        `${this.apiBaseUrl}/halqa`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  getById(id: number): Observable<HalqaApiRecord> {
    return this.http
      .get<ApiEnvelope<HalqaApiRecord>>(`${this.apiBaseUrl}/halqa/${id}`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  updateHalqa(id: number, payload: UpdateHalqaPayload): Observable<HalqaApiRecord> {
    return this.http
      .put<ApiEnvelope<HalqaApiRecord>>(
        `${this.apiBaseUrl}/halqa/${id}`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  deleteHalqa(id: number): Observable<unknown> {
    return this.http
      .delete<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/halqa/${id}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  getStudentsByHalqaId(halqaId: number, date: string): Observable<HalqaStudentApiRecord[]> {
    const params = new HttpParams().set('date', date);
    return this.http
      .get<ApiEnvelope<HalqaStudentApiRecord[]>>(
        `${this.apiBaseUrl}/halqa/students/by-halqa-id/${halqaId}`,
        { observe: 'response', params },
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  getStudyPlans(halqaId: number): Observable<StudyPlanSummaryApiRecord[]> {
    return this.http
      .get<ApiEnvelope<StudyPlanSummaryApiRecord[]>>(
        `${this.apiBaseUrl}/halqa/study-plans/${halqaId}`,
        { observe: 'response' },
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  enrollStudents(halqaId: number, payload: EnrollStudentsPayload): Observable<unknown> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/halqa/enroll-students/${halqaId}`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelopeOrNull(res.body, res.status)));
  }

  unenrollStudent(halqaId: number, studentId: number): Observable<unknown> {
    return this.http
      .delete<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/halqa/${halqaId}/students/${studentId}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }
}
