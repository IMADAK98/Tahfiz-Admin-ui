export type StudyPlanItemType = 'HIFZ' | 'TATHBEET' | 'MURAJAA';

export type StudyPlanDirection = 'NORMAL' | 'REVERSE' | 'AUTO';

export type StudyPlanAmountType = 'LINE' | 'PAGE';

export interface StudyPlanPersonRef {
  id: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface StudyPlanItemApiRecord {
  id: number | string;
  type: StudyPlanItemType;
  direction: StudyPlanDirection;
  fromSurahNumber?: number;
  fromSurah?: number;
  fromSurahName?: string;
  fromAyah?: number;
  toSurahNumber?: number;
  toSurah?: number;
  toSurahName?: string;
  toAyah?: number;
  amountType: StudyPlanAmountType;
  amountValue: number;
}

export interface StudyPlanSummaryApiRecord {
  id: number | string;
  name: string | null;
  assignedToHalqaId?: number;
  studentsCount?: number;
  studyPlanItems?: StudyPlanItemApiRecord[];
}

export interface StudyPlanDetailsApiRecord {
  id: number | string;
  name: string;
  studyPlanItems: StudyPlanItemApiRecord[];
  students: StudyPlanPersonRef[];
}

export interface CreateStudyPlanItemPayload {
  type: StudyPlanItemType;
  direction: StudyPlanDirection;
  fromSurah: number;
  fromAyah: number;
  toSurah?: number;
  toAyah?: number;
  amountType: StudyPlanAmountType;
  amountValue: number;
}

export interface CreateStudyPlanPayload {
  name: string;
  halqaId: number;
  studyPlanItems: CreateStudyPlanItemPayload[];
  studentIds?: number[];
}

export interface UpdateStudyPlanItemPayload {
  type?: StudyPlanItemType;
  direction?: StudyPlanDirection;
  fromSurahNumber?: number;
  fromAyah?: number;
  amountType?: StudyPlanAmountType;
  amountValue?: number;
}

export interface UpdateStudyPlanPayload {
  name?: string;
}

export interface AssignStudentsPayload {
  studentIds: number[];
}

export interface UnassignStudentsPayload {
  studentIds: number[];
}

export interface EnrollStudentsPayload {
  studentsIds: number[];
}

export interface HalqaStudentApiRecord {
  id?: number | string;
  userId?: number | string;
  name?: string;
  user?: {
    id?: number | string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface SurahApiRecord {
  id: number;
  number?: number;
  name?: string;
  arabicName?: string;
  surahName?: string;
  ayahs?: number[];
}
