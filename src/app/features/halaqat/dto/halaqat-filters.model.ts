import { HalqaCategory, HalqaPeriod } from '../../../core/api/models/halqa.model';

export interface HalaqatFiltersModel {
  search: string;
  category: HalqaCategory | '';
  period: HalqaPeriod | '';
}

export function createEmptyHalaqatFilters(): HalaqatFiltersModel {
  return {
    search: '',
    category: '',
    period: '',
  };
}
