import { InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TermDashboardResponse } from '../../core/api/models/term-dashboard.model';
import { DashboardMockState } from './enums/dashboard-mock-state.enum';
import { MockDashboardDataSource } from './mock/mock-dashboard-data-source';

export interface DashboardDataSource {
  /** Same payload as the planned GET /dashboard/term/:termId?weekStart= for the active term. */
  load(weekStart: string, state: DashboardMockState): Observable<TermDashboardResponse>;
}

/** Swap the factory for the HTTP implementation once Nest ships the endpoint. */
export const DASHBOARD_DATA_SOURCE = new InjectionToken<DashboardDataSource>(
  'DASHBOARD_DATA_SOURCE',
  { providedIn: 'root', factory: () => inject(MockDashboardDataSource) },
);
