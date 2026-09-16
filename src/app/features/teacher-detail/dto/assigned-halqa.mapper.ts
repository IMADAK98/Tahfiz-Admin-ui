import { HalqaApiRecord } from '../../../core/api/models/halqa.model';
import { mapHalqaApiRecord } from '../../halaqat/dto';
import { halqaCategoryLabel, halqaPeriodsLabel } from '../../halaqat/enums';
import { coerceTeacherId } from '../../teachers/dto';

export interface AssignedHalqaViewModel {
  id: number;
  name: string;
  badgeLabel: string;
}

/**
 * `GET /halqa/by-teacher-id/{id}` is locked self-only for the TEACHER role (IDOR) — admin must
 * not call it with an arbitrary id. Filter the center-scoped `GET /halqa?centerId=` list
 * client-side instead (same source halaqat.service.ts already uses as its center fallback).
 */
export function filterHalqasByTeacherId(records: HalqaApiRecord[], teacherId: number): HalqaApiRecord[] {
  return records.filter((record) => {
    if (record.teacher && coerceTeacherId(record.teacher.id) === teacherId) {
      return true;
    }
    return (record.teachers ?? []).some((teacher) => coerceTeacherId(teacher.id) === teacherId);
  });
}

export function mapAssignedHalqa(record: HalqaApiRecord): AssignedHalqaViewModel {
  const item = mapHalqaApiRecord(record);
  return {
    id: item.id,
    name: item.name,
    badgeLabel: `${halqaPeriodsLabel(item.periods)} · ${halqaCategoryLabel(item.category)}`,
  };
}
