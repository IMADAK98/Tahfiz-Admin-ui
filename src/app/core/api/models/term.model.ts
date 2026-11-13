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

/**
 * GET /term row. Live 2026-11-07: HTTP 200 bare array, not `{ data }` and not paginated.
 * `center` and `termDays` are present on the wire; report reads do not use them.
 */
export interface TermListItem extends ActiveTerm {
  holidayDates: string[];
  center: unknown;
  termDays: unknown;
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

/** PUT /term/:id body — same spelling. startDate omitted once the term has started. */
export interface UpdateTermPayload {
  name?: string;
  startDate?: string;
  endDate?: string;
  registerationStartDate?: string;
  registerationEndDate?: string;
  holidayDates?: string[];
}
