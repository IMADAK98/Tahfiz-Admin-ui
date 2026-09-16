import { CreateHalqaPayload } from '../../../core/api/models/halqa.model';
import { CreateHalaqaFormModel } from './create-halaqa-form.model';

export function buildCreateHalaqaPayload(
  form: CreateHalaqaFormModel,
  termId: number,
): CreateHalqaPayload {
  return {
    name: form.name.trim(),
    category: form.category as CreateHalqaPayload['category'],
    periods: [form.period as CreateHalqaPayload['periods'][number]],
    studentLimit: form.studentLimit ?? 15,
    termId,
    teacherId: form.teacherId as number,
    isActive: true,
    studentsIds: form.studentIds,
  };
}
