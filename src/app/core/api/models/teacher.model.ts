/** Nest landing on GET /center/{centerId}/active-teachers — missing/[] until Render ships it. */
export interface AssignedHalqa {
  id: number;
  name: string;
}

/** GET /center/{centerId}/active-teachers · available-teachers — flattened User + qualification. */
export interface ActiveTeacher {
  id: number;
  name: string;
  email: string;
  identificationNumber?: string;
  passportNumber?: string;
  phone?: string;
  isActive?: boolean;
  qualification?: TeacherQualification | string;
  nationality?: string;
  address?: string;
  birthDate?: string;
  /** Assigned ḥalaqas for the list cell. Empty when Nest omits the field or sends []. */
  halqas: AssignedHalqa[];
}

export interface ActiveTeachersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** OpenAPI CreatePendingTeacherRequestDto / TeacherProfile enums — verified against live tahfiz.onrender.com. */
export type TeacherQualification =
  'HIGH_SCHOOL' | 'DIPLOMA' | 'BACHELOR' | 'MASTER' | 'PHD' | 'OTHER';

export type TeacherTajweedLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type TeacherAgeGroup =
  | 'PRESCHOOL'
  | 'PRIMARY_LOWER'
  | 'PRIMARY_UPPER'
  | 'MIDDLE_SCHOOL'
  | 'HIGH_SCHOOL'
  | 'UNIVERSITY'
  | 'ADULTS';

export type TeacherWorkPeriod =
  'WEEKDAYS' | 'AFTER_FAJR' | 'AFTER_ASR' | 'AFTER_MAGHRIB' | 'AFTER_ISHA';

/** TeacherProfile entity — nested under User.teacherProfile, also GET /teacher-profile/{id}. */
export interface TeacherProfileApiRecord {
  id: number | string;
  qualification: TeacherQualification | string;
  hasCertificate: boolean;
  numberOfMemorizedJuz: number;
  hasIjazahInHifz: boolean;
  hasSanadInHifz: boolean;
  tajweedLevel: TeacherTajweedLevel | string;
  teachingAgeGroup: (TeacherAgeGroup | string)[];
  availableWorkPeriod: (TeacherWorkPeriod | string)[];
  createdAt?: string;
  updatedAt?: string;
}

/** GET /users/teachers/by-id/{id} — User entity with nested teacherProfile. Ids may be strings. */
export interface TeacherUserApiRecord {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  identificationNumber?: string | null;
  passportNumber?: string | null;
  address?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  isActive?: boolean;
  teacherProfile?: TeacherProfileApiRecord | null;
}

/** POST /pending-teacher-request/manual-create — CreatePendingTeacherRequestDto (all fields required). */
export interface CreateManualTeacherPayload {
  teacherName: string;
  email: string;
  password: string;
  nationality: string;
  phone: string;
  address: string;
  birthDate: string;
  qualification: TeacherQualification;
  hasCertificate: boolean;
  numberOfMemorizedJuz: number;
  hasIjazahInHifz: boolean;
  hasSanadInHifz: boolean;
  tajweedLevel: TeacherTajweedLevel;
  teachingAgeGroup: TeacherAgeGroup[];
  availableWorkPeriod: TeacherWorkPeriod[];
  centerId: number;
}

/** PATCH /teacher-profile/{profileId} — UpdateTeacherProfileDto (partial; no identificationNumber support). */
export interface UpdateTeacherProfilePayload {
  teacherName?: string;
  email?: string;
  phone?: string;
  qualification?: TeacherQualification;
  hasCertificate?: boolean;
  numberOfMemorizedJuz?: number;
  hasIjazahInHifz?: boolean;
  hasSanadInHifz?: boolean;
  tajweedLevel?: TeacherTajweedLevel;
  teachingAgeGroup?: TeacherAgeGroup[];
  availableWorkPeriod?: TeacherWorkPeriod[];
}

function coerceId(value: unknown): number {
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

/** Coerce Nest `halqas[]` (string ids, missing, null) into list rows. */
export function mapAssignedHalqas(raw: unknown): AssignedHalqa[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const mapped: AssignedHalqa[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = coerceId(row['id']);
    const name = typeof row['name'] === 'string' ? row['name'].trim() : '';
    if (id > 0 && name) {
      mapped.push({ id, name });
    }
  }
  return mapped;
}

export function mapActiveTeacher(raw: unknown): ActiveTeacher {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: coerceId(row['id']),
    name: optionalString(row['name']) ?? '',
    email: optionalString(row['email']) ?? '',
    identificationNumber: optionalString(row['identificationNumber']),
    passportNumber: optionalString(row['passportNumber']),
    phone: optionalString(row['phone']),
    isActive: typeof row['isActive'] === 'boolean' ? row['isActive'] : undefined,
    qualification: optionalString(row['qualification']),
    nationality: optionalString(row['nationality']),
    address: optionalString(row['address']),
    birthDate: optionalString(row['birthDate']),
    halqas: mapAssignedHalqas(row['halqas']),
  };
}
