import { TeacherUserApiRecord } from '../../../core/api/models/teacher.model';
import { coerceTeacherId } from './teacher-id.helpers';

/** Full teacher record used by the detail page and by the edit modal (list + detail entry points). */
export interface TeacherDetailViewModel {
  id: number;
  /** teacherProfile.id — required for PATCH /teacher-profile/{id}; may differ from the user id. */
  profileId: number | null;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  qualification: string | null;
  hasCertificate: boolean | null;
  numberOfMemorizedJuz: number | null;
  hasSanadInHifz: boolean | null;
  hasIjazahInHifz: boolean | null;
  tajweedLevel: string | null;
  ageGroups: string[];
  workPeriods: string[];
}

export function mapTeacherUserRecord(record: TeacherUserApiRecord): TeacherDetailViewModel {
  const profile = record.teacherProfile ?? null;
  return {
    id: coerceTeacherId(record.id),
    profileId: profile ? coerceTeacherId(profile.id) : null,
    name: record.name,
    email: record.email,
    phone: record.phone ?? '',
    isActive: record.isActive ?? true,
    qualification: profile?.qualification ?? null,
    hasCertificate: profile?.hasCertificate ?? null,
    numberOfMemorizedJuz: profile?.numberOfMemorizedJuz ?? null,
    hasSanadInHifz: profile?.hasSanadInHifz ?? null,
    hasIjazahInHifz: profile?.hasIjazahInHifz ?? null,
    tajweedLevel: profile?.tajweedLevel ?? null,
    ageGroups: profile?.teachingAgeGroup ?? [],
    workPeriods: profile?.availableWorkPeriod ?? [],
  };
}
