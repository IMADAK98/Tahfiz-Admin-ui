import { Injectable, inject } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { ApiError } from '../../core/api/api-error';
import { TermApiService } from '../../core/api/term-api.service';
import { toReportTermRef } from './dto/report-term.dto';
import type { ReportTermCatalog, ReportTermQuery, ReportTermRef } from './dto/report-term.dto';

/**
 * Term picker reads. GET /term is the only list. The default is the ACTIVE row
 * in that array. A failed list is not cached and is not replaced by GET /term/:id
 * or the active-term route.
 */
@Injectable({ providedIn: 'root' })
export class ReportTermService {
  private readonly termApi = inject(TermApiService);
  private readonly retries = new Subject<void>();
  private listCache: { terms: ReportTermRef[] } | null = null;

  changes(source: Observable<ReportTermQuery>): Observable<ReportTermCatalog> {
    return source.pipe(
      switchMap((query) =>
        this.retries.pipe(
          startWith(undefined),
          switchMap(() => this.loadForQuery(query)),
        ),
      ),
    );
  }

  loadForQuery(query: ReportTermQuery): Observable<ReportTermCatalog> {
    return this.loadList().pipe(map((list) => this.catalogFor(list)));
  }

  /** Drops a cached success and asks subscribers to load GET /term again. */
  retryList(): void {
    this.listCache = null;
    this.retries.next();
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
      catchError((error: unknown) => of({ failed: messageOf(error, 'تعذر تحميل الدورات') })),
    );
  }

  private catalogFor(list: { terms: ReportTermRef[] } | { failed: string }): ReportTermCatalog {
    if ('failed' in list) {
      return { terms: null, listErrorMessage: list.failed };
    }
    return { terms: list.terms, listErrorMessage: null };
  }
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}
