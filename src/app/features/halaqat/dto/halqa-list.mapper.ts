import { HalqaApiRecord, HalqaListItem } from '../../../core/api/models/halqa.model';

function coerceId(value: number | string | undefined): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function mapHalqaApiRecord(record: HalqaApiRecord): HalqaListItem {
  const teacher =
    record.teacher ??
    record.teachers?.[0] ??
    null;

  const studentNames =
    record.students?.map((student) => student.name).filter(Boolean) ??
    record.enrollments
      ?.map((enrollment) => enrollment.user?.name)
      .filter((name): name is string => !!name) ??
    [];

  const studentsCount = record.studentsCount ?? studentNames.length;

  return {
    id: coerceId(record.id),
    name: record.name,
    category: record.category ?? null,
    periods: record.periods ?? [],
    studentLimit: record.studentLimit ?? 0,
    isActive: record.isActive ?? true,
    studentsCount,
    teacherName: teacher?.name ?? null,
    studentNames,
  };
}
