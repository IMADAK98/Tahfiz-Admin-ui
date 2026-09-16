import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

@Component({
  imports: [RouterOutlet, Toast],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected toastIcon(severity?: string | null): string {
    switch (severity) {
      case 'success':
        return '✓';
      case 'info':
        return 'i';
      case 'warn':
      case 'error':
        return '!';
      default:
        return 'i';
    }
  }
}
