import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import {
  AssignStudentsPayload,
  CreateStudyPlanPayload,
  StudyPlanDetailsApiRecord,
  UnassignStudentsPayload,
  UpdateStudyPlanItemPayload,
  UpdateStudyPlanPayload,
} from './models/study-plan.model';

@Injectable({ providedIn: 'root' })
export class StudyPlanApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getDetails(planId: number): Observable<StudyPlanDetailsApiRecord> {
    return this.http
      .get<ApiEnvelope<StudyPlanDetailsApiRecord>>(
        `${this.apiBaseUrl}/study-plan/${planId}/details`,
        { observe: 'response' },
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  create(payload: CreateStudyPlanPayload): Observable<unknown> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/study-plan`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  update(planId: number, payload: UpdateStudyPlanPayload): Observable<unknown> {
    return this.http
      .patch<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/study-plan/${planId}`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  delete(planId: number): Observable<unknown> {
    return this.http
      .delete<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/study-plan/${planId}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  assignStudents(planId: number, payload: AssignStudentsPayload): Observable<unknown> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/study-plan/${planId}/assign-students`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /** Live contract: DELETE with body `{ studentIds: number[] }`. */
  unassignStudents(planId: number, payload: UnassignStudentsPayload): Observable<unknown> {
    return this.http
      .delete<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/study-plan/${planId}/unassign-students`,
        withSkipGlobalErrorToast({ observe: 'response', body: payload }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  updateItem(itemId: number, payload: UpdateStudyPlanItemPayload): Observable<unknown> {
    return this.http
      .put<ApiEnvelope<unknown>>(
        `${this.apiBaseUrl}/study-plan-item/${itemId}`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }
}
