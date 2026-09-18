/** GET /center/{centerId}/dashboard-cards — live `data` field names. */
export interface DashboardCards {
  activeHalqasCount: number;
  teachersCount: number;
  activeStudentsCount: number;
  pendingStudentRequestsCount: number;
  pendingTeacherRequestsCount: number;
}
