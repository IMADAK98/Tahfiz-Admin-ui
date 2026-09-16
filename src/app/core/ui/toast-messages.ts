/** i18n keys for locked Tahfiz toast copy — resolve via TranslateService at runtime. */
export const TOAST_I18N = {
  success: {
    saved: 'toast.success.saved',
    termCreated: 'toast.success.termCreated',
    termEnded: 'toast.success.termEnded',
    halaqaCreated: 'toast.success.halaqaCreated',
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

const REQUEST_FAILED_PREFIX = 'فشل الطلب';

/** Always «فشل الطلب: {msg}» unless Nest message already carries the prefix. */
export function formatServerErrorToastBody(
  serverMessage: string,
  requestFailedWithMessage: (message: string) => string,
): string {
  const message = serverMessage.trim();
  if (message.startsWith(REQUEST_FAILED_PREFIX)) {
    return message;
  }
  return requestFailedWithMessage(message);
}
