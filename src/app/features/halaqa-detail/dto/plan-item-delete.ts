/** Nest 409 when the item is the plan's only item. */
export const STUDY_PLAN_ITEM_LAST_ITEM = 'STUDY_PLAN_ITEM_LAST_ITEM';

/** Keep equal to public/i18n/ar.json halaqaDetail.errors.itemIsLast. */
export const PLAN_ITEM_DELETE_LAST_ITEM_MESSAGE = 'لا يمكن حذف آخر عنصر في الخطة.';

const PLAN_ITEM_DELETE_UNEXPECTED_MESSAGE = 'حدث خطأ غير متوقع. حاول مرة أخرى.';

/**
 * Confirm-modal copy for DELETE /study-plan-item/:id.
 * The last-item 409 uses the fixed Arabic line. Anything else keeps an Arabic Nest
 * message or the generic fallback. Same rule as `arabicDialogMessage`.
 * No imports so the self-check can load this file under type-stripping.
 */
export function planItemDeleteConfirmMessage(
  error: unknown,
  unexpected = PLAN_ITEM_DELETE_UNEXPECTED_MESSAGE,
): string {
  const body = nestBody(error);
  if (statusOf(error, body) === 409) {
    const code = codeOf(error, body);
    if (code === STUDY_PLAN_ITEM_LAST_ITEM) {
      return PLAN_ITEM_DELETE_LAST_ITEM_MESSAGE;
    }
  }
  return arabicOrFallback(messageOf(error, body), unexpected);
}

function arabicOrFallback(message: string, fallback: string): string {
  const trimmed = message.trim();
  if (trimmed && /[\u0600-\u06FF]/.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

function asApiError(error: unknown): {
  message: string;
  httpStatus: number;
  bodyStatus?: number;
  code?: string;
  body?: unknown;
} | null {
  if (!isRecord(error) || error['name'] !== 'ApiError') {
    return null;
  }
  const httpStatus = error['httpStatus'];
  if (typeof httpStatus !== 'number') {
    return null;
  }
  const bodyStatus = error['bodyStatus'];
  const code = error['code'];
  return {
    message: typeof error['message'] === 'string' ? error['message'] : '',
    httpStatus,
    bodyStatus: typeof bodyStatus === 'number' ? bodyStatus : undefined,
    code: typeof code === 'string' ? code : undefined,
    body: error['body'],
  };
}

function messageOf(error: unknown, body: Record<string, unknown> | null): string {
  const apiError = asApiError(error);
  if (apiError?.message.trim()) {
    return apiError.message;
  }
  const raw = body?.['message'] ?? (isRecord(error) ? error['message'] : undefined);
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string').join(', ');
  }
  return '';
}

function codeOf(error: unknown, body: Record<string, unknown> | null): string | undefined {
  const apiError = asApiError(error);
  if (apiError?.code?.trim()) {
    return apiError.code.trim();
  }
  const rawCode = body?.['code'];
  if (typeof rawCode === 'string' && rawCode.trim()) {
    return rawCode.trim();
  }
  const message = messageOf(error, body);
  if (message.includes(STUDY_PLAN_ITEM_LAST_ITEM)) {
    return STUDY_PLAN_ITEM_LAST_ITEM;
  }
  if (/^[A-Z][A-Z0-9_]+$/.test(message.trim())) {
    return message.trim();
  }
  return undefined;
}

function statusOf(error: unknown, body: Record<string, unknown> | null): number {
  const apiError = asApiError(error);
  if (apiError?.httpStatus) {
    return apiError.httpStatus;
  }
  if (isRecord(error)) {
    const http = numeric(error['status'] ?? error['httpStatus']);
    if (http) {
      return http;
    }
  }
  if (apiError?.bodyStatus) {
    return apiError.bodyStatus;
  }
  return numeric(body?.['statusCode'] ?? body?.['status']);
}

function nestBody(error: unknown): Record<string, unknown> | null {
  const apiError = asApiError(error);
  if (apiError && isRecord(apiError.body)) {
    return apiError.body;
  }
  if (!isRecord(error)) {
    return null;
  }
  const nested = error['error'];
  if (typeof nested === 'string') {
    try {
      const parsed = JSON.parse(nested) as unknown;
      if (isRecord(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }
  if (isRecord(nested)) {
    return nested;
  }
  return error;
}

function numeric(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
