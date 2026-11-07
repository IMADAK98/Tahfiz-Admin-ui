import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ApiError } from '../../core/api/api-error';
import { CenterApiService } from '../../core/api/center-api.service';
import { TermApiService } from '../../core/api/term-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { toReportTermRef } from './dto/report-term.dto';
import type { ReportTermCatalog, ReportTermQuery, ReportTermRef } from './dto/report-term.dto';

/**
 * Term picker reads. GET /term lists every status in the JWT center.
 * The active-term bootstrap runs only when the page has no explicit termId
 * and the list has no ACTIVE row. An explicit id never calls the active-term route.
 */
@Injectable({ providedIn: 'root' })
export class ReportTermService {
  private readonly termApi = inject(TermApiService);
  private readonly centerApi = inject(CenterApiService);
  private readonly auth = inject(AuthService);
  private listCache: { terms: ReportTermRef[] } | { failed: string } | null = null;
  /** Same id only. Never used to replace a different explicit term. */
  private bootstrapTerm: ReportTermRef | null = null;

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
    if (query.kind === 'explicit') {
      if (terms) {
        return of(emptyCatalog(terms, listErrorMessage));
      }
      return this.termApi.getTerm(query.termId).pipe(
        map((row) => {
          const term = toReportTermRef(row);
          return {
            ...emptyCatalog(null, listErrorMessage),
            explicitTerm: term?.id === query.termId ? term : null,
          };
        }),
        catchError(() =>
          of({
            ...emptyCatalog(null, listErrorMessage),
            explicitTerm: this.bootstrapTerm?.id === query.termId ? this.bootstrapTerm : null,
          }),
        ),
      );
    }
    if (query.kind === 'invalid') {
      return of(emptyCatalog(terms, listErrorMessage));
    }
    if (terms?.some((term) => term.status === 'ACTIVE')) {
      return of(emptyCatalog(terms, listErrorMessage));
    }
    return this.loadBootstrap().pipe(
      map((bootstrap) => ({
        ...emptyCatalog(terms, listErrorMessage),
        activeFromBootstrap: bootstrap.term,
        bootstrapErrorMessage: bootstrap.errorMessage,
      })),
    );
  }

  private loadBootstrap(): Observable<{ term: ReportTermRef | null; errorMessage: string | null }> {
    const centerId = this.auth.getClaims()?.centerId;
    if (centerId == null) {
      return of({ term: null, errorMessage: null });
    }
    return this.centerApi.getActiveTerm(centerId).pipe(
      map((term) => {
        const ref = toReportTermRef(term);
        if (ref?.status === 'ACTIVE') {
          this.bootstrapTerm = ref;
        }
        return { term: ref, errorMessage: null };
      }),
      catchError((error: unknown) =>
        of({ term: null, errorMessage: messageOf(error, 'تعذر تحميل الدورة النشطة') }),
      ),
    );
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
