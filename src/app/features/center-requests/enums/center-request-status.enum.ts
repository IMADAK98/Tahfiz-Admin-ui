export enum CenterRequestStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
}

export function isPendingCenterRequest(status: string): boolean {
  return status === CenterRequestStatus.Pending;
}

export function centerRequestStatusLabel(status: string): string {
  switch (status) {
    case CenterRequestStatus.Approved:
      return 'مقبول';
    case CenterRequestStatus.Rejected:
      return 'مرفوض';
    default:
      return 'بانتظار المراجعة';
  }
}

export function centerRequestStatusBadgeClass(status: string): string {
  switch (status) {
    case CenterRequestStatus.Approved:
      return 'badge-success';
    case CenterRequestStatus.Rejected:
      return 'badge-danger';
    default:
      return 'badge-warning';
  }
}

export function centerRequestFootHint(status: string): string {
  switch (status) {
    case CenterRequestStatus.Approved:
      return 'لا إجراءات — الطلب مقبول مسبقاً';
    case CenterRequestStatus.Rejected:
      return 'لا إجراءات — الطلب مرفوض مسبقاً';
    default:
      return 'القبول ينشئ المركز ويرسل بريد التفعيل';
  }
}
