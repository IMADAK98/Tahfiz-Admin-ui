/** Nest 409 when the teacher still has an active-term ḥalaqa enrollment. */
export const TEACHER_HAS_ASSIGNED_HALAQAS = 'TEACHER_HAS_ASSIGNED_HALAQAS';

export const TEACHER_DELETE_ASSIGNED_MESSAGE =
  'لا يمكن حذف المعلّم لأنه ما زال مسندًا إلى حلقة. انقل الحلقات إلى معلّم آخر أولًا من صفحة الحلقة.';

export const TEACHER_DELETE_UNEXPECTED_MESSAGE = 'حدث خطأ غير متوقع. حاول مرة أخرى.';

export interface TeacherDeleteHalqaLink {
  id: number | null;
  name: string;
}

export interface TeacherDeleteConflict {
  halqas: TeacherDeleteHalqaLink[];
}

export interface TeacherDeleteConfirmError {
  message: string;
  halqas: TeacherDeleteHalqaLink[];
}

/** Hide the action when the profile id is missing, or the row is the logged-in admin. */
export function canDeleteTeacher(
  profileId: number | null | undefined,
  teacherUserId: number,
  currentUserId: number | null | undefined,
): boolean {
  if (!profileId) {
    return false;
  }
  return currentUserId == null || teacherUserId !== currentUserId;
}

/**
 * 409 assigned-ḥalaqa conflict.
 * The key may be top-level `code` or the message. A 409 with no key still counts
 * (that status means this conflict). A different explicit code does not.
 */
export function readTeacherDeleteConflict(error: unknown): TeacherDeleteConflict | null {
  const body = nestBody(error);
  if (statusOf(error, body) !== 409) {
    return null;
  }
  const code = codeOf(error, body);
  if (code && code !== TEACHER_HAS_ASSIGNED_HALAQAS) {
    return null;
  }
  return { halqas: halqasOf(body) };
}

export function teacherDeleteConfirmError(error: unknown): TeacherDeleteConfirmError {
  const conflict = readTeacherDeleteConflict(error);
  if (conflict) {
    return { message: TEACHER_DELETE_ASSIGNED_MESSAGE, halqas: conflict.halqas };
  }
  return {
    message: arabicOrFallback(messageOf(error, nestBody(error)), TEACHER_DELETE_UNEXPECTED_MESSAGE),
    halqas: [],
  };
}

/** Same Arabic-or-fallback rule as `arabicDialogMessage`. Kept local so this file has no imports. */
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
  if (message.includes(TEACHER_HAS_ASSIGNED_HALAQAS)) {
    return TEACHER_HAS_ASSIGNED_HALAQAS;
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

function halqasOf(body: Record<string, unknown> | null): TeacherDeleteHalqaLink[] {
  if (!body) {
    return [];
  }
  const sources = [body, isRecord(body['data']) ? body['data'] : null];
  for (const source of sources) {
    if (!source) {
      continue;
    }
    const structured = structuredHalqas(
      source['halqas'] ?? source['halaqas'] ?? source['halqaNames'],
    );
    if (structured.length) {
      return structured;
    }
    const zipped = zipHalqas(source['halqaIds'], source['halqaNames']);
    if (zipped.length) {
      return zipped;
    }
  }
  return [];
}

function structuredHalqas(raw: unknown): TeacherDeleteHalqaLink[] {
  if (!Array.isArray(raw) || !raw.some((item) => isRecord(item))) {
    return [];
  }
  const links: TeacherDeleteHalqaLink[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const name = typeof item['name'] === 'string' ? item['name'].trim() : '';
    if (!name) {
      continue;
    }
    const id = positiveId(item['id']);
    links.push({ id, name });
  }
  return links;
}

function zipHalqas(idsRaw: unknown, namesRaw: unknown): TeacherDeleteHalqaLink[] {
  const names = stringList(namesRaw);
  if (!names.length) {
    return [];
  }
  const ids = Array.isArray(idsRaw) ? idsRaw : [];
  return names.map((name, index) => ({ name, id: positiveId(ids[index]) }));
}

function stringList(raw: unknown): string[] {
  if (typeof raw === 'string' && raw.trim()) {
    return [raw.trim()];
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  const names: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      names.push(item.trim());
    }
  }
  return names;
}

function positiveId(value: unknown): number | null {
  const id = numeric(value);
  return id > 0 ? id : null;
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
