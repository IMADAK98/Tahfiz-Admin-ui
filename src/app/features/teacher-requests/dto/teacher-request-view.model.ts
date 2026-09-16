import { TeacherRequestApiRecord } from '../../../core/api/models/teacher-request.model';
import { coerceTeacherId } from '../../teachers/dto';

export interface TeacherRequestViewModel {
  id: number;
  name: string;
  phone: string;
  qualification: string | null;
  hasCertificate: boolean | null;
  numberOfMemorizedJuz: number | null;
  hasSanadInHifz: boolean | null;
  hasIjazahInHifz: boolean | null;
  tajweedLevel: string | null;
  ageGroups: string[];
  workPeriods: string[];
  status: string;
}

export function mapTeacherRequest(record: TeacherRequestApiRecord): TeacherRequestViewModel {
  return {
    id: coerceTeacherId(record.id),
    name: record.teacherName ?? record.name ?? '—',
    phone: record.phone ?? '—',
    qualification: record.qualification ?? null,
    hasCertificate: record.hasCertificate ?? null,
    numberOfMemorizedJuz: record.numberOfMemorizedJuz ?? null,
    hasSanadInHifz: record.hasSanadInHifz ?? null,
    hasIjazahInHifz: record.hasIjazahInHifz ?? null,
    tajweedLevel: record.tajweedLevel ?? null,
    ageGroups: record.teachingAgeGroup ?? [],
    workPeriods: record.availableWorkPeriod ?? [],
    status: record.status,
  };
}
