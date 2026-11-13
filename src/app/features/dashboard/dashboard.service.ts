import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { ActiveTerm } from '../../core/api/models/term.model';
import {
  DashboardHalaqaPerformanceRow,
  TermDashboardResponse,
} from '../../core/api/models/term-dashboard.model';
import { toLocalIsoDate } from '../../core/utils/local-date';
import { TermsService } from '../terms/terms.service';
import { DASHBOARD_DATA_SOURCE } from './dashboard-data-source';
import { DashboardMockState, parseDashboardMockState } from './enums';

export interface DashboardPageData {
  /** Live active term; drives create / edit / end and the live «أداء الحلقات» call. */
  activeTerm: ActiveTerm | null;
  /** Mock payload for every block without a live endpoint yet. */
  dashboard: TermDashboardResponse;
  /** True when `?mock=` is in the URL: «أداء الحلقات» uses `dashboard.halaqat`, no network. */
  mock: boolean;
}

function currentWeekSunday(today = new Date()): string {
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  return toLocalIsoDate(sunday);
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly termsService = inject(TermsService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly router = inject(Router);
  private readonly dataSource = inject(DASHBOARD_DATA_SOURCE);

  /**
   * `?mock=<state>` keeps the whole page on fixtures (the active-term lookup may fail quietly).
   * Without it, the live active term decides between the populated fixture and the no-term state.
   */
  loadPage(centerId: number): Observable<DashboardPageData> {
    const mockParam = this.router.routerState.snapshot.root.queryParamMap.get('mock');
    const mock = mockParam !== null;
    const activeTerm$ = this.termsService.getActiveTerm(centerId);
    return (mock ? activeTerm$.pipe(catchError(() => of(null))) : activeTerm$).pipe(
      switchMap((activeTerm) => {
        const state = mock
          ? parseDashboardMockState(mockParam)
          : activeTerm
            ? DashboardMockState.Populated
            : DashboardMockState.NoTerm;
        return this.dataSource
          .load(currentWeekSunday(), state)
          .pipe(map((dashboard) => ({ activeTerm, dashboard, mock })));
      }),
    );
  }

  loadHalqaPerformance(termId: number): Observable<DashboardHalaqaPerformanceRow[]> {
    return this.dashboardApi.getHalqaPerformance(termId);
  }
}
