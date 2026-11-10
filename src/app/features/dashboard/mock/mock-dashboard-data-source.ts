import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { TermDashboardResponse } from '../../../core/api/models/term-dashboard.model';
import type { DashboardDataSource } from '../dashboard-data-source';
import { parseDashboardMockState } from '../enums/dashboard-mock-state.enum';
import { dashboardMockInput } from './dashboard-mock-fixtures';
import { buildTermDashboard } from './dashboard-metrics';

/** Fixture-backed source; `?mock=<state>` picks one of the five design states (no network). */
@Injectable({ providedIn: 'root' })
export class MockDashboardDataSource implements DashboardDataSource {
  private readonly router = inject(Router);

  load(_weekStart: string): Observable<TermDashboardResponse> {
    const state = parseDashboardMockState(
      this.router.routerState.snapshot.root.queryParamMap.get('mock'),
    );
    return of(buildTermDashboard(dashboardMockInput(state)));
  }
}
