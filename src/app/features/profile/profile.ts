import { Component, inject, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { AdminProfileView } from './dto';
import { ProfileLoadState } from './enums';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  imports: [Button],
  templateUrl: './profile.html',
})
export class ProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);

  protected readonly ProfileLoadState = ProfileLoadState;
  protected readonly loadState = signal(ProfileLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly view = signal<AdminProfileView | null>(null);

  constructor() {
    this.reload();
  }

  protected reload(): void {
    const userId = this.auth.getClaims()?.userId;
    if (!userId) {
      this.loadState.set(ProfileLoadState.Error);
      this.loadError.set('تعذّر تحديد المستخدم من الجلسة');
      return;
    }

    this.loadState.set(ProfileLoadState.Loading);
    this.loadError.set(null);
    this.profileService.load(userId).subscribe({
      next: (profile) => {
        this.view.set(profile);
        this.loadState.set(ProfileLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(ProfileLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل الملف الشخصي');
      },
    });
  }
}
