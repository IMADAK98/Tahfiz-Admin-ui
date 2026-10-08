/**
 * PUT /term/:id 409 (Nest PR #13).
 *
 * Conflict when HTTP status or body statusCode is 409 AND top-level
 * `code` is TERM_EDIT_CONFLICTS_WITH_RECORDED_DATA. `affectedDates` is the
 * top-level string array (sliced to YYYY-MM-DD, sorted, deduped).
 * A nested list is only used when the top-level array is missing.
 *
 * ponytail: nested walk stops at depth 6. The shipped body is flat.
 */
export const TERM_EDIT_CONFLICT_KEY = 'TERM_EDIT_CONFLICTS_WITH_RECORDED_DATA';

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;
const MAX_DEPTH = 6;

export class TermEditConflictError extends Error {
  readonly statusCode = 409;
  readonly code = TERM_EDIT_CONFLICT_KEY;
  readonly affectedDates: string[];

  constructor(affectedDates: readonly string[]) {
    super(TERM_EDIT_CONFLICT_KEY);
    this.name = 'TermEditConflictError';
    this.affectedDates = normalizeAffectedDates(affectedDates);
  }
}

export interface TermEditConflict {
  affectedDates: string[];
}

export function readTermEditConflict(error: unknown): TermEditConflict | null {
  const body = bodyOf(error);
  if (!isRecord(body)) {
    return null;
  }
  if (statusOf(error, body) !== 409 || body['code'] !== TERM_EDIT_CONFLICT_KEY) {
    return null;
  }
  const topLevel = normalizeAffectedDates(body['affectedDates']);
  return { affectedDates: topLevel.length ? topLevel : findAffectedDates(body) };
}

function bodyOf(error: unknown): unknown {
  if (!isRecord(error)) {
    return error;
  }
  const nested = error['error'];
  if (typeof nested === 'string') {
    const parsed = tryJson(nested);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  if (isRecord(nested) || Array.isArray(nested)) {
    return nested;
  }
  return error;
}

function statusOf(error: unknown, body: unknown): number {
  if (isRecord(error)) {
    const http = numeric(error['status'] ?? error['httpStatus']);
    if (http === 409) {
      return 409;
    }
  }
  if (isRecord(body)) {
    const bodyStatus = numeric(body['statusCode'] ?? body['status']);
    if (bodyStatus) {
      return bodyStatus;
    }
  }
  if (isRecord(error)) {
    return numeric(error['status'] ?? error['httpStatus'] ?? error['statusCode']);
  }
  return 0;
}

function findAffectedDates(root: unknown): string[] {
  const found = findProp(root, 'affectedDates');
  return normalizeAffectedDates(found);
}

function findProp(root: unknown, key: string): unknown {
  const queue: Array<{ value: unknown; depth: number }> = [{ value: root, depth: 0 }];
  const seen = new WeakSet<object>();
  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > MAX_DEPTH) {
      continue;
    }
    const { value, depth } = current;
    if (!value || typeof value !== 'object') {
      continue;
    }
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        queue.push({ value: item, depth: depth + 1 });
      }
      continue;
    }
    const record = value as Record<string, unknown>;
    if (key in record && record[key] != null) {
      return record[key];
    }
    for (const child of Object.values(record)) {
      if (child && typeof child === 'object') {
        queue.push({ value: child, depth: depth + 1 });
      }
    }
  }
  return undefined;
}

function normalizeAffectedDates(raw: unknown): string[] {
  const items = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,،\s]+/) : [];
  const dates: string[] = [];
  for (const item of items) {
    const text =
      typeof item === 'string'
        ? item
        : isRecord(item)
          ? firstString(item, ['date', 'day', 'isoDate'])
          : '';
    const match = DATE_PREFIX.exec(text.trim());
    if (match?.[1]) {
      dates.push(match[1]);
    }
  }
  return [...new Set(dates)].sort();
}

function firstString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return '';
}

function numeric(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value);
  }
  return 0;
}

function tryJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
