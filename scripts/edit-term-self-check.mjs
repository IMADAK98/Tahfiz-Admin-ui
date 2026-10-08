/** ponytail: edit-term rules, PUT body, and Nest PR #13 409 parsing. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TermEditConflictError,
  readTermEditConflict,
} from '../src/app/core/api/term-edit-conflict.ts';
import {
  WEEKEND_HOLIDAY_ERROR,
  buildUpdateTermPayload,
  changedTermRows,
  editTermFormFromTerm,
  holidayAddError,
  inspectEditTermForm,
  isFrozenHoliday,
  isTermStartLocked,
} from '../src/app/features/terms/dto/edit-term-validation.ts';

const TODAY = '2026-10-08';

const running = editTermFormFromTerm({
  name: 'دورة الفصل الأول 1448',
  startDate: '2026-09-06T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  registerationStartDate: '2026-08-20T00:00:00.000Z',
  registerationEndDate: '2026-09-30T00:00:00.000Z',
  holidayDates: ['2026-09-23T00:00:00.000Z', '2026-10-01', '2026-11-18', '2026-12-02'],
});

assert.equal(running.startDate, '2026-09-06');
assert.equal(running.pendingHolidayDate, '');
assert.deepEqual(running.holidayDates, ['2026-09-23', '2026-10-01', '2026-11-18', '2026-12-02']);
assert.equal(isTermStartLocked(running.startDate, TODAY), true);
assert.equal(isFrozenHoliday('2026-09-23', running.holidayDates, TODAY), true);
assert.equal(isFrozenHoliday('2026-10-01', running.holidayDates, TODAY), true);
assert.equal(isFrozenHoliday('2026-11-18', running.holidayDates, TODAY), false);
assert.equal(isFrozenHoliday('2026-10-05', running.holidayDates, TODAY), false);

const runningCheck = inspectEditTermForm(running, { today: TODAY, startLocked: true });
assert.deepEqual(runningCheck.errors, {});
assert.equal(runningCheck.endValid, true);

const lockedPayload = buildUpdateTermPayload(running, true);
assert.equal('startDate' in lockedPayload, false);
assert.equal('pendingHolidayDate' in lockedPayload, false);
assert.equal('centerId' in lockedPayload, false);
assert.deepEqual(lockedPayload.holidayDates, running.holidayDates);

const upcoming = editTermFormFromTerm({
  name: 'دورة الفصل الثاني 1448',
  startDate: '2026-11-01',
  endDate: '2027-02-25',
  registerationStartDate: '2026-10-01',
  registerationEndDate: '2026-10-29',
  holidayDates: ['2026-11-05', '2026-12-02', '2026-12-24', '2027-01-07'],
});
assert.equal(isTermStartLocked(upcoming.startDate, TODAY), false);
assert.deepEqual(inspectEditTermForm(upcoming, { today: TODAY, startLocked: false }).errors, {});

const openPayload = buildUpdateTermPayload(upcoming, false);
assert.equal(openPayload.startDate, '2026-11-01');
assert.equal('centerId' in openPayload, false);

const errorsForm = {
  ...upcoming,
  startDate: '2026-11-08',
  endDate: '2026-02-25',
};
const errors = inspectEditTermForm(errorsForm, { today: TODAY, startLocked: false });
assert.equal(errors.errors['endDate'], 'تاريخ النهاية يجب ألا يسبق تاريخ البداية');
assert.equal(errors.endValid, false);
assert.equal(errors.errors['registerationEndDate'], undefined);
assert.deepEqual(errors.outsideHolidays, ['2026-11-05']);
assert.equal(errors.errors['holidayDates'], 'الإجازة يجب أن تكون ضمن مدة الدورة: 5 نوفمبر 2026');
assert.equal(
  holidayAddError('2026-11-13', errorsForm, errors.endValid),
  'لا يمكن إضافة إجازة يوم الجمعة أو السبت',
);
assert.equal(
  holidayAddError('2026-11-14', errorsForm, errors.endValid),
  'لا يمكن إضافة إجازة يوم الجمعة أو السبت',
);
assert.equal(holidayAddError('', errorsForm, errors.endValid), 'اختر تاريخًا أولاً');
assert.equal(holidayAddError('2026-12-02', errorsForm, errors.endValid), 'هذا التاريخ مضاف مسبقًا');
assert.equal(
  holidayAddError('2026-11-04', errorsForm, errors.endValid),
  'الإجازة يجب أن تكون ضمن مدة الدورة',
);

const pastStart = inspectEditTermForm(
  { ...upcoming, startDate: '2026-10-01' },
  { today: TODAY, startLocked: false },
);
assert.equal(pastStart.errors['startDate'], 'تاريخ البداية لا يمكن أن يكون في الماضي');

const endBeforeToday = inspectEditTermForm(
  { ...running, endDate: '2026-10-01' },
  { today: TODAY, startLocked: true },
);
assert.equal(endBeforeToday.errors['endDate'], 'تاريخ النهاية لا يمكن أن يكون قبل اليوم');

const regPastTerm = inspectEditTermForm(
  { ...upcoming, registerationEndDate: '2027-03-01' },
  { today: TODAY, startLocked: false },
);
assert.equal(
  regPastTerm.errors['registerationEndDate'],
  'نهاية التسجيل يجب ألا تتجاوز نهاية الدورة',
);

const regOrder = inspectEditTermForm(
  { ...upcoming, registerationStartDate: '2026-11-01', registerationEndDate: '2026-10-01' },
  { today: TODAY, startLocked: false },
);
assert.equal(regOrder.errors['registerationStartDate'], 'بداية التسجيل يجب ألا تتجاوز نهايتها');

assert.equal(
  inspectEditTermForm({ ...running, name: '  ' }, { today: TODAY, startLocked: true }).errors[
    'name'
  ],
  'اسم الدورة مطلوب',
);

const extended = buildUpdateTermPayload(
  { ...running, endDate: '2027-01-14', holidayDates: [...running.holidayDates, '2027-01-07'] },
  true,
);
assert.deepEqual(
  changedTermRows(
    {
      name: running.name,
      startDate: '2026-09-06T00:00:00.000Z',
      endDate: '2026-12-31',
      registerationStartDate: running.registerationStartDate,
      registerationEndDate: running.registerationEndDate,
      holidayDates: running.holidayDates,
    },
    extended,
  ),
  ['end', 'holidays'],
);

const nestConflict = {
  statusCode: 409,
  message: 'توجد أيام مسجّل فيها حضور أو تقدّم',
  error: 'Conflict',
  code: 'TERM_EDIT_CONFLICTS_WITH_RECORDED_DATA',
  affectedDates: ['2026-10-06', '2026-10-05'],
};

assert.deepEqual(readTermEditConflict({ status: 409, error: nestConflict }), {
  affectedDates: ['2026-10-05', '2026-10-06'],
});

assert.equal(
  readTermEditConflict({
    status: 409,
    error: { ...nestConflict, code: undefined, affectedDates: ['2026-10-05'] },
  }),
  null,
);

assert.equal(
  readTermEditConflict({
    status: 400,
    error: {
      statusCode: 400,
      message: 'لا يمكن إضافة إجازة يوم الجمعة أو السبت',
      error: 'Bad Request',
    },
  }),
  null,
);

assert.equal(
  readTermEditConflict({
    status: 200,
    error: {
      statusCode: 200,
      message: 'OK',
      data: { id: 12, status: 'ACTIVE', holidayDates: ['2026-10-01'] },
    },
  }),
  null,
);

assert.deepEqual(
  readTermEditConflict({
    status: 409,
    error: {
      statusCode: 409,
      code: 'TERM_EDIT_CONFLICTS_WITH_RECORDED_DATA',
      data: { affectedDates: ['2026-10-05T21:00:00.000Z'] },
    },
  }),
  { affectedDates: ['2026-10-05'] },
);

const thrown = new TermEditConflictError(['2026-10-05T12:00:00.000Z', '2026-10-05']);
assert.deepEqual(readTermEditConflict(thrown), { affectedDates: ['2026-10-05'] });

assert.equal(holidayAddError('2026-11-13', upcoming, true), WEEKEND_HOLIDAY_ERROR);

const createModal = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../src/app/features/terms/create-term-modal/create-term-modal.ts',
  ),
  'utf8',
);
assert.match(createModal, /isWeekendHoliday\(date\)/);
assert.match(createModal, /WEEKEND_HOLIDAY_ERROR/);

console.log('edit-term-self-check: ok');
