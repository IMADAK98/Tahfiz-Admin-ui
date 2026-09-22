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
    isActive?: boolean;
    user?: { id?: number | string; name?: string; firstName?: string; lastName?: string };
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
  teacherId: number | null;
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

/** GET /center/{centerId}/active-halqas — OpenAPI sample is thin; map live fields when present. */
export interface ActiveHalqaOption {
  id: number;
  name: string;
  studentLimit: number | null;
  studentsCount: number | null;
  remainingCapacity: number | null;
}

function coerceHalqaId(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function coerceOptionalCount(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function mapActiveHalqaOption(raw: unknown): ActiveHalqaOption {
  const row = (raw ?? {}) as Record<string, unknown>;
  const studentLimit = coerceOptionalCount(row['studentLimit']);
  const studentsCount = coerceOptionalCount(row['studentsCount']);
  const remainingCapacity =
    studentLimit != null && studentsCount != null ? studentLimit - studentsCount : null;
  return {
    id: coerceHalqaId(row['id']),
    name: typeof row['name'] === 'string' ? row['name'] : '',
    studentLimit,
    studentsCount,
    remainingCapacity,
  };
}

export function unwrapActiveHalqasPayload(data: unknown): ActiveHalqaOption[] {
  const rows = collectHalqaRows(data);
  return rows.map(mapActiveHalqaOption).filter((halqa) => halqa.id > 0);
}

function collectHalqaRows(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['items', 'results', 'halqas', 'records', 'data'] as const) {
      if (Array.isArray(record[key])) {
        return record[key];
      }
    }
  }
  return [];
}

/** Hide full ḥalaqas when capacity is countable. Unknown capacity stays selectable. */
export function selectableActiveHalqas(halqas: ActiveHalqaOption[]): ActiveHalqaOption[] {
  return halqas.filter((halqa) => halqa.remainingCapacity == null || halqa.remainingCapacity > 0);
}
