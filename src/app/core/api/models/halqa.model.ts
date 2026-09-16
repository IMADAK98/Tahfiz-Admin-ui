export type HalqaCategory =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'HIGHER'
  | 'SPECIAL'
  | 'TALQIN'
  | 'TELAWAH';

export type HalqaPeriod = 'FAJR' | 'DUHUR' | 'ASR' | 'MAGHRIB' | 'ISHA' | 'ONLINE';

export interface HalqaPersonRef {
  id: number;
  name: string;
}

/** Raw halqa row from Nest — fields vary by endpoint. */
export interface HalqaApiRecord {
  id: number | string;
  name: string;
  category?: HalqaCategory;
  periods?: HalqaPeriod[];
  studentLimit?: number;
  isActive?: boolean;
  studentsCount?: number;
  teacher?: HalqaPersonRef | null;
  teachers?: HalqaPersonRef[];
  students?: HalqaPersonRef[];
  enrollments?: Array<{
    user?: { id?: number | string; name?: string };
  }>;
}

export interface HalqaListItem {
  id: number;
  name: string;
  category: HalqaCategory | null;
  periods: HalqaPeriod[];
  studentLimit: number;
  isActive: boolean;
  studentsCount: number;
  teacherName: string | null;
  studentNames: string[];
}

export interface CreateHalqaPayload {
  name: string;
  category: HalqaCategory;
  periods: HalqaPeriod[];
  studentLimit: number;
  termId: number;
  teacherId: number;
  isActive?: boolean;
  studentsIds?: number[];
}
