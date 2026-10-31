import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import {
  parseLocalIsoDate,
  parseLocalYearMonth,
  toLocalIsoDate,
  toLocalYearMonth,
} from '../../utils/local-date';

export type DateFieldView = 'date' | 'month';
/** Single fields keep `''` or `null` (whichever the control was written with). Multiple is `string[]`. */
export type DateFieldValue = string | string[] | null;

@Component({
  selector: 'app-date-field',
  imports: [DatePicker],
  templateUrl: './date-field.html',
  styleUrl: './date-field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true,
    },
  ],
})
export class DateFieldComponent implements ControlValueAccessor {
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly view = input<DateFieldView>('date');
  readonly disabledDays = input<readonly number[] | null>(null);
  readonly disabledDates = input<readonly string[] | null>(null);
  readonly placeholder = input('');
  readonly inputId = input('');
  readonly multiple = input(false);
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly required = input(false);
  readonly describedBy = input('');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly picker = viewChild(DatePicker);
  private readonly formDisabled = signal(false);
  private emptySentinel: '' | null = '';
  private emittedKey = JSON.stringify('');
  private onChange: (value: DateFieldValue) => void = () => {};
  private onTouched: () => void = () => {};

  pickerValue: Date | Date[] | null = null;
  readonly pickerDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly dateFormat = computed(() => (this.view() === 'month' ? 'yy-mm' : 'yy-mm-dd'));
  protected readonly minDate = computed(() => boundDate(this.min()));
  protected readonly maxDate = computed(() => boundDate(this.max()));
  protected readonly blockedWeekdays = computed(() => {
    const days = this.disabledDays();
    return days?.length ? [...days] : undefined;
  });
  protected readonly blockedDates = computed(() => {
    const dates = (this.disabledDates() ?? []).filter((iso) => ISO_DAY.test(iso));
    return dates.length ? dates.map((iso) => parseLocalIsoDate(iso)) : undefined;
  });

  constructor() {
    effect(() => {
      this.picker();
      const describedBy = this.describedBy();
      const input = this.host.nativeElement.querySelector('input');
      if (!input) {
        return;
      }
      if (describedBy) {
        input.setAttribute('aria-describedby', describedBy);
      } else {
        input.removeAttribute('aria-describedby');
      }
    });
    afterNextRender(() => {
      const picker = this.picker();
      if (!picker) {
        return;
      }
      picker.registerOnChange((value: Date | Date[] | null) => this.onPickerChange(value));
      picker.registerOnTouched(() => this.markTouched());
      picker.writeValue(this.pickerValue);
      // PrimeNG's Today forces selectable:true and clamps onto min/max, so Fri/Sat
      // and out-of-range days get written. Own the two footer buttons instead.
      picker.onTodayButtonClick = (event: Event) => this.applyToday(event);
      picker.onClearButtonClick = (event: Event) => this.applyClear(event);
    });
  }

  writeValue(value: DateFieldValue): void {
    const normalized = this.normalize(value);
    this.emittedKey = JSON.stringify(normalized);
    this.pickerValue = toPickerDates(normalized);
    this.picker()?.writeValue(this.pickerValue);
  }

  registerOnChange(fn: (value: DateFieldValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  onPickerChange(value: Date | Date[] | null): void {
    const normalized = this.fromPicker(value);
    this.pickerValue = toPickerDates(normalized);
    const key = JSON.stringify(normalized);
    if (key === this.emittedKey) {
      return;
    }
    this.emittedKey = key;
    this.onChange(normalized);
  }

  markTouched(): void {
    this.onTouched();
  }

  private applyToday(event: Event): void {
    event.preventDefault();
    if (this.pickerDisabled()) {
      return;
    }
    const today = new Date();
    if (this.view() === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      if (!this.isMonthAllowed(monthStart)) {
        return;
      }
      this.commitPicker(monthStart, true);
      return;
    }
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!this.isDayAllowed(day)) {
      return;
    }
    if (this.multiple()) {
      const current = Array.isArray(this.pickerValue) ? this.pickerValue : [];
      const iso = toLocalIsoDate(day);
      if (!current.some((date) => toLocalIsoDate(date) === iso)) {
        this.commitPicker([...current, day], false);
      }
      return;
    }
    this.commitPicker(day, true);
  }

  private applyClear(event: Event): void {
    event.preventDefault();
    if (this.pickerDisabled()) {
      return;
    }
    this.commitPicker(null, true);
  }

  private commitPicker(value: Date | Date[] | null, close: boolean): void {
    this.onPickerChange(value);
    this.picker()?.writeValue(this.pickerValue);
    if (close) {
      this.picker()?.hideOverlay();
    }
  }

  private isDayAllowed(date: Date): boolean {
    const min = boundDate(this.min());
    const max = boundDate(this.max());
    if (min && date < startOfDay(min)) {
      return false;
    }
    if (max && date > startOfDay(max)) {
      return false;
    }
    if (this.disabledDays()?.includes(date.getDay())) {
      return false;
    }
    return !(this.disabledDates() ?? []).includes(toLocalIsoDate(date));
  }

  private isMonthAllowed(date: Date): boolean {
    const month = toLocalYearMonth(date);
    const min = this.min()?.slice(0, 7);
    const max = this.max()?.slice(0, 7);
    if (min && month < min) {
      return false;
    }
    if (max && month > max) {
      return false;
    }
    return true;
  }

  private normalize(value: DateFieldValue): DateFieldValue {
    if (Array.isArray(value) || this.multiple()) {
      return uniqueSorted(Array.isArray(value) ? value : []);
    }
    if (value == null || value === '') {
      this.emptySentinel = value === null ? null : '';
      return this.emptySentinel;
    }
    return value;
  }

  private fromPicker(value: Date | Date[] | null): DateFieldValue {
    if (this.multiple()) {
      const dates = Array.isArray(value)
        ? value.filter((item): item is Date => item instanceof Date)
        : value instanceof Date
          ? [value]
          : [];
      return uniqueSorted(dates.map((date) => toLocalIsoDate(date)));
    }
    if (!(value instanceof Date)) {
      return this.emptySentinel;
    }
    return this.view() === 'month' ? toLocalYearMonth(value) : toLocalIsoDate(value);
  }
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function boundDate(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  if (ISO_DAY.test(value)) {
    return parseLocalIsoDate(value);
  }
  if (ISO_MONTH.test(value)) {
    return parseLocalYearMonth(value);
  }
  return undefined;
}

function toPickerDates(value: DateFieldValue): Date | Date[] | null {
  if (Array.isArray(value)) {
    return value.map((iso) => parseLocalIsoDate(iso));
  }
  if (value == null || value === '') {
    return null;
  }
  return ISO_MONTH.test(value) ? parseLocalYearMonth(value) : parseLocalIsoDate(value);
}

function uniqueSorted(dates: readonly string[]): string[] {
  return [...new Set(dates.filter((iso) => ISO_DAY.test(iso)))].sort();
}
