import { HalqaApiRecord, HalqaPeriod } from '../../../core/api/models/halqa.model';
import {
  HalqaStudentApiRecord,
  StudyPlanDetailsApiRecord,
  StudyPlanItemApiRecord,
  StudyPlanSummaryApiRecord,
  SurahApiRecord,
} from '../../../core/api/models/study-plan.model';
import { studyPlanAmountLabel } from '../enums';
import { coerceId, personDisplayName } from './person.helpers';

export interface HalaqaDetailViewModel {
  id: number;
  name: string;
  category: HalqaApiRecord['category'] | null;
  periods: HalqaPeriod[];
  isActive: boolean;
  studentLimit: number;
  teacherId: number | null;
  teacherName: string | null;
}

export interface HalaqaStudentViewModel {
  id: number;
  name: string;
}

export interface StudyPlanItemViewModel {
  id: number;
  type: StudyPlanItemApiRecord['type'];
  direction: StudyPlanItemApiRecord['direction'];
  fromSurahNumber: number;
  fromSurahName: string;
  fromAyah: number;
  toSurahNumber: number | null;
  toSurahName: string | null;
  toAyah: number | null;
  amountType: StudyPlanItemApiRecord['amountType'];
  amountValue: number;
  rangeLabel: string;
  amountLabel: string;
  directionLabel: string;
}

export interface StudyPlanViewModel {
  id: number;
  name: string;
  students: HalaqaStudentViewModel[];
  items: StudyPlanItemViewModel[];
}

export function mapHalaqaDetail(record: HalqaApiRecord): HalaqaDetailViewModel {
  const teacher = record.teacher ?? record.teachers?.[0] ?? null;
  return {
    id: coerceId(record.id),
    name: record.name,
    category: record.category ?? null,
    periods: record.periods ?? [],
    isActive: record.isActive ?? true,
    studentLimit: record.studentLimit ?? 0,
    teacherId: teacher ? coerceId(teacher.id) : null,
    teacherName: teacher?.name ?? null,
  };
}

export function mapHalqaStudent(record: HalqaStudentApiRecord): HalaqaStudentViewModel {
  const id = coerceId(record.id ?? record.userId ?? record.user?.id);
  return {
    id,
    name: personDisplayName(record),
  };
}

export function mapStudyPlanDetails(
  record: StudyPlanDetailsApiRecord,
  surahNames: Map<number, string>,
): StudyPlanViewModel {
  return {
    id: coerceId(record.id),
    name: record.name,
    students: (record.students ?? []).map((student) => ({
      id: coerceId(student.id),
      name: personDisplayName(student),
    })),
    items: (record.studyPlanItems ?? []).map((item) => mapStudyPlanItem(item, surahNames)),
  };
}

export function mapStudyPlanSummaryItems(
  record: StudyPlanSummaryApiRecord,
  surahNames: Map<number, string>,
): StudyPlanItemViewModel[] {
  return (record.studyPlanItems ?? []).map((item) => mapStudyPlanItem(item, surahNames));
}

function mapStudyPlanItem(
  item: StudyPlanItemApiRecord,
  surahNames: Map<number, string>,
): StudyPlanItemViewModel {
  const fromSurahNumber = item.fromSurahNumber ?? item.fromSurah ?? 1;
  const fromSurahName = item.fromSurahName ?? surahNames.get(fromSurahNumber) ?? `سورة ${fromSurahNumber}`;
  const toSurahNumber = item.toSurahNumber ?? item.toSurah ?? null;
  const toSurahName =
    item.toSurahName ?? (toSurahNumber ? (surahNames.get(toSurahNumber) ?? `سورة ${toSurahNumber}`) : null);

  return {
    id: coerceId(item.id),
    type: item.type,
    direction: item.direction,
    fromSurahNumber,
    fromSurahName,
    fromAyah: item.fromAyah ?? 1,
    toSurahNumber,
    toSurahName,
    toAyah: item.toAyah ?? null,
    amountType: item.amountType,
    amountValue: item.amountValue,
    rangeLabel: formatFromRange(fromSurahName, item.fromAyah ?? 1),
    amountLabel: studyPlanAmountLabel(item.amountType, item.amountValue),
    directionLabel: item.direction === 'REVERSE' ? 'عكس' : 'عادي',
  };
}

export function formatFromRange(surahName: string, ayah: number): string {
  return `من سورة ${surahName}، الآية ${ayah}`;
}

export function buildSurahNameMap(surahs: SurahApiRecord[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const surah of surahs) {
    const number = surah.number ?? surah.id;
    const name = surah.arabicName ?? surah.name ?? String(number);
    map.set(number, name);
  }
  return map;
}

export function surahSelectLabel(number: number, name: string): string {
  return `${number} — ${name}`;
}
