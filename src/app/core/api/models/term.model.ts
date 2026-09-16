export type TermStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED';

export interface ActiveTerm {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  registerationStartDate: string;
  registerationEndDate: string;
  status: TermStatus;
  holidayDates?: string[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

/** PUT /term/{id} body — partial update only (no status field in OpenAPI). */
export interface UpdateTermPayload {
  startDate?: string;
  endDate?: string;
  registerationStartDate?: string;
  registerationEndDate?: string;
  holidayDates?: string[];
}

/** POST /term body — API typo registeration preserved. */
export interface CreateTermPayload {
  name: string;
  startDate: string;
  endDate: string;
  registerationStartDate: string;
  registerationEndDate: string;
  holidayDates: string[];
  centerId: number;
}
