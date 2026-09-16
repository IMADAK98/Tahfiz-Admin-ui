import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TOAST_I18N, resolveServerErrorToastDisplay } from '../ui/toast-messages';
import { ToastMessageService } from './toast-message.service';

export interface ToastFailureNotifyOptions {
  method: string;
  urlPath: string;
  httpStatus: number;
  status: number;
  serverMessage?: string | null;
  isSessionExpired?: boolean;
  isNetworkError?: boolean;
  bypassDedup?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastErrorService {
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  private readonly dedupWindowMs = 2000;
  private readonly recentFingerprints = new Map<string, number>();

  notifyFailure(options: ToastFailureNotifyOptions): void {
    const copy = this.resolveCopy(options);
    const severity = this.resolveSeverity(options);
    const fingerprint = `${options.method}|${options.urlPath}|${options.status}|${copy.fingerprint}`;

    if (!options.bypassDedup && this.isDuplicate(fingerprint)) {
      return;
    }

    if (severity === 'warn') {
      this.toastMessage.notifyWarnBody(copy.body);
      return;
    }

    if (copy.mode === 'titled') {
      this.toastMessage.notifyErrorTitled(copy.summary, copy.detail);
      return;
    }

    this.toastMessage.notifyErrorBody(copy.body);
  }

  private resolveCopy(options: ToastFailureNotifyOptions): {
    mode: 'single' | 'titled';
    body: string;
    summary: string;
    detail: string;
    fingerprint: string;
  } {
    if (options.isSessionExpired) {
      const body = this.translate.instant(TOAST_I18N.errors.sessionExpired);
      return { mode: 'single', body, summary: '', detail: '', fingerprint: body };
    }

    if (options.isNetworkError) {
      const body = this.translate.instant(TOAST_I18N.errors.network);
      return { mode: 'single', body, summary: '', detail: '', fingerprint: body };
    }

    const serverMessage = options.serverMessage?.trim();
    if (serverMessage) {
      const requestFailedTitle = this.translate.instant(TOAST_I18N.errors.requestFailedTitle);
      const display = resolveServerErrorToastDisplay(
        serverMessage,
        requestFailedTitle,
        (message) => this.translate.instant(TOAST_I18N.errors.requestFailedWithMessage, { message }),
      );

      if (display.mode === 'titled') {
        return {
          mode: 'titled',
          body: '',
          summary: display.summary,
          detail: display.detail,
          fingerprint: `${display.summary}|${display.detail}`,
        };
      }

      return {
        mode: 'single',
        body: display.body,
        summary: '',
        detail: '',
        fingerprint: display.body,
      };
    }

    const body = this.translate.instant(TOAST_I18N.errors.unexpected);
    return { mode: 'single', body, summary: '', detail: '', fingerprint: body };
  }

  private resolveSeverity(options: ToastFailureNotifyOptions): 'error' | 'warn' {
    const status = options.status;

    if (options.isSessionExpired || status === 401 || status === 404 || status === 409 || status === 429) {
      return 'warn';
    }

    return 'error';
  }

  private isDuplicate(fingerprint: string): boolean {
    const now = Date.now();
    const lastShownAt = this.recentFingerprints.get(fingerprint);
    if (lastShownAt !== undefined && now - lastShownAt < this.dedupWindowMs) {
      return true;
    }

    this.recentFingerprints.set(fingerprint, now);
    return false;
  }
}
