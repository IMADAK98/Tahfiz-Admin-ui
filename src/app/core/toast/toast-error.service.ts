import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
    const body = this.resolveBody(options);
    const severity = this.resolveSeverity(options);
    const fingerprint = `${options.method}|${options.urlPath}|${options.status}|${body}`;

    if (!options.bypassDedup && this.isDuplicate(fingerprint)) {
      return;
    }

    if (severity === 'warn') {
      this.toastMessage.notifyWarnBody(body);
      return;
    }

    this.toastMessage.notifyErrorBody(body);
  }

  private resolveBody(options: ToastFailureNotifyOptions): string {
    if (options.isSessionExpired) {
      return this.translate.instant('errors.sessionExpired');
    }

    if (options.isNetworkError) {
      return this.translate.instant('errors.network');
    }

    const serverMessage = options.serverMessage?.trim();
    if (serverMessage) {
      return this.translate.instant('toast.error.requestFailed', { message: serverMessage });
    }

    return this.translate.instant('toast.error.requestFailed', {
      message: this.translate.instant('errors.unexpected'),
    });
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
