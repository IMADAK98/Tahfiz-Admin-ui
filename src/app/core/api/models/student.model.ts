import { mapInviteRegistrationLink } from '../../config/public-links';

/** Nest `GetActiveStudentDto.halqa` — id is a JSON string. */
export interface AssignedStudentHalqa {
  id: number;
  name: string;
}

/** GET /center/{centerId}/active-students · available-students — flattened User. Ids may be strings. */
export interface ActiveStudent {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  identificationNumber?: string;
  passportNumber?: string;
  birthDate?: string;
  address?: string;
  nationality?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Active-term enrollment; null when unassigned. */
  halqa: AssignedStudentHalqa | null;
}

export interface ActiveStudentsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** OpenAPI CreatePendingStudentRequestFromAdminDto — enum values include spaces. */
export type EducationStage =
  | 'KINDERGARTEN'
  | 'ELEMENTARY SCHOOL'
  | 'MIDDLE SCHOOL'
  | 'HIGH SCHOOL'
  | 'UNIVERSITY'
  | 'POSTGRADUATE';

export type HifzQuality = 'HAFIZ' | 'NON_HAFIZ' | 'MUTQEN' | 'NON_MUTQEN';

/** POST /admin/student-requests/manual-create — no `centerId` (taken from JWT). */
export interface CreateManualStudentPayload {
  name: string;
  email: string;
  phone: string;
  educationStage: EducationStage;
  identificationNumber: string;
  passportNumber: string;
  address: string;
  birthDate: string;
  parentPhone: string;
  surahFrom: number;
  surahTo: number;
  hifzQuality: HifzQuality;
  isHafiz: boolean;
}

/** POST /admin/student-requests/manual-create — live `data` includes `id` (often a string). */
export interface CreatedManualStudent {
  id: number | null;
  email?: string;
  name?: string;
}

/** POST /center/{centerId}/generate-registration-link. `shareUrl` is the only string the dialog may show or copy. */
export interface RegistrationLinkResult {
  shareUrl: string;
  expiresAt?: string | null;
}

/** Build admin `/identify?term=&token=` once. Nest host and `/signup/student` are not kept. */
export function mapRegistrationLinkResult(
  data: unknown,
  appOrigin?: string,
): RegistrationLinkResult {
  return mapInviteRegistrationLink(data, appOrigin);
}

export function coerceStudentId(value: number | string | undefined | null): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function optionalString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}

export function mapCreatedManualStudent(data: unknown): CreatedManualStudent {
  if (!data || typeof data !== 'object') {
    return { id: null };
  }
  const row = data as Record<string, unknown>;
  const coerced = coerceStudentId(row['id'] as number | string | undefined | null);
  return {
    id: coerced > 0 ? coerced : null,
    email: optionalString(row['email']),
    name: optionalString(row['name']),
  };
}

function firstPositiveId(...values: unknown[]): number | null {
  for (const value of values) {
    const coerced = coerceStudentId(value as number | string | undefined | null);
    if (coerced > 0) {
      return coerced;
    }
  }
  return null;
}

/**
 * Approve often has `data: null`. When a body is present, id may be nested
 * (`userId` / `studentId` / `user.id`) — prefer any of those over email-match.
 */
export function mapApprovedStudent(data: unknown): CreatedManualStudent {
  const created = mapCreatedManualStudent(data);
  if (created.id || !data || typeof data !== 'object') {
    return created;
  }
  const row = data as Record<string, unknown>;
  const user =
    row['user'] && typeof row['user'] === 'object'
      ? (row['user'] as Record<string, unknown>)
      : null;
  return {
    id: firstPositiveId(row['userId'], row['studentId'], user?.['id']),
    email: created.email ?? optionalString(user?.['email']),
    name: created.name ?? optionalString(user?.['name']),
  };
}

/** When Nest `data` is null / missing id, keep form email+name so email-match fallback can run. */
export function mergeCreatedWithForm(
  created: CreatedManualStudent,
  form: { email?: string; fullName?: string; name?: string },
): CreatedManualStudent {
  return {
    id: created.id,
    email: created.email ?? optionalString(form.email),
    name: created.name ?? optionalString(form.fullName) ?? optionalString(form.name),
  };
}

export function findStudentIdByEmail(
  students: Array<{ id: number; email?: string }>,
  email: string,
): number | null {
  const needle = email.trim().toLowerCase();
  if (!needle) {
    return null;
  }
  const match = students.find((student) => (student.email ?? '').trim().toLowerCase() === needle);
  return match && match.id > 0 ? match.id : null;
}

export function mapAssignedStudentHalqa(raw: unknown): AssignedStudentHalqa | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = coerceStudentId(row['id'] as number | string);
  const name = optionalString(row['name']);
  if (id <= 0 || !name) {
    return null;
  }
  return { id, name };
}

export function mapActiveStudent(raw: unknown): ActiveStudent {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: coerceStudentId(row['id'] as number | string),
    name: optionalString(row['name']) ?? '',
    email: optionalString(row['email']),
    phone: optionalString(row['phone']),
    identificationNumber: optionalString(row['identificationNumber']),
    passportNumber: optionalString(row['passportNumber']),
    birthDate: optionalString(row['birthDate']),
    address: optionalString(row['address']),
    nationality: optionalString(row['nationality']),
    isActive: typeof row['isActive'] === 'boolean' ? row['isActive'] : undefined,
    createdAt: optionalString(row['createdAt']),
    updatedAt: optionalString(row['updatedAt']),
    halqa: mapAssignedStudentHalqa(row['halqa']),
  };
}

/**
 * Live active-students `data` is usually an array; contract also allows a paginated
 * wrapper (`items` + page/limit/totalItems). Normalize so callers always get rows.
 */
export function unwrapActiveStudentsPayload(data: unknown): ActiveStudent[] {
  if (Array.isArray(data)) {
    return data.map(mapActiveStudent);
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['items', 'results', 'students', 'records', 'data'] as const) {
      if (Array.isArray(record[key])) {
        return record[key].map(mapActiveStudent);
      }
    }
  }
  return [];
}
