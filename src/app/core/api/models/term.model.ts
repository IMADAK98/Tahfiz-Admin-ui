export type TermStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED';

export interface ActiveTerm {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  registerationStartDate: string;
  registerationEndDate: string;
  status: TermStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
