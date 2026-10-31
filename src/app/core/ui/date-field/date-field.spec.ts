import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DatePicker } from 'primeng/datepicker';
import { buildCreateTermPayload } from '../../../features/terms/dto/create-term-request.dto';
import { toLocalIsoDate } from '../../utils/local-date';
import { DateFieldComponent } from './date-field';

@Component({
  imports: [ReactiveFormsModule, DateFieldComponent],
  template: `
    <app-date-field [formControl]="day" inputId="day" />
    <app-date-field [formControl]="emptyNull" inputId="empty-null" />
    <app-date-field [formControl]="month" view="month" inputId="month" />
    <app-date-field [formControl]="holidays" [multiple]="true" inputId="holidays" />
  `,
})
class DateFieldHost {
  readonly day = new FormControl('2026-10-01', { nonNullable: true });
  readonly emptyNull = new FormControl<string | null>(null);
  readonly month = new FormControl('2026-10', { nonNullable: true });
  readonly holidays = new FormControl<string[]>([], { nonNullable: true });
}

describe('DateFieldComponent', () => {
  let host: DateFieldHost;
  let fixture: ComponentFixture<DateFieldHost>;
  let fields: DateFieldComponent[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateFieldHost],
    }).compileComponents();
    fixture = TestBed.createComponent(DateFieldHost);
    fixture.detectChanges();
    host = fixture.componentInstance;
    fields = fixture.debugElement
      .queryAll(By.directive(DateFieldComponent))
      .map((match) => match.componentInstance);
  });

  function pickerAt(index: number): DatePicker {
    return fixture.debugElement.queryAll(By.directive(DatePicker))[index].componentInstance;
  }

  it('round-trips a local day through writeValue and onPickerChange', () => {
    const day = fields[0];
    day.writeValue('2026-10-31');
    expect(toLocalIsoDate(day.pickerValue as Date)).toBe('2026-10-31');
    expect(host.day.value).toBe('2026-10-01');

    day.onPickerChange(new Date(2026, 9, 30));
    expect(host.day.value).toBe('2026-10-30');

    day.onPickerChange(null);
    expect(host.day.value).toBe('');
    expect(host.day.touched).toBe(false);
    day.markTouched();
    expect(host.day.touched).toBe(true);
  });

  it('keeps null as the empty value when the control was written null', () => {
    const field = fields[1];
    field.writeValue(null);
    field.onPickerChange(null);
    expect(host.emptyNull.value).toBeNull();

    field.onPickerChange(new Date(2026, 0, 5));
    expect(host.emptyNull.value).toBe('2026-01-05');
    field.onPickerChange(null);
    expect(host.emptyNull.value).toBeNull();
  });

  it('round-trips month view as yyyy-MM', () => {
    const month = fields[2];
    month.writeValue('2026-10');
    expect(toLocalIsoDate(month.pickerValue as Date)).toBe('2026-10-01');

    month.onPickerChange(new Date(2026, 10, 1));
    expect(host.month.value).toBe('2026-11');
  });

  it('emits a sorted unique string[] in multiple mode', () => {
    const holidays = fields[3];
    holidays.onPickerChange([new Date(2026, 10, 3), new Date(2026, 10, 2), new Date(2026, 10, 2)]);
    expect(host.holidays.value).toEqual(['2026-11-02', '2026-11-03']);

    holidays.writeValue(['2026-11-03', '2026-11-02', '2026-11-02']);
    const pickerDates = holidays.pickerValue as Date[];
    expect(pickerDates.map((date) => toLocalIsoDate(date))).toEqual(['2026-11-02', '2026-11-03']);
  });

  it('builds a create-term payload from the same strings the picker writes', () => {
    const day = fields[0];
    day.onPickerChange(new Date(2026, 9, 31));
    const holidays = fields[3];
    holidays.onPickerChange([new Date(2026, 10, 4), new Date(2026, 10, 2)]);

    const payload = buildCreateTermPayload(
      {
        name: 'دورة',
        startDate: host.day.value,
        endDate: '2026-12-01',
        registerationStartDate: '2026-10-01',
        registerationEndDate: '2026-11-01',
        holidayDates: host.holidays.value,
        pendingHolidayDate: '',
      },
      4,
    );

    expect(payload.startDate).toBe('2026-10-31');
    expect(payload.holidayDates).toEqual(['2026-11-02', '2026-11-04']);
    expect(JSON.stringify(payload)).toContain('"startDate":"2026-10-31"');
    if (-new Date(2026, 9, 31).getTimezoneOffset() === 180) {
      expect(new Date(2026, 9, 31).toISOString().slice(0, 10)).toBe('2026-10-30');
    }
  });

  it('writes the picker model back onto the form control', () => {
    pickerAt(0).onModelChange(new Date(2026, 9, 31));
    expect(host.day.value).toBe('2026-10-31');

    pickerAt(2).onModelChange(new Date(2026, 10, 1));
    expect(host.month.value).toBe('2026-11');

    pickerAt(3).onModelChange([
      new Date(2026, 10, 4),
      new Date(2026, 10, 2),
      new Date(2026, 10, 2),
    ]);
    expect(host.holidays.value).toEqual(['2026-11-02', '2026-11-04']);
  });

  it('disables the picker from the form control', () => {
    host.day.disable();
    expect(fields[0].pickerDisabled()).toBe(true);
    host.day.enable();
    expect(fields[0].pickerDisabled()).toBe(false);
  });
});
