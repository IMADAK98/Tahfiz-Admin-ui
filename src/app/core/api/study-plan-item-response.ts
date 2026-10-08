import type { StudyPlanItemApiRecord } from './models/study-plan.model';

export interface StudyPlanItemRead {
  /** Saved item when the body is a raw entity or an envelope `data` item. */
  item: StudyPlanItemApiRecord | null;
  /** False when HTTP or envelope status is not 2xx. */
  ok: boolean;
}

/**
 * PUT /study-plan-item/:id returns either the raw StudyPlanItem
 * (numeric `id`, no `data` key) or `{ status|statusCode, message, data }`.
 * `ok` with `item: null` means success but neither shape — caller refetches.
 * Does not touch `unwrapEnvelope` (GET /study-plan/:id/details still requires `data`).
 */
export function readStudyPlanItemBody(body: unknown, httpStatus: number): StudyPlanItemRead {
  const raw = studyPlanItemEntity(body);
  if (raw) {
    return { item: raw, ok: httpOk(httpStatus) };
  }

  if (isEnvelope(body)) {
    if (!envelopeSucceeded(body, httpStatus)) {
      return { item: null, ok: false };
    }
    return { item: studyPlanItemEntity(body.data), ok: true };
  }

  return { item: null, ok: httpOk(httpStatus) };
}

function httpOk(httpStatus: number): boolean {
  return httpStatus >= 200 && httpStatus < 300;
}

function envelopeSucceeded(
  body: { statusCode?: number; status?: number },
  httpStatus: number,
): boolean {
  const bodyStatus = body.statusCode ?? body.status;
  if (bodyStatus !== undefined) {
    return bodyStatus >= 200 && bodyStatus < 300;
  }
  return httpOk(httpStatus);
}

function isEnvelope(
  body: unknown,
): body is { statusCode?: number; status?: number; data?: unknown } {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const record = body as Record<string, unknown>;
  return 'data' in record || 'status' in record || 'statusCode' in record;
}

/** Raw entity: finite numeric `id` and no `data` key. */
function studyPlanItemEntity(body: unknown): StudyPlanItemApiRecord | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  if ('data' in record) {
    return null;
  }
  const id = record['id'];
  if (typeof id !== 'number' || !Number.isFinite(id)) {
    return null;
  }
  return record as unknown as StudyPlanItemApiRecord;
}
