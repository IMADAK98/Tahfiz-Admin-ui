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

/** POST /center/{centerId}/generate-registration-link */
export interface RegistrationLinkResult {
  registrationUrl: string;
  expiresAt?: string | null;
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
