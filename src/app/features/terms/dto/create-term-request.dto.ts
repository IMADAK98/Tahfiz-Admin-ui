import { CreateTermPayload } from '../../../core/api/models/term.model';
import { CreateTermFormModel } from './create-term-form.model';

export function buildCreateTermPayload(
  form: CreateTermFormModel,
  centerId: number,
): CreateTermPayload {
  return {
    name: form.name.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    registerationStartDate: form.registerationStartDate,
    registerationEndDate: form.registerationEndDate,
    holidayDates: [...form.holidayDates],
    centerId,
  };
}
