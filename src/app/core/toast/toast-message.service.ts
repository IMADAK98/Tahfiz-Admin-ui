import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

export type TahfizToastSeverity = 'success' | 'info' | 'warn' | 'error';

const TOAST_LIFE_MS: Record<TahfizToastSeverity, number> = {
  success: 3500,
  info: 4000,
  warn: 5000,
  error: 7000,
};

@Injectable({ providedIn: 'root' })
export class ToastMessageService {
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);

  notifySuccess(i18nKey: string, params?: Record<string, string>): void {
    this.show('success', this.translate.instant(i18nKey, params));
  }

  notifyInfo(i18nKey: string, params?: Record<string, string>): void {
    this.show('info', this.translate.instant(i18nKey, params));
  }

  notifyWarn(i18nKey: string, params?: Record<string, string>): void {
    this.show('warn', this.translate.instant(i18nKey, params));
  }

  notifyWarnBody(body: string): void {
    this.show('warn', body);
  }

  notifyErrorBody(body: string): void {
    this.show('error', body);
  }

  notifyErrorTitled(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: TOAST_LIFE_MS.error,
      closable: true,
      styleClass: 'tahfiz-toast tahfiz-toast--error tahfiz-toast--titled',
    });
  }

  show(severity: TahfizToastSeverity, body: string): void {
    this.messageService.add({
      severity,
      summary: body,
      detail: '',
      life: TOAST_LIFE_MS[severity],
      closable: true,
      styleClass: `tahfiz-toast tahfiz-toast--${severity}`,
    });
  }
}
