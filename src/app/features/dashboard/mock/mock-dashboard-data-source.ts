import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TermDashboardResponse } from '../../../core/api/models/term-dashboard.model';
import type { DashboardDataSource } from '../dashboard-data-source';
import { DashboardMockState } from '../enums/dashboard-mock-state.enum';
import { dashboardMockInput } from './dashboard-mock-fixtures';
import { buildTermDashboard } from './dashboard-metrics';

/** Fixture-backed source for one of the five design states (no network). */
@Injectable({ providedIn: 'root' })
export class MockDashboardDataSource implements DashboardDataSource {
  load(_weekStart: string, state: DashboardMockState): Observable<TermDashboardResponse> {
    return of(buildTermDashboard(dashboardMockInput(state)));
  }
}
