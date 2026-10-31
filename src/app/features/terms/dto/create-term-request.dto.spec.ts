import { toLocalIsoDate } from '../../../core/utils/local-date';
import { buildCreateTermPayload } from './create-term-request.dto';

describe('buildCreateTermPayload', () => {
  it('passes local yyyy-MM-dd strings through unchanged', () => {
    const picked = new Date(2026, 9, 31);
    const holidayLater = toLocalIsoDate(new Date(2026, 10, 3));
    const holidayEarlier = toLocalIsoDate(new Date(2026, 10, 2));
    const form = {
      name: 'دورة الخريف',
      startDate: toLocalIsoDate(picked),
      endDate: toLocalIsoDate(new Date(2026, 11, 1)),
      registerationStartDate: toLocalIsoDate(new Date(2026, 9, 1)),
      registerationEndDate: toLocalIsoDate(new Date(2026, 10, 1)),
      holidayDates: [holidayEarlier, holidayLater],
      pendingHolidayDate: '',
    };

    const payload = buildCreateTermPayload(form, 9);

    expect(payload).toEqual({
      name: 'دورة الخريف',
      startDate: '2026-10-31',
      endDate: '2026-12-01',
      registerationStartDate: '2026-10-01',
      registerationEndDate: '2026-11-01',
      holidayDates: ['2026-11-02', '2026-11-03'],
      centerId: 9,
    });
    expect(JSON.stringify(payload)).toBe(
      JSON.stringify({
        name: 'دورة الخريف',
        startDate: '2026-10-31',
        endDate: '2026-12-01',
        registerationStartDate: '2026-10-01',
        registerationEndDate: '2026-11-01',
        holidayDates: ['2026-11-02', '2026-11-03'],
        centerId: 9,
      }),
    );
    if (-picked.getTimezoneOffset() === 180) {
      expect(picked.toISOString().slice(0, 10)).toBe('2026-10-30');
      expect(payload.startDate).toBe('2026-10-31');
    }
  });
});
