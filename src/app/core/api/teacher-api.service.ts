import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { withSkipGlobalErrorToast } from '../http/skip-global-error-toast.token';
import { unwrapEnvelope, unwrapEnvelopeOrNull } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
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
   * DELETE /teacher-profile/:profileId — same id as updateProfile.
   * Success is 200 `{ data: null }` (soft-deactivate). `unwrapEnvelopeOrNull` accepts that;
   * `unwrapEnvelope` also returns null for `data: null` and only throws when `data` is missing.
   */
  deactivate(profileId: number | string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<null>>(
        `${this.apiBaseUrl}/teacher-profile/${profileId}`,
        withSkipGlobalErrorToast({ observe: 'response' }),
      )
      .pipe(
        map((res) => {
          unwrapEnvelopeOrNull(res.body, res.status);
        }),
      );
  }
}
