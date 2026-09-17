import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { map } from 'rxjs/operators';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import {
  teacherAgeGroupsLabel,
  teacherQualificationLabel,
  teacherTajweedLevelLabel,
  teacherWorkPeriodsLabel,
  yesNoLabel,
} from '../teachers/enums';
import { TeacherDetailViewModel, teacherInitial } from '../teachers/dto';
import { TeacherFormModalComponent } from '../teachers/teacher-form-modal/teacher-form-modal';
import { AssignedHalqaViewModel } from './dto';
import { TeacherDetailLoadState } from './enums';
import { TeacherDetailService } from './teacher-detail.service';

@Component({
  selector: 'app-teacher-detail',
  imports: [RouterLink, Button, TeacherFormModalComponent],
  templateUrl: './teacher-detail.html',
  styleUrl: './teacher-detail.scss',
})
export class TeacherDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly detailService = inject(TeacherDetailService);
  private readonly auth = inject(AuthService);

  protected readonly TeacherDetailLoadState = TeacherDetailLoadState;
  protected readonly teacherInitial = teacherInitial;
  protected readonly teacherQualificationLabel = teacherQualificationLabel;
  protected readonly teacherTajweedLevelLabel = teacherTajweedLevelLabel;
  protected readonly teacherAgeGroupsLabel = teacherAgeGroupsLabel;
  protected readonly teacherWorkPeriodsLabel = teacherWorkPeriodsLabel;
  protected readonly yesNoLabel = yesNoLabel;

  protected readonly teacherId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')) || 0)),
    { initialValue: 0 },
  );

  protected readonly loadState = signal(TeacherDetailLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly detail = signal<TeacherDetailViewModel | null>(null);
  protected readonly halaqat = signal<AssignedHalqaViewModel[]>([]);
  protected readonly showEditModal = signal(false);

  constructor() {
    this.reload();
  }

  protected reload(): void {
    const id = this.teacherId();
    if (!id) {
      this.loadState.set(TeacherDetailLoadState.Error);
      this.loadError.set('معرّف المعلّم غير صالح');
      return;
    }

    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.loadState.set(TeacherDetailLoadState.Error);
      this.loadError.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    this.loadState.set(TeacherDetailLoadState.Loading);
    this.loadError.set(null);

    this.detailService.loadDetail(id, centerId).subscribe({
      next: ({ detail, halaqat }) => {
        this.detail.set(detail);
        this.halaqat.set(halaqat);
        this.loadState.set(TeacherDetailLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(TeacherDetailLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل بيانات المعلّم');
      },
    });
  }

  protected openEditModal(): void {
    this.showEditModal.set(true);
  }

  protected closeEditModal(): void {
    this.showEditModal.set(false);
  }

  protected onTeacherSaved(): void {
    this.showEditModal.set(false);
    this.reload();
  }

  protected goToList(): void {
    void this.router.navigate(['/admin/teachers']);
  }
}
