import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ApiError } from '../../core/api/api-error';
import { ActiveStudent, CreatedManualStudent, RegistrationLinkResult } from '../../core/api/models/student.model';
import { AuthService } from '../../core/auth/auth.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { AssignHalqaModalComponent } from './assign-halqa-modal/assign-halqa-modal';
import { formatStudentDate } from './dto';
import { StudentsLoadState } from './enums';
import { StudentFormModalComponent } from './student-form-modal/student-form-modal';
import { StudentsService } from './students.service';

@Component({
  selector: 'app-students',
  imports: [ReactiveFormsModule, Button, InputText, StudentFormModalComponent, AssignHalqaModalComponent],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class StudentsComponent {
  private readonly studentsService = inject(StudentsService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);

  protected readonly StudentsLoadState = StudentsLoadState;
  protected readonly formatStudentDate = formatStudentDate;

  protected readonly loadState = signal(StudentsLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly students = signal<ActiveStudent[]>([]);
  protected readonly search = new FormControl('', { nonNullable: true });

  protected readonly showFormModal = signal(false);
  protected readonly showAssignModal = signal(false);
  protected readonly createdStudent = signal<CreatedManualStudent | null>(null);
  protected readonly detailStudent = signal<ActiveStudent | null>(null);

  protected readonly generatingLink = signal(false);
  protected readonly showLinkModal = signal(false);
  protected readonly linkResult = signal<RegistrationLinkResult | null>(null);
  protected readonly linkError = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  protected filteredStudents(): ActiveStudent[] {
    return this.studentsService.filterStudents(this.students(), this.search.value);
  }

  protected countLabel(): string {
    return `${this.filteredStudents().length} طالب`;
  }

  protected reload(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.loadState.set(StudentsLoadState.Error);
      this.loadError.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    this.loadState.set(StudentsLoadState.Loading);
    this.loadError.set(null);

    this.studentsService.loadActiveStudents(centerId).subscribe({
      next: (students) => {
        this.students.set(students);
        this.loadState.set(StudentsLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(StudentsLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل الطلاب');
      },
    });
  }

  protected openAddModal(): void {
    this.showFormModal.set(true);
  }

  protected closeFormModal(): void {
    this.showFormModal.set(false);
  }

  protected onStudentSaved(created: CreatedManualStudent): void {
    this.showFormModal.set(false);
    this.createdStudent.set(created);
    this.showAssignModal.set(true);
  }

  protected onAssignSkipped(): void {
    this.closeAssignModal();
    this.reload();
  }

  protected onAssignDone(): void {
    this.closeAssignModal();
    this.reload();
  }

  private closeAssignModal(): void {
    this.showAssignModal.set(false);
    this.createdStudent.set(null);
  }

  protected openDetail(student: ActiveStudent): void {
    this.detailStudent.set(student);
  }

  protected closeDetail(): void {
    this.detailStudent.set(null);
  }

  protected generateRegistrationLink(): void {
    if (this.generatingLink()) {
      return;
    }
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.linkError.set('تعذّر تحديد المركز من الجلسة');
      this.showLinkModal.set(true);
      return;
    }

    this.generatingLink.set(true);
    this.linkError.set(null);
    this.linkResult.set(null);
    this.showLinkModal.set(true);
    this.studentsService.generateRegistrationLink(centerId).subscribe({
      next: (result) => {
        this.generatingLink.set(false);
        this.linkResult.set(result);
        this.toastMessage.notifySuccess(TOAST_I18N.success.registrationLinkGenerated);
      },
      error: (error: unknown) => {
        this.generatingLink.set(false);
        this.linkError.set(
          error instanceof ApiError ? error.message : 'تعذّر إنشاء رابط التسجيل. حاول مرة أخرى.',
        );
      },
    });
  }

  protected closeLinkModal(): void {
    if (this.generatingLink()) {
      return;
    }
    this.showLinkModal.set(false);
    this.linkResult.set(null);
    this.linkError.set(null);
  }

  protected async copyRegistrationLink(): Promise<void> {
    const link = this.linkResult()?.registrationUrl?.trim();
    if (!link) {
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // ponytail: clipboard may be blocked; keep the link visible for manual copy.
    }
    this.toastMessage.notifySuccess(TOAST_I18N.success.registrationLinkCopied);
  }
}
