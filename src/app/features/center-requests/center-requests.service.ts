import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CenterRequestApiService } from '../../core/api/center-request-api.service';
import { CenterRequestViewModel, mapCenterRequest } from './dto';

@Injectable({ providedIn: 'root' })
export class CenterRequestsService {
  private readonly requestApi = inject(CenterRequestApiService);

  /** Nest findAll() returns all statuses — mock 21 shows PENDING/APPROVED/REJECTED mix. */
  loadAll(): Observable<CenterRequestViewModel[]> {
    return this.requestApi.list().pipe(map((records) => records.map(mapCenterRequest)));
  }

  approve(id: number): Observable<void> {
    return this.requestApi.approve(id);
  }

  reject(id: number, reason: string): Observable<void> {
    return this.requestApi.reject(id, { rejectionReason: reason.trim() });
  }
}
