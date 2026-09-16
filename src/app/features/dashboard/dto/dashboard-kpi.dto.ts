export interface DashboardKpiCard {
  label: string;
  value: string;
  meta: string;
  metaTone?: 'default' | 'success';
}

/** Mock KPI data until dashboard stats APIs land. */
export const MOCK_DASHBOARD_KPIS: DashboardKpiCard[] = [
  {
    label: 'الحلقات النشطة',
    value: '—',
    meta: 'بيانات تجريبية — سيتم الربط لاحقاً',
  },
  {
    label: 'المعلمون',
    value: '—',
    meta: 'بيانات تجريبية — سيتم الربط لاحقاً',
  },
  {
    label: 'الطلاب المسجّلون',
    value: '—',
    meta: 'بيانات تجريبية — سيتم الربط لاحقاً',
  },
  {
    label: 'طلبات معلّقة',
    value: '—',
    meta: 'بيانات تجريبية — سيتم الربط لاحقاً',
    metaTone: 'success',
  },
];
