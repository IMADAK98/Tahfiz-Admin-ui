import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ApiError } from '../../core/api/api-error';
import { ActiveTeacher } from '../../core/api/models/teacher.model';
import { AuthService } from '../../core/auth/auth.service';
import { TeacherDetailViewModel, TeacherFormMode, teacherInitial } from './dto';
import { TeachersLoadState } from './enums';
import { TEACHERS_I18N } from './i18n/teachers-i18n';
import { TeacherFormModalComponent } from './teacher-form-modal/teacher-form-modal';
import { TeachersService } from './teachers.service';

@Component({
  selector: 'app-teachers',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Button,
    InputText,
    TeacherFormModalComponent,
  ],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class TeachersComponent {
  private readonly teachersService = inject(TeachersService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly TeachersLoadState = TeachersLoadState;
  protected readonly teacherInitial = teacherInitial;
  protected readonly i18n = TEACHERS_I18N;

  protected readonly loadState = signal(TeachersLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly teachers = signal<ActiveTeacher[]>([]);
  protected readonly search = new FormControl('', { nonNullable: true });

  protected readonly showFormModal = signal(false);
  protected readonly formMode = signal<TeacherFormMode>('add');
  protected readonly editingTeacher = signal<TeacherDetailViewModel | null>(null);
  protected readonly editLoadingId = signal<number | null>(null);

  constructor() {
    this.reload();
  }

  protected filteredTeachers(): ActiveTeacher[] {
    return this.teachersService.filterTeachers(this.teachers(), this.search.value);
  }

  protected countLabel(): string {
    return `${this.filteredTeachers().length} معلّم`;
  }

  protected reload(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.loadState.set(TeachersLoadState.Error);
      this.loadError.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    this.loadState.set(TeachersLoadState.Loading);
    this.loadError.set(null);

    this.teachersService.loadActiveTeachers(centerId).subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
        this.loadState.set(TeachersLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(TeachersLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل المعلمين');
      },
    });
  }

  protected openAddModal(): void {
    this.formMode.set('add');
    this.editingTeacher.set(null);
    this.showFormModal.set(true);
  }

  protected openEditModal(teacher: ActiveTeacher): void {
    if (this.editLoadingId() !== null) {
      return;
    }
    this.editLoadingId.set(teacher.id);
    this.teachersService.fetchTeacherDetail(teacher.id).subscribe({
      next: (detail) => {
        this.editLoadingId.set(null);
        this.formMode.set('edit');
        this.editingTeacher.set(detail);
        this.showFormModal.set(true);
      },
      error: () => {
        this.editLoadingId.set(null);
      },
    });
  }

  protected isEditLoading(teacher: ActiveTeacher): boolean {
    return this.editLoadingId() === teacher.id;
  }

  protected closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingTeacher.set(null);
  }

  protected onTeacherSaved(): void {
    this.showFormModal.set(false);
    this.editingTeacher.set(null);
    this.reload();
  }

  protected goToRequests(): void {
    void this.router.navigate(['/admin/teacher-requests']);
  }

  protected goToDetail(teacher: ActiveTeacher): void {
    void this.router.navigate(['/admin/teachers', teacher.id]);
  }
}
