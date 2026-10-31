import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { providePrimeNG } from 'primeng/config';
import { DatePicker } from 'primeng/datepicker';
import { buildCreateTermPayload } from '../../../features/terms/dto/create-term-request.dto';
import { toLocalIsoDate, toLocalYearMonth } from '../../utils/local-date';
import { DateFieldComponent } from './date-field';
import { arabicPrimeNgTranslation } from '../primeng-ar-locale';

@Component({
  imports: [ReactiveFormsModule, DateFieldComponent],
  template: `
    <app-date-field
      [formControl]="day"
      inputId="day"
      [min]="dayMin()"
      [max]="dayMax()"
      [disabledDays]="dayDisabled()"
    />
    <app-date-field [formControl]="emptyNull" inputId="empty-null" />
    <app-date-field
      [formControl]="month"
      view="month"
      inputId="month"
      [min]="monthMin()"
      [max]="monthMax()"
    />
    <app-date-field
      [formControl]="holidays"
      [multiple]="true"
      inputId="holidays"
      [min]="holidayMin()"
      [max]="holidayMax()"
      [disabledDays]="holidayDisabled()"
    />
  `,
})
class DateFieldHost {
  readonly day = new FormControl('2026-10-01', { nonNullable: true });
  readonly emptyNull = new FormControl<string | null>(null);
  readonly month = new FormControl('2026-10', { nonNullable: true });
  readonly holidays = new FormControl<string[]>([], { nonNullable: true });
  readonly dayMin = signal<string | null>(null);
  readonly dayMax = signal<string | null>(null);
  readonly dayDisabled = signal<number[] | null>(null);
  readonly monthMin = signal<string | null>(null);
  readonly monthMax = signal<string | null>(null);
  readonly holidayMin = signal<string | null>(null);
  readonly holidayMax = signal<string | null>(null);
  readonly holidayDisabled = signal<number[] | null>(null);
}

