export const TOAST_I18N = {
  success: {
    saved: 'toast.success.saved',
    termCreated: 'toast.success.termCreated',
    termEnded: 'toast.success.termEnded',
    halaqaCreated: 'toast.success.halaqaCreated',
    reEnrollmentApproved: 'toast.success.reEnrollmentApproved',
    reEnrollmentRejected: 'toast.success.reEnrollmentRejected',
    teacherCreated: 'toast.success.teacherCreated',
    teacherUpdated: 'toast.success.teacherUpdated',
    teacherRequestApproved: 'toast.success.teacherRequestApproved',
    teacherRequestRejected: 'toast.success.teacherRequestRejected',
    studentCreated: 'toast.success.studentCreated',
    studentAssignedToHalqa: 'toast.success.studentAssignedToHalqa',
    studentRequestApproved: 'toast.success.studentRequestApproved',
    studentRequestRejected: 'toast.success.studentRequestRejected',
    centerRequestApproved: 'toast.success.centerRequestApproved',
    centerRequestRejected: 'toast.success.centerRequestRejected',
    studentSignupSubmitted: 'toast.success.studentSignupSubmitted',
    identifyActivated: 'toast.success.identifyActivated',
    registrationLinkGenerated: 'toast.success.registrationLinkGenerated',
    registrationLinkCopied: 'toast.success.registrationLinkCopied',
    copied: 'toast.success.copied',
  },
  warn: {
    endActiveTermFirst: 'toast.warn.endActiveTermFirst',
  },
  info: {
    noStudentsAvailable: 'toast.info.noStudentsAvailable',
    reEnrollmentAddToHalaqa: 'toast.info.reEnrollmentAddToHalaqa',
    identifyAlreadyEnrolled: 'toast.success.identifyAlreadyEnrolled',
  },
  errors: {
    unexpected: 'errors.unexpected',
    network: 'errors.network',
    sessionExpired: 'errors.sessionExpired',
    requestFailedTitle: 'toast.error.requestFailedTitle',
    requestFailedWithMessage: 'toast.error.requestFailed',
    fieldErrorsBanner: 'errors.fieldErrorsBanner',
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

/**
 * Collapses `resolveServerErrorToastDisplay` into a single toast body for callers using
 * `notifyErrorBody` (no title/detail split UI available there).
 */
export function formatServerErrorToastBody(
  serverMessage: string,
  requestFailedWithMessage: (message: string) => string,
): string {
  const display = resolveServerErrorToastDisplay(serverMessage, '', requestFailedWithMessage);
  return display.mode === 'single' ? display.body : `${display.summary}: ${display.detail}`;
}
