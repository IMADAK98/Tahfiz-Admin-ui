import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { ActiveTerm } from '../../core/api/models/term.model';
import { TermDashboardResponse } from '../../core/api/models/term-dashboard.model';
import { toLocalIsoDate } from '../../core/utils/local-date';
import { TermsService } from '../terms/terms.service';
import { DASHBOARD_DATA_SOURCE } from './dashboard-data-source';

export interface DashboardPageData {
  /** Live active term; drives create / edit / end actions only. */
  activeTerm: ActiveTerm | null;
  dashboard: TermDashboardResponse;
}

function currentWeekSunday(today = new Date()): string {
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  return toLocalIsoDate(sunday);
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly termsService = inject(TermsService);
  private readonly dataSource = inject(DASHBOARD_DATA_SOURCE);

  loadPage(centerId: number): Observable<DashboardPageData> {
    return forkJoin({
      activeTerm: this.termsService.getActiveTerm(centerId).pipe(catchError(() => of(null))),
      dashboard: this.dataSource.load(currentWeekSunday()),
    });
  }
}
