import { Component, inject, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { CenterProfileView } from './dto';
import { CenterProfileLoadState } from './enums';
import { CenterProfileService } from './center-profile.service';

@Component({
  selector: 'app-center-profile',
  imports: [Button],
  templateUrl: './center-profile.html',
})
export class CenterProfileComponent {
  private readonly centerProfile = inject(CenterProfileService);
  private readonly auth = inject(AuthService);

  protected readonly CenterProfileLoadState = CenterProfileLoadState;
  protected readonly loadState = signal(CenterProfileLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly view = signal<CenterProfileView | null>(null);

  constructor() {
    this.reload();
  }

  protected reload(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.loadState.set(CenterProfileLoadState.Error);
      this.loadError.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    this.loadState.set(CenterProfileLoadState.Loading);
    this.loadError.set(null);
    this.centerProfile.load(centerId).subscribe({
      next: (profile) => {
        this.view.set(profile);
        this.loadState.set(CenterProfileLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(CenterProfileLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل بيانات المركز');
      },
    });
  }
}
