import { Component, inject, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { ChangeEmailDialogComponent } from './change-email-dialog/change-email-dialog';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog';
import { AdminProfileView } from './dto';
import { ProfileCredentialDialog, ProfileLoadState } from './enums';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  imports: [Button, ChangePasswordDialogComponent, ChangeEmailDialogComponent],
  templateUrl: './profile.html',
})
export class ProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);

  protected readonly ProfileLoadState = ProfileLoadState;
  protected readonly ProfileCredentialDialog = ProfileCredentialDialog;
  protected readonly loadState = signal(ProfileLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly view = signal<AdminProfileView | null>(null);
  protected readonly credentialDialog = signal(ProfileCredentialDialog.None);

  constructor() {
    this.reload();
  }

  protected openCredentialDialog(dialog: ProfileCredentialDialog): void {
    this.credentialDialog.set(dialog);
  }

  protected closeCredentialDialog(): void {
    this.credentialDialog.set(ProfileCredentialDialog.None);
  }

  protected onPasswordSaved(): void {
    this.closeCredentialDialog();
  }

  protected onEmailSaved(newEmail: string): void {
    this.closeCredentialDialog();
    const current = this.view();
    if (current) {
      this.view.set({ ...current, email: newEmail });
    }
    this.refreshProfile();
  }

  protected reload(): void {
    const userId = this.auth.getClaims()?.userId;
    if (!userId) {
      this.loadState.set(ProfileLoadState.Error);
      this.loadError.set('تعذّر تحديد المستخدم من الجلسة');
      return;
    }

    this.fetchProfile(userId, true);
  }

  private refreshProfile(): void {
    const userId = this.auth.getClaims()?.userId;
    if (!userId) {
      return;
    }
    this.fetchProfile(userId, false);
  }

  private fetchProfile(userId: number, showLoading: boolean): void {
    if (showLoading) {
      this.loadState.set(ProfileLoadState.Loading);
      this.loadError.set(null);
    }
    this.profileService.load(userId).subscribe({
      next: (profile) => {
        this.view.set(profile);
        this.loadState.set(ProfileLoadState.Ready);
      },
      error: (error: unknown) => {
        if (!showLoading) {
          return;
        }
        this.loadState.set(ProfileLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل الملف الشخصي');
      },
    });
  }
}
