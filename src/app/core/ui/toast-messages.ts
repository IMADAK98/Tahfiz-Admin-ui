/** i18n keys for locked Tahfiz toast copy — resolve via TranslateService at runtime. */
export const TOAST_I18N = {
  success: {
    saved: 'toast.success.saved',
    termCreated: 'toast.success.termCreated',
    termEnded: 'toast.success.termEnded',
    halaqaCreated: 'toast.success.halaqaCreated',
    reEnrollmentApproved: 'toast.success.reEnrollmentApproved',
    reEnrollmentRejected: 'toast.success.reEnrollmentRejected',
    copied: 'toast.success.copied',
  },
  warn: {
    endActiveTermFirst: 'toast.warn.endActiveTermFirst',
  },
  info: {
    noStudentsAvailable: 'toast.info.noStudentsAvailable',
  },
  errors: {
    unexpected: 'errors.unexpected',
    network: 'errors.network',
    sessionExpired: 'errors.sessionExpired',
    requestFailedTitle: 'toast.error.requestFailedTitle',
    requestFailedWithMessage: 'toast.error.requestFailed',
  },
} as const;

export type ServerErrorToastDisplay =
  | { mode: 'single'; body: string }
  | { mode: 'titled'; summary: string; detail: string };

const ARABIC_RE = /[\u0600-\u06FF]/;
const SHORT_LATIN_MAX_LEN = 120;

export function containsArabic(text: string): boolean {
  return ARABIC_RE.test(text);
}

/** Interceptor: Arabic Nest body alone; short Latin gets «فشل الطلب» title + body or prefixed single line. */
export function resolveServerErrorToastDisplay(
  serverMessage: string,
  requestFailedTitle: string,
  requestFailedWithMessage: (message: string) => string,
): ServerErrorToastDisplay {
  const message = serverMessage.trim();

  if (containsArabic(message)) {
    return { mode: 'single', body: message };
  }

  if (message.length <= SHORT_LATIN_MAX_LEN) {
    return {
      mode: 'single',
      body: requestFailedWithMessage(message),
    };
  }

  return {
    mode: 'titled',
    summary: requestFailedTitle,
    detail: message,
  };
}
