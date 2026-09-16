import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { HalqaApiRecord } from './models/halqa.model';
import {
  CreateManualTeacherPayload,
  TeacherProfileApiRecord,
  TeacherUserApiRecord,
  UpdateTeacherProfilePayload,
} from './models/teacher.model';

/** Teacher user/profile HTTP — admin creates via manual-create, edits via teacher-profile PATCH. */
@Injectable({ providedIn: 'root' })
export class TeacherApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getByUserId(id: number | string): Observable<TeacherUserApiRecord> {
    return this.http
      .get<ApiEnvelope<TeacherUserApiRecord>>(`${this.apiBaseUrl}/users/teachers/by-id/${id}`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /** Admin add-teacher: creates user + teacher profile + center assignment directly (no pending row). */
  createManual(payload: CreateManualTeacherPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/pending-teacher-request/manual-create`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelope(res.body, res.status);
        }),
      );
  }

  /** profileId is teacherProfile.id, NOT the user id — see UpdateTeacherProfilePayload note. */
  updateProfile(
    profileId: number | string,
    payload: UpdateTeacherProfilePayload,
  ): Observable<TeacherProfileApiRecord | null> {
    return this.http
      .patch<ApiEnvelope<TeacherProfileApiRecord | null>>(
        `${this.apiBaseUrl}/teacher-profile/${profileId}`,
        payload,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }

  /**
   * ponytail: mock notes this as "admin stub list OK" — the endpoint has no documented role
   * restriction, but if it 403s/404s for admin-viewed teachers we degrade to an empty list
   * rather than blocking the whole detail page.
   */
  getHalqasByTeacherId(teacherId: number | string): Observable<HalqaApiRecord[]> {
    return this.http
      .get<ApiEnvelope<HalqaApiRecord[]>>(
        `${this.apiBaseUrl}/halqa/by-teacher-id/${teacherId}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => unwrapEnvelope(res.body, res.status) ?? []),
        catchError(() => of([])),
      );
  }
}
