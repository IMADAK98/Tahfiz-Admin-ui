import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api-config';
import { unwrapEnvelope } from './envelope.helpers';
import { ApiEnvelope } from './models/api-envelope.model';
import { SurahApiRecord } from './models/study-plan.model';

@Injectable({ providedIn: 'root' })
export class QuranApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getSurahs(): Observable<SurahApiRecord[]> {
    return this.http
      .get<ApiEnvelope<SurahApiRecord[]>>(`${this.apiBaseUrl}/quran/surahs`, {
        observe: 'response',
      })
      .pipe(map((res) => unwrapEnvelope(res.body, res.status)));
  }
}
