import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { TeacherDeleteHalqaLink, teacherDeleteConfirmError } from '../dto';
import { TeachersService } from '../teachers.service';

@Component({
  selector: 'app-delete-teacher-modal',
  imports: [RouterLink],
  templateUrl: './delete-teacher-modal.html',
  styleUrl: './delete-teacher-modal.scss',
})
export class DeleteTeacherModalComponent {
  private readonly teachersService = inject(TeachersService);
  private readonly toastMessage = inject(ToastMessageService);

  readonly visible = input(false);
  readonly teacherName = input('');
  readonly profileId = input<number | null>(null);
  readonly deleted = output<void>();
  readonly closed = output<void>();

  protected readonly deleting = signal(false);
  protected readonly confirmError = signal<string | null>(null);
  protected readonly conflictHalqas = signal<TeacherDeleteHalqaLink[]>([]);

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      untracked(() => {
        this.deleting.set(false);
        this.confirmError.set(null);
        this.conflictHalqas.set([]);
      });
    });
  }

  protected onBackdropClick(): void {
    if (this.deleting()) {
      return;
    }
    this.close();
  }

  protected close(): void {
    if (this.deleting()) {
      return;
    }
    this.confirmError.set(null);
    this.conflictHalqas.set([]);
    this.closed.emit();
  }

  protected confirm(): void {
    const profileId = this.profileId();
    if (!profileId || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.confirmError.set(null);
    this.conflictHalqas.set([]);
    this.teachersService.deactivateTeacher(profileId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.teacherDeleted);
        this.deleted.emit();
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        const result = teacherDeleteConfirmError(error);
        this.confirmError.set(result.message);
        this.conflictHalqas.set(result.halqas);
      },
    });
  }
}
