import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/api/api-error';
import { HalqaListItem } from '../../core/api/models/halqa.model';
import { ActiveTerm } from '../../core/api/models/term.model';
import { AuthService } from '../../core/auth/auth.service';
import { CreateHalaqaModalComponent } from './create-halaqa-modal/create-halaqa-modal';
import { HalaqatFiltersModel, createEmptyHalaqatFilters } from './dto';
import {
  HALQA_CATEGORY_OPTIONS,
  HALQA_PERIOD_OPTIONS,
  HalaqatLoadState,
  halqaCategoryLabel,
  halqaPeriodsLabel,
} from './enums';
import { HalaqatService } from './halaqat.service';

@Component({
  selector: 'app-halaqat',
  imports: [FormsModule, RouterLink, CreateHalaqaModalComponent],
  templateUrl: './halaqat.html',
  styleUrl: './halaqat.scss',
})
export class HalaqatComponent {
  private readonly halaqatService = inject(HalaqatService);
  private readonly auth = inject(AuthService);

  protected readonly HalaqatLoadState = HalaqatLoadState;
  protected readonly categoryOptions = HALQA_CATEGORY_OPTIONS;
  protected readonly periodOptions = HALQA_PERIOD_OPTIONS;
  protected readonly filters: HalaqatFiltersModel = createEmptyHalaqatFilters();

  protected readonly loadState = signal(HalaqatLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly activeTerm = signal<ActiveTerm | null>(null);
  protected readonly halaqat = signal<HalqaListItem[]>([]);
  protected readonly showCreateModal = signal(false);

  constructor() {
    this.reload();
  }

  protected categoryLabel = halqaCategoryLabel;
  protected periodsLabel = halqaPeriodsLabel;

  protected filteredHalaqat(): HalqaListItem[] {
    return this.halaqatService.filterHalaqat(this.halaqat(), this.filters);
  }

  protected filteredCountLabel(): string {
    const count = this.filteredHalaqat().length;
    if (count === 1) {
      return '1 حلقة';
    }
    if (count === 2) {
      return 'حلقتان';
    }
    if (count >= 3 && count <= 10) {
      return `${count} حلقات`;
    }
    return `${count} حلقة`;
  }

  protected formatStudentNames(names: string[]): string {
    return names.map((name) => this.shortStudentName(name)).join(' · ');
  }

  protected shortStudentName(name: string): string {
    return name.replace(/\s*بن\s+\S+\s+/u, ' ').trim();
  }

  protected reload(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.loadState.set(HalaqatLoadState.Error);
      this.loadError.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    this.loadState.set(HalaqatLoadState.Loading);
    this.loadError.set(null);

    this.halaqatService.loadPage(centerId).subscribe({
      next: ({ activeTerm, halaqat }) => {
        this.activeTerm.set(activeTerm);
        this.halaqat.set(halaqat);
        this.loadState.set(HalaqatLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(HalaqatLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل الحلقات');
      },
    });
  }

  protected openCreateModal(): void {
    if (!this.activeTerm()) {
      return;
    }
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  protected onHalaqaCreated(): void {
    this.showCreateModal.set(false);
    this.reload();
  }
}
