import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { createEmptyRejectForm, RejectReEnrollmentFormModel, validateRejectForm } from '../dto';

@Component({
  selector: 'app-reject-re-enrollment-dialog',
  imports: [FormsModule],
  templateUrl: './reject-re-enrollment-dialog.html',
})
export class RejectReEnrollmentDialogComponent {
  readonly visible = input(false);
  readonly studentName = input('');
  readonly submitting = input(false);
  readonly serverError = input<string | null>(null);

  readonly confirmed = output<RejectReEnrollmentFormModel>();
  readonly closed = output<void>();

  protected form: RejectReEnrollmentFormModel = createEmptyRejectForm();
  protected localError: string | null = null;

  protected close(): void {
    if (this.submitting()) {
      return;
    }
    this.resetForm();
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }

    const validationError = validateRejectForm(this.form);
    if (validationError) {
      this.localError = validationError;
      return;
    }

    this.localError = null;
    this.confirmed.emit({ rejectionReason: this.form.rejectionReason.trim() });
  }

  protected errorMessage(): string | null {
    return this.localError ?? this.serverError();
  }

  private resetForm(): void {
    this.form = createEmptyRejectForm();
    this.localError = null;
  }
}