describe('DateFieldComponent', () => {
  let host: DateFieldHost;
  let fixture: ComponentFixture<DateFieldHost>;
  let fields: DateFieldComponent[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateFieldHost],
      providers: [providePrimeNG({ translation: arabicPrimeNgTranslation })],
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

  it('shows the button bar with Arabic today and clear labels', () => {
    for (const picker of [pickerAt(0), pickerAt(1), pickerAt(2), pickerAt(3)]) {
      expect(picker.showButtonBar()).toBe(true);
      expect(picker.translate('today')).toBe('اليوم');
      expect(picker.translate('clear')).toBe('مسح');
    }
  });

  it('today emits the local calendar day and clear restores the empty sentinel', () => {
    const today = new Date();
    pickerAt(0).onTodayButtonClick(new Event('click'));
    expect(host.day.value).toBe(toLocalIsoDate(today));
    expect(host.day.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const utcDay = today.toISOString().slice(0, 10);
    if (utcDay !== toLocalIsoDate(today)) {
      expect(host.day.value).not.toBe(utcDay);
    }

    pickerAt(0).onClearButtonClick(new Event('click'));
    expect(host.day.value).toBe('');

    pickerAt(1).onClearButtonClick(new Event('click'));
    expect(host.emptyNull.value).toBeNull();

    pickerAt(2).onTodayButtonClick(new Event('click'));
    expect(host.month.value).toBe(toLocalYearMonth(today));
    pickerAt(2).onClearButtonClick(new Event('click'));
    expect(host.month.value).toBe('');
  });

  it('skips today when the day is disabled or outside min/max, and clear empties holidays', () => {
    const today = new Date();
    host.holidayDisabled.set([today.getDay()]);
    host.dayMax.set(
      toLocalIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
    );
    host.monthMax.set('2000-01');
    fixture.detectChanges();

    host.holidays.setValue(['2026-11-02', '2026-11-04']);
    pickerAt(3).onTodayButtonClick(new Event('click'));
    expect(host.holidays.value).toEqual(['2026-11-02', '2026-11-04']);

    host.day.setValue('1999-06-01');
    pickerAt(0).onTodayButtonClick(new Event('click'));
    expect(host.day.value).toBe('1999-06-01');

    host.month.setValue('1999-06');
    pickerAt(2).onTodayButtonClick(new Event('click'));
    expect(host.month.value).toBe('1999-06');

    pickerAt(3).onClearButtonClick(new Event('click'));
    expect(host.holidays.value).toEqual([]);
  });

  it('appends today in multiple mode when the day is allowed', () => {
    const today = toLocalIsoDate(new Date());
    host.holidayDisabled.set([]);
    host.holidayMin.set('2000-01-01');
    host.holidayMax.set('2099-12-31');
    fixture.detectChanges();

    fields[3].writeValue(['2000-01-02']);
    pickerAt(3).onTodayButtonClick(new Event('click'));
    expect(host.holidays.value).toEqual(['2000-01-02', today].sort());

    pickerAt(3).onTodayButtonClick(new Event('click'));
    expect(host.holidays.value).toEqual(['2000-01-02', today].sort());
  });

  it('labels backward navigation as previous for the month, year, and decade', () => {
    const dayPicker = pickerAt(0);
    expect(dayPicker.prevIconAriaLabel).toBe('الشهر السابق');
    expect(dayPicker.nextIconAriaLabel).toBe('الشهر التالي');

    const monthPicker = pickerAt(2);
    expect(monthPicker.prevIconAriaLabel).toBe('السنة السابقة');
    expect(monthPicker.nextIconAriaLabel).toBe('السنة التالية');
    monthPicker.currentView.set('year');
    expect(monthPicker.prevIconAriaLabel).toBe('العقد السابق');
    expect(monthPicker.nextIconAriaLabel).toBe('العقد التالي');
  });

  it('puts previous before next in the popup and renders اليوم / مسح', async () => {
    // jsdom never fills the panel ViewChild, and PrimeNG focuses it on a timer after nav.
    pickerAt(0).updateFocus = () => {};
    pickerAt(2).updateFocus = () => {};
    const input = fixture.nativeElement.querySelector('#day') as HTMLInputElement;
    input.focus();
    input.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panel = document.querySelector('.tahfiz-datepicker-panel');
    expect(panel).toBeTruthy();
    const prev = panel!.querySelector('.p-datepicker-prev-button') as HTMLButtonElement;
    const next = panel!.querySelector('.p-datepicker-next-button') as HTMLButtonElement;
    expect(prev.getAttribute('aria-label')).toBe('الشهر السابق');
    expect(next.getAttribute('aria-label')).toBe('الشهر التالي');
    expect(prev.querySelector('[data-p-icon="chevron-right"]')).toBeTruthy();
    expect(next.querySelector('[data-p-icon="chevron-left"]')).toBeTruthy();
    expect(prev.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const bar = panel!.querySelector('.p-datepicker-buttonbar');
    expect(bar?.textContent).toContain('اليوم');
    expect(bar?.textContent).toContain('مسح');

    const monthLabel = () =>
      panel!.querySelector('.p-datepicker-select-month')?.textContent?.trim();
    expect(monthLabel()).toBe('أكتوبر');
    prev.click();
    fixture.detectChanges();
    expect(monthLabel()).toBe('سبتمبر');
    next.click();
    fixture.detectChanges();
    expect(monthLabel()).toBe('أكتوبر');

    pickerAt(0).hideOverlay();
    const monthInput = fixture.nativeElement.querySelector('#month') as HTMLInputElement;
    monthInput.focus();
    monthInput.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const monthPanel = [...document.querySelectorAll('.tahfiz-datepicker-panel')].find(
      (node) => !node.querySelector('.p-datepicker-day-view'),
    );
    expect(monthPanel).toBeTruthy();
    const yearPrev = monthPanel!.querySelector('.p-datepicker-prev-button') as HTMLButtonElement;
    const yearNext = monthPanel!.querySelector('.p-datepicker-next-button') as HTMLButtonElement;
    expect(yearPrev.getAttribute('aria-label')).toBe('السنة السابقة');
    expect(yearNext.getAttribute('aria-label')).toBe('السنة التالية');
    expect(yearPrev.querySelector('[data-p-icon="chevron-right"]')).toBeTruthy();
    expect(yearNext.querySelector('[data-p-icon="chevron-left"]')).toBeTruthy();
    expect(
      yearPrev.compareDocumentPosition(yearNext) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const yearLabel = () =>
      monthPanel!.querySelector('.p-datepicker-select-year')?.textContent?.trim();
    expect(yearLabel()).toBe('2026');
    yearPrev.click();
    fixture.detectChanges();
    expect(yearLabel()).toBe('2025');
    yearNext.click();
    fixture.detectChanges();
    expect(yearLabel()).toBe('2026');

    const yearTitle = monthPanel!.querySelector('.p-datepicker-select-year') as HTMLButtonElement;
    yearTitle.click();
    fixture.detectChanges();
    const decadePrev = monthPanel!.querySelector('.p-datepicker-prev-button') as HTMLButtonElement;
    const decadeNext = monthPanel!.querySelector('.p-datepicker-next-button') as HTMLButtonElement;
    expect(decadePrev.getAttribute('aria-label')).toBe('العقد السابق');
    expect(decadeNext.getAttribute('aria-label')).toBe('العقد التالي');
    expect(decadePrev.querySelector('[data-p-icon="chevron-right"]')).toBeTruthy();
    expect(decadeNext.querySelector('[data-p-icon="chevron-left"]')).toBeTruthy();
  });

  it('escape closes the open popup and does not reach document bubble listeners', async () => {
    pickerAt(0).updateFocus = () => {};
    const input = fixture.nativeElement.querySelector('#day') as HTMLInputElement;
    input.focus();
    input.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(pickerAt(0).overlayVisible()).toBe(true);

    let bubbled = 0;
    const onBubble = () => {
      bubbled += 1;
    };
    document.addEventListener('keydown', onBubble);

    const panel = document.querySelector('.tahfiz-datepicker-panel') as HTMLElement;
    panel.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(bubbled).toBe(0);
    expect(pickerAt(0).overlayVisible()).toBe(false);
    expect(document.activeElement).toBe(input);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(bubbled).toBe(1);
    document.removeEventListener('keydown', onBubble);
  });
});
