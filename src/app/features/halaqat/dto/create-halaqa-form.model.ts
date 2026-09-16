import { HalqaCategory, HalqaPeriod } from '../../../core/api/models/halqa.model';

export interface CreateHalaqaFormModel {
  name: string;
  category: HalqaCategory | '';
  period: HalqaPeriod | '';
  studentLimit: number | null;
  teacherId: number | null;
  studentIds: number[];
}

export function createEmptyCreateHalaqaForm(): CreateHalaqaFormModel {
  return {
    name: '',
    category: '',
    period: '',
    studentLimit: 15,
    teacherId: null,
    studentIds: [],
  };
}
