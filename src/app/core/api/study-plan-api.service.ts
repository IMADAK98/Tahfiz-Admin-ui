import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { catchHttpAsApiError, unwrapEnvelope } from './envelope.helpers';
import { apiErrorFromBody } from './api-error';
import { readAssignedStudyPlan } from './study-plan-assign-response';
import { readStudyPlanItemBody } from './study-plan-item-response';
import { ApiEnvelope } from './models/api-envelope.model';
import {
  AddStudyPlanItemPayload,
  AssignStudentsPayload,
  CreateStudyPlanPayload,
  StudyPlanDetailsApiRecord,
  UnassignStudentsPayload,
  StudyPlanItemApiRecord,
  UpdateStudyPlanItemPayload,
  UpdateStudyPlanPayload,
} from './models/study-plan.model';

@Injectable({ providedIn: 'root' })
export class StudyPlanApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** Envelope only. `unwrapEnvelope` throws when `data` is missing. */
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

  /**
   * POST /study-plan/:id/assign-students. Accepts a raw plan, `{ data: plan }`,
   * or `{ data: null }`. A string stub throws instead of looking like a save.
   */
  assignStudents(
    planId: number,
    payload: AssignStudentsPayload,
  ): Observable<StudyPlanDetailsApiRecord | null> {
    return this.http
      .post<unknown>(
        `${this.apiBaseUrl}/study-plan/${planId}/assign-students`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          const read = readAssignedStudyPlan(res.body, res.status);
          if (!read.ok) {
            throw apiErrorFromBody(res.body, res.status);
          }
          return read.plan;
        }),
        catchHttpAsApiError(),
      );
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

  /**
   * POST /study-plan-item/:planId. Tolerates today's raw 201 entity and the
   * envelope `{ data: item }` (Nest fills to*).
   */
  createItem(
    planId: number,
    payload: AddStudyPlanItemPayload,
  ): Observable<StudyPlanItemApiRecord | null> {
    return this.http
      .post<unknown>(
        `${this.apiBaseUrl}/study-plan-item/${planId}`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          const read = readStudyPlanItemBody(res.body, res.status);
          if (!read.ok) {
            throw apiErrorFromBody(res.body, res.status);
          }
          return read.item;
        }),
        catchHttpAsApiError(),
      );
  }

  /**
   * DELETE /study-plan-item/:id. Strict envelope: `data: null` succeeds;
   * a string stub (no `data`) throws instead of looking like a delete.
   */
  deleteItem(itemId: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/study-plan-item/${itemId}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelope(res.body, res.status);
        }),
        catchHttpAsApiError(),
      );
  }

  /**
   * PUT /study-plan-item/:id. Live Nest returns the raw item; the follow-up
   * wrap returns `{ data: item }`. Null item on 2xx → caller refetches details.
   */
  updateItem(
    itemId: number,
    payload: UpdateStudyPlanItemPayload,
  ): Observable<StudyPlanItemApiRecord | null> {
    return this.http
      .put<unknown>(
        `${this.apiBaseUrl}/study-plan-item/${itemId}`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          const read = readStudyPlanItemBody(res.body, res.status);
          if (!read.ok) {
            throw apiErrorFromBody(res.body, res.status);
          }
          return read.item;
        }),
        catchHttpAsApiError(),
      );
  }
}
