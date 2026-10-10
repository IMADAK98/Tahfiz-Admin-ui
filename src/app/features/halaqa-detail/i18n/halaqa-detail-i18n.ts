/** i18n keys for halaqa-detail validation + success toasts. */
export const HALAQA_DETAIL_I18N = {
  validation: {
    pickCategory: 'halaqaDetail.validation.pickCategory',
    pickPeriod: 'halaqaDetail.validation.pickPeriod',
    pickTeacher: 'halaqaDetail.validation.pickTeacher',
    studentLimit: 'halaqaDetail.validation.studentLimit',
    planName: 'halaqaDetail.validation.planName',
    fromSurah: 'halaqaDetail.validation.fromSurah',
    fromAyah: 'halaqaDetail.validation.fromAyah',
    amount: 'halaqaDetail.validation.amount',
    pickStudent: 'halaqaDetail.validation.pickStudent',
    centerUnknown: 'halaqaDetail.validation.centerUnknown',
  },
  success: {
    planCreated: 'halaqaDetail.success.planCreated',
    studentsEnrolled: 'halaqaDetail.success.studentsEnrolled',
    planItemAdded: 'halaqaDetail.success.planItemAdded',
    planItemDeleted: 'halaqaDetail.success.planItemDeleted',
    planDeleted: 'halaqaDetail.success.planDeleted',
    studentsAssigned: 'halaqaDetail.success.studentsAssigned',
    studentUnassigned: 'halaqaDetail.success.studentUnassigned',
  },
  confirm: {
    progressKept: 'halaqaDetail.confirm.progressKept',
  },
  edit: {
    computedOnSave: 'halaqaDetail.edit.computedOnSave',
  },
  errors: {
    itemIsLast: 'halaqaDetail.errors.itemIsLast',
  },
} as const;
