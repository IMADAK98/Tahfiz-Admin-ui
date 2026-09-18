export interface DashboardKpiCard {
  label: string;
  value: string;
  meta: string;
  metaTone?: 'default' | 'success';
}

/** Mock KPI data — preview-aligned demo values until dashboard stats APIs land. */
export const MOCK_DASHBOARD_KPIS: DashboardKpiCard[] = [
  {
    label: 'الحلقات النشطة',
    value: '1',
    meta: 'TEST Halqa CoS · تجريبي',
  },
  {
    label: 'المعلمون',
    value: '1',
    meta: 'userId 25 · تجريبي',
  },
  {
    label: 'الطلاب المسجّلون',
    value: '1',
    meta: 'userId 26 · تجريبي',
  },
  {
    label: 'طلبات معلّقة',
    value: '0',
    meta: 'لا طلبات بانتظار المراجعة',
    metaTone: 'success',
  },
];
