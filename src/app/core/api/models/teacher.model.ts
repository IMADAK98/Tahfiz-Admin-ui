export interface ActiveTeacher {
  id: number;
  name: string;
  email: string;
  identificationNumber?: string;
  passportNumber?: string;
}

export interface ActiveTeachersQuery {
  page?: number;
  limit?: number;
  search?: string;
}
