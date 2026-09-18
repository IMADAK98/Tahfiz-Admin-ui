import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { CenterApiService } from '../../core/api/center-api.service';
import { DashboardCards } from '../../core/api/models/dashboard-cards.model';
import { ActiveTerm } from '../../core/api/models/term.model';
import { TermsService } from '../terms/terms.service';

export interface DashboardPageData {
  activeTerm: ActiveTerm | null;
  cards: DashboardCards;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly termsService = inject(TermsService);
  private readonly centerApi = inject(CenterApiService);

  loadPage(centerId: number): Observable<DashboardPageData> {
    return forkJoin({
      activeTerm: this.termsService.getActiveTerm(centerId),
      cards: this.centerApi.getDashboardCards(centerId),
    });
  }
}
