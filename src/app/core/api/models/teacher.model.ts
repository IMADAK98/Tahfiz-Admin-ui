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
}

export interface ActiveTeachersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** OpenAPI CreatePendingTeacherRequestDto / TeacherProfile enums — verified against live tahfiz.onrender.com. */
export type TeacherQualification = 'HIGH_SCHOOL' | 'DIPLOMA' | 'BACHELOR' | 'MASTER' | 'PHD' | 'OTHER';

export type TeacherTajweedLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type TeacherAgeGroup =
  | 'PRESCHOOL'
  | 'PRIMARY_LOWER'
  | 'PRIMARY_UPPER'
  | 'MIDDLE_SCHOOL'
  | 'HIGH_SCHOOL'
  | 'UNIVERSITY'
  | 'ADULTS';

export type TeacherWorkPeriod = 'WEEKDAYS' | 'AFTER_FAJR' | 'AFTER_ASR' | 'AFTER_MAGHRIB' | 'AFTER_ISHA';

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
