import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ApiError } from '../../core/api/api-error';
import { TermApiService } from '../../core/api/term-api.service';
import { toReportTermRef } from './dto/report-term.dto';
import type { ReportTermCatalog, ReportTermQuery, ReportTermRef } from './dto/report-term.dto';

/**
 * Term picker reads. GET /term is the only list. The default is the ACTIVE row
 * in that array. A list with no ACTIVE term still exposes COMPLETED rows.
 * This service does not call the active-term route.
 */
@Injectable({ providedIn: 'root' })
export class ReportTermService {
  private readonly termApi = inject(TermApiService);
  private listCache: { terms: ReportTermRef[] } | { failed: string } | null = null;

  loadForQuery(query: ReportTermQuery): Observable<ReportTermCatalog> {
    return this.loadList().pipe(switchMap((list) => this.finishCatalog(query, list)));
  }

  private loadList(): Observable<{ terms: ReportTermRef[] } | { failed: string }> {
    if (this.listCache) {
      return of(this.listCache);
    }
    return this.termApi.listTerms().pipe(
      map((rows) => {
        const terms = rows.flatMap((row) => {
          const term = toReportTermRef(row);
          return term ? [term] : [];
        });
        this.listCache = { terms };
        return this.listCache;
      }),
      catchError((error: unknown) => {
        const failed = { failed: messageOf(error, 'تعذر تحميل الدورات') };
        this.listCache = failed;
        return of(failed);
      }),
    );
  }

  private finishCatalog(
    query: ReportTermQuery,
    list: { terms: ReportTermRef[] } | { failed: string },
  ): Observable<ReportTermCatalog> {
    const terms = 'terms' in list ? list.terms : null;
    const listErrorMessage = 'failed' in list ? list.failed : null;
    if (query.kind === 'explicit' && !terms) {
      return this.termApi.getTerm(query.termId).pipe(
        map((row) => {
          const term = toReportTermRef(row);
          return {
            ...emptyCatalog(null, listErrorMessage),
            explicitTerm: term?.id === query.termId ? term : null,
          };
        }),
        catchError(() => of(emptyCatalog(null, listErrorMessage))),
      );
    }
    return of(emptyCatalog(terms, listErrorMessage));
  }
}

function emptyCatalog(terms: ReportTermRef[] | null, listErrorMessage: string | null): ReportTermCatalog {
  return {
    terms,
    explicitTerm: null,
    activeFromBootstrap: null,
    listErrorMessage,
    bootstrapErrorMessage: null,
  };
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}
