import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-system-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './system-admin-shell.html',
  styleUrl: './system-admin-shell.scss',
})
export class SystemAdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);
  protected readonly displayName = signal('مدير النظام');
  protected readonly avatarInitial = signal('ن');

  logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      complete: () => {
        this.loggingOut.set(false);
        void this.router.navigate(['/login']);
      },
    });
  }
}
