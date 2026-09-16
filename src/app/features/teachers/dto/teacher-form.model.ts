import {
  CreateManualTeacherPayload,
  TeacherAgeGroup,
  TeacherQualification,
  TeacherTajweedLevel,
  TeacherWorkPeriod,
  UpdateTeacherProfilePayload,
} from '../../../core/api/models/teacher.model';
import { TeacherDetailViewModel } from './teacher-detail-view.model';

export type YesNo = '' | 'true' | 'false';

export type TeacherFormMode = 'add' | 'edit';

/** Shared add/edit form model. `nationality`/`address`/`birthDate` only apply in `add` mode
 * (UpdateTeacherProfileDto does not accept them). */
export interface TeacherFormModel {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  address: string;
  birthDate: string;
  qualification: TeacherQualification | '';
  hasCertificate: YesNo;
  numberOfMemorizedJuz: number | null;
  hasSanadInHifz: YesNo;
  hasIjazahInHifz: YesNo;
  tajweedLevel: TeacherTajweedLevel | '';
  ageGroups: TeacherAgeGroup[];
  workPeriods: TeacherWorkPeriod[];
}

export function createEmptyTeacherForm(): TeacherFormModel {
  return {
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    address: '',
    birthDate: '',
    qualification: '',
    hasCertificate: '',
    numberOfMemorizedJuz: null,
    hasSanadInHifz: '',
    hasIjazahInHifz: '',
    tajweedLevel: '',
    ageGroups: [],
    workPeriods: [],
  };
}

export function mapTeacherDetailToForm(detail: TeacherDetailViewModel): TeacherFormModel {
  return {
    fullName: detail.name,
    email: detail.email,
    phone: detail.phone,
    nationality: '',
    address: '',
    birthDate: '',
    qualification: (detail.qualification as TeacherQualification | null) ?? '',
    hasCertificate: boolToYesNo(detail.hasCertificate),
    numberOfMemorizedJuz: detail.numberOfMemorizedJuz,
    hasSanadInHifz: boolToYesNo(detail.hasSanadInHifz),
    hasIjazahInHifz: boolToYesNo(detail.hasIjazahInHifz),
    tajweedLevel: (detail.tajweedLevel as TeacherTajweedLevel | null) ?? '',
    ageGroups: detail.ageGroups as TeacherAgeGroup[],
    workPeriods: detail.workPeriods as TeacherWorkPeriod[],
  };
}

export function validateTeacherForm(form: TeacherFormModel, mode: TeacherFormMode): string | null {
  if (!form.fullName.trim()) {
    return 'الاسم الكامل مطلوب';
  }
  if (!form.email.trim()) {
    return 'البريد الإلكتروني مطلوب';
  }
  if (!form.phone.trim()) {
    return 'رقم الجوال مطلوب';
  }
  if (mode === 'add') {
    if (!form.nationality.trim()) {
      return 'الجنسية مطلوبة';
    }
    if (!form.address.trim()) {
      return 'العنوان مطلوب';
    }
    if (!form.birthDate.trim()) {
      return 'تاريخ الميلاد مطلوب';
    }
  }
  if (!form.qualification) {
    return 'اختر المؤهل الأكاديمي';
  }
  if (!form.hasCertificate) {
    return 'اختر حالة شهادة مكنون';
  }
  if (form.numberOfMemorizedJuz === null || form.numberOfMemorizedJuz < 0 || form.numberOfMemorizedJuz > 30) {
    return 'أدخل عدد الأجزاء المحفوظة (0 إلى 30)';
  }
  if (!form.hasSanadInHifz) {
    return 'اختر حالة السند';
  }
  if (!form.hasIjazahInHifz) {
    return 'اختر حالة الإجازة';
  }
  if (!form.tajweedLevel) {
    return 'اختر مستوى التجويد';
  }
  if (!form.ageGroups.length) {
    return 'اختر فئة عمرية واحدة على الأقل';
  }
  if (!form.workPeriods.length) {
    return 'اختر فترة عمل واحدة على الأقل';
  }
  return null;
}

function boolToYesNo(value: boolean | null | undefined): YesNo {
  if (value === null || value === undefined) {
    return '';
  }
  return value ? 'true' : 'false';
}

function yesNoToBool(value: YesNo): boolean {
  return value === 'true';
}

/** ponytail: manual-create requires a password, but the teacher activates via the emailed
 * link — a random placeholder satisfies the API without exposing/collecting credentials in
 * the admin UI. Ceiling: not cryptographically reviewed; fine since it is never surfaced or
 * relied upon for login (activation flow resets it). */
function generateTempPassword(): string {
  const random = () => Math.random().toString(36).slice(2, 10);
  return `Tf-${random()}${random()}A1`;
}

export function buildCreateManualPayload(form: TeacherFormModel, centerId: number): CreateManualTeacherPayload {
  return {
    teacherName: form.fullName.trim(),
    email: form.email.trim(),
    password: generateTempPassword(),
    nationality: form.nationality.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    birthDate: form.birthDate,
    qualification: form.qualification as TeacherQualification,
    hasCertificate: yesNoToBool(form.hasCertificate),
    numberOfMemorizedJuz: form.numberOfMemorizedJuz ?? 0,
    hasIjazahInHifz: yesNoToBool(form.hasIjazahInHifz),
    hasSanadInHifz: yesNoToBool(form.hasSanadInHifz),
    tajweedLevel: form.tajweedLevel as TeacherTajweedLevel,
    teachingAgeGroup: form.ageGroups,
    availableWorkPeriod: form.workPeriods,
    centerId,
  };
}

export function buildUpdateProfilePayload(form: TeacherFormModel): UpdateTeacherProfilePayload {
  return {
    name: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    qualification: form.qualification as TeacherQualification,
    hasCertificate: yesNoToBool(form.hasCertificate),
    numberOfMemorizedJuz: form.numberOfMemorizedJuz ?? 0,
    hasIjazahInHifz: yesNoToBool(form.hasIjazahInHifz),
    hasSanadInHifz: yesNoToBool(form.hasSanadInHifz),
    tajweedLevel: form.tajweedLevel as TeacherTajweedLevel,
    teachingAgeGroup: form.ageGroups,
    availableWorkPeriod: form.workPeriods,
  };
}
