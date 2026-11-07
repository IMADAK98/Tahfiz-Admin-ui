import { Component, computed, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import type { ReportTermRef } from './dto/report-term.dto';
import { reportTermStatusLabel } from './enums/report-term-status-label';
import { formatTermBoundsAr } from './report-term-context';

@Component({
  selector: 'app-report-term-picker',
  imports: [ReactiveFormsModule, Select],
  templateUrl: './report-term-picker.html',
  styleUrl: './report-term-picker.scss',
})
export class ReportTermPickerComponent {
  readonly terms = input<ReportTermRef[]>([]);
  readonly selectedTermId = input<number | null>(null);
  readonly heading = input<string | null>(null);
  readonly readOnly = input(false);
  readonly termSelected = output<number>();

  protected readonly control = new FormControl<number | null>(null);
  protected readonly options = computed(() =>
    this.terms().map((term) => ({
      id: term.id,
      optionLabel: `${term.name} · ${reportTermStatusLabel(term.status)}`,
    })),
  );
  protected readonly bounds = computed(() => {
    const id = this.selectedTermId();
    const term = this.terms().find((item) => item.id === id) ?? null;
    return term && this.readOnly() ? formatTermBoundsAr(term) : null;
  });

  constructor() {
    effect(() => {
      const id = this.selectedTermId();
      if (this.control.value !== id) {
        this.control.setValue(id, { emitEvent: false });
      }
    });
    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => {
      if (id == null || id === this.selectedTermId()) {
        return;
      }
      this.termSelected.emit(id);
    });
  }
}
