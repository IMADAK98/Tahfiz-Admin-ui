import { HalqaApiRecord } from '../../../core/api/models/halqa.model';
import { mapHalqaApiRecord } from '../../halaqat/dto';
import { halqaCategoryLabel, halqaPeriodsLabel } from '../../halaqat/enums';

export interface AssignedHalqaViewModel {
  id: number;
  name: string;
  badgeLabel: string;
}

export function mapAssignedHalqa(record: HalqaApiRecord): AssignedHalqaViewModel {
  const item = mapHalqaApiRecord(record);
  return {
    id: item.id,
    name: item.name,
    badgeLabel: `${halqaPeriodsLabel(item.periods)} · ${halqaCategoryLabel(item.category)}`,
  };
}
