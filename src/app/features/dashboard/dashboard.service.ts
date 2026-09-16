import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiveTerm } from '../../core/api/models/term.model';
import { TermsService } from '../terms/terms.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly termsService = inject(TermsService);

  loadActiveTerm(centerId: number): Observable<ActiveTerm | null> {
    return this.termsService.getActiveTerm(centerId);
  }
}
