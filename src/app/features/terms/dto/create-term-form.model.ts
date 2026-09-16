export interface CreateTermFormModel {
  name: string;
  startDate: string;
  endDate: string;
  registerationStartDate: string;
  registerationEndDate: string;
  holidayDates: string[];
  pendingHolidayDate: string;
}

export function createEmptyCreateTermForm(): CreateTermFormModel {
  return {
    name: '',
    startDate: '',
    endDate: '',
    registerationStartDate: '',
    registerationEndDate: '',
    holidayDates: [],
    pendingHolidayDate: '',
  };
}
