import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { DashboardHalaqaPerformanceRow } from '../../core/api/models/halqa-performance.model';
import { ActiveTerm } from '../../core/api/models/term.model';
import { TermsService } from '../terms/terms.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly termsService = inject(TermsService);
  private readonly dashboardApi = inject(DashboardApiService);

  /** GET /center/:id/active-term; `null` = no active term (the no-term state). */
  loadActiveTerm(centerId: number): Observable<ActiveTerm | null> {
    return this.termsService.getActiveTerm(centerId);
  }

  loadHalqaPerformance(termId: number): Observable<DashboardHalaqaPerformanceRow[]> {
    return this.dashboardApi.getHalqaPerformance(termId);
  }
}
