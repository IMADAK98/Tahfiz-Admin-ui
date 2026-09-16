export interface ActiveStudent {
  id: number;
  name: string;
  email?: string;
  identificationNumber?: string;
  passportNumber?: string;
}

export interface ActiveStudentsQuery {
  page?: number;
  limit?: number;
  search?: string;
}
